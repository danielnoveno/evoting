import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { sendCommitReminderEmail, sendElectionResultsEmail, sendDeadlineReminderEmail } from '@/lib/email/send'
import { fetchVoteCountsViaAlchemy, fetchCandidateCountViaAlchemy, isAlchemyConfigured } from '@/lib/alchemy-rpc'
import { notifyWallets } from '@/app/api/_lib/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function getCronSecret() {
  return process.env.NOTIFICATION_CRON_SECRET?.trim()
    || process.env.CRON_SECRET?.trim()
    || ''
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://e-votein.netlify.app'
}

function getPonderGraphqlUrl(): string | null {
  const raw = process.env.PONDER_URL?.trim() || process.env.NEXT_PUBLIC_PONDER_URL?.trim()
  if (!raw) return null
  return raw.endsWith('/graphql') ? raw : `${raw.replace(/\/$/, '')}/graphql`
}

function toDatetimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getDate()}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// ─── Configurable timing (minutes) ───────────────────────────────────────────
// Set via env vars for testing. Production defaults: 30 min / 60 min.

function envMinutes(key: string, fallback: number): number {
  const raw = process.env[key]?.trim()
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function getCommitReminderWindowMinutes() {
  return envMinutes('COMMIT_REMINDER_WINDOW_MINUTES', 30)
}

function getResultsLookbackMinutes() {
  return envMinutes('RESULTS_LOOKBACK_MINUTES', 60)
}

function getDeadlineReminderWindowMinutes() {
  return envMinutes('DEADLINE_REMINDER_WINDOW_MINUTES', 60)
}

// ─── Deduplication ───────────────────────────────────────────────────────────
// Uses notification_jobs with channel='email'. Dedup by template_key + proposal_draft_id
// within a time window to avoid sending the same notification twice.

async function wasRecentlySent(
  client: NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>,
  templateKey: string,
  proposalDraftId: string,
  windowMs: number,
  channel: 'email' | 'in_app' = 'email',
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString()
  const { count } = await client
    .schema('app')
    .from('notification_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('channel', channel)
    .eq('template_key', templateKey)
    .eq('status', 'sent')
    .eq('payload->>proposalDraftId', proposalDraftId)
    .gte('created_at', since)
  return (count ?? 0) > 0
}

async function markSent(
  client: NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>,
  templateKey: string,
  proposalDraftId: string,
  extraPayload: Record<string, unknown>,
  channel: 'email' | 'in_app' = 'email',
) {
  await client.schema('app').from('notification_jobs').insert({
    channel,
    template_key: templateKey,
    status: 'sent',
    payload: { proposalDraftId, ...extraPayload },
  })
}

// ─── Commit Reminder (N min before commit STARTS) ────────────────────────────

async function processCommitReminders(
  client: NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>,
  siteUrl: string,
) {
  const windowMinutes = getCommitReminderWindowMinutes()
  const now = new Date()
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000)

  // Elections where commit_start_at is within the next N minutes
  const { data: elections } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('id, title, commit_start_at, deployed_space_address')
    .eq('status', 'deployed')
    .not('commit_start_at', 'is', null)
    .not('deployed_space_address', 'is', null)
    .gt('commit_start_at', now.toISOString())
    .lte('commit_start_at', windowEnd.toISOString())

  if (!elections || elections.length === 0) return { processed: 0, sent: 0, windowMinutes }

  let sent = 0
  for (const election of elections) {
    // Dedup: skip if already sent within the same window
    if (await wasRecentlySent(client, 'commit_reminder', election.id, windowMinutes * 60 * 1000)) continue

    const commitStartsAt = toDatetimeLocal(election.commit_start_at)

    // Get valid whitelist entries for this election
    const { data: whitelistEntries } = await client
      .schema('app')
      .from('proposal_whitelist_entries')
      .select('wallet_address')
      .eq('proposal_draft_id', election.id)
      .eq('validation_status', 'valid')

    if (!whitelistEntries || whitelistEntries.length === 0) continue

    const walletAddresses = whitelistEntries
      .map((e) => e.wallet_address?.toLowerCase())
      .filter(Boolean) as string[]

    // Find wallets that have already committed
    const { data: committedWallets } = await client
      .schema('app')
      .from('tx_audit_log')
      .select('wallet_address')
      .eq('proposal_draft_id', election.id)
      .eq('action_type', 'commit_vote')
      .eq('status', 'success')

    const committedSet = new Set(
      (committedWallets ?? []).map((r) => r.wallet_address?.toLowerCase()).filter(Boolean),
    )

    // Filter to uncommitted voters
    const uncommittedWallets = walletAddresses.filter((w) => !committedSet.has(w))
    if (uncommittedWallets.length === 0) continue

    let inAppSent = 0
    if (!await wasRecentlySent(client, 'commit_reminder_in_app', election.id, windowMinutes * 60 * 1000)) {
      inAppSent = await notifyWallets(client, {
        wallets: uncommittedWallets,
        templateKey: 'commit_reminder',
        payload: {
          proposalDraftId: election.id,
          eventType: 'commit_reminder',
          title: 'Waktu memilih segera dibuka',
          description: `Pemilihan "${election.title}" akan segera memasuki tahap pemilihan. Siapkan akun Anda.`,
          type: 'warning',
          link: election.deployed_space_address ? `/pemilih/pemilihan/${election.deployed_space_address}/pilih-kandidat` : '/pemilih',
        },
      })
      await markSent(client, 'commit_reminder_in_app', election.id, { electionTitle: election.title, sentToCount: inAppSent })
    }

    // Get voter emails from master_voters
    const { data: voters } = await client
      .schema('app')
      .from('master_voters')
      .select('email, full_name, wallet_address')
      .in('wallet_address', uncommittedWallets)
      .eq('status', 'active')

    if (!voters || voters.length === 0) continue

    let batchSent = 0
    for (const voter of voters) {
      if (!voter.email) continue
      const result = await sendCommitReminderEmail({
        email: voter.email,
        voterName: voter.full_name || 'Pemilih',
        electionTitle: election.title,
        commitEndsAt: commitStartsAt,
        siteUrl,
      })
      if (result.success) batchSent++
    }

    sent += batchSent
    await markSent(client, 'commit_reminder', election.id, {
      electionTitle: election.title,
      sentToCount: batchSent,
      inAppSentToCount: inAppSent,
    })
  }

  return { processed: elections.length, sent }
}

// ─── Deadline Reminder (N min before commit ENDS / reveal STARTS) ──────────

async function processDeadlineReminders(
  client: NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>,
  siteUrl: string,
) {
  const windowMinutes = getDeadlineReminderWindowMinutes()
  const now = new Date()
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000)

  // Elections where reveal_start_at (commit deadline) is within the next N minutes
  const { data: elections } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('id, title, reveal_start_at, deployed_space_address')
    .eq('status', 'deployed')
    .not('reveal_start_at', 'is', null)
    .not('deployed_space_address', 'is', null)
    .gt('reveal_start_at', now.toISOString())
    .lte('reveal_start_at', windowEnd.toISOString())

  if (!elections || elections.length === 0) return { processed: 0, sent: 0, windowMinutes }

  let sent = 0
  for (const election of elections) {
    if (await wasRecentlySent(client, 'deadline_reminder', election.id, windowMinutes * 60 * 1000)) continue

    const commitEndsAt = toDatetimeLocal(election.reveal_start_at)

    const { data: whitelistEntries } = await client
      .schema('app')
      .from('proposal_whitelist_entries')
      .select('wallet_address')
      .eq('proposal_draft_id', election.id)
      .eq('validation_status', 'valid')

    if (!whitelistEntries || whitelistEntries.length === 0) continue

    const walletAddresses = whitelistEntries
      .map((e) => e.wallet_address?.toLowerCase())
      .filter(Boolean) as string[]

    // Find wallets that have already committed
    const { data: committedWallets } = await client
      .schema('app')
      .from('tx_audit_log')
      .select('wallet_address')
      .eq('proposal_draft_id', election.id)
      .eq('action_type', 'commit_vote')
      .eq('status', 'success')

    const committedSet = new Set(
      (committedWallets ?? []).map((r) => r.wallet_address?.toLowerCase()).filter(Boolean),
    )

    const uncommittedWallets = walletAddresses.filter((w) => !committedSet.has(w))
    if (uncommittedWallets.length === 0) continue

    let inAppSent = 0
    if (!await wasRecentlySent(client, 'deadline_reminder_in_app', election.id, windowMinutes * 60 * 1000)) {
      inAppSent = await notifyWallets(client, {
        wallets: uncommittedWallets,
        templateKey: 'deadline_reminder',
        payload: {
          proposalDraftId: election.id,
          eventType: 'deadline_reminder',
          title: 'Batas memilih hampir habis',
          description: `Tahap pemilihan "${election.title}" akan segera berakhir. Segera berikan suara jika belum.`,
          type: 'warning',
          link: election.deployed_space_address ? `/pemilih/pemilihan/${election.deployed_space_address}/pilih-kandidat` : '/pemilih',
        },
      })
      await markSent(client, 'deadline_reminder_in_app', election.id, { electionTitle: election.title, sentToCount: inAppSent })
    }

    const { data: voters } = await client
      .schema('app')
      .from('master_voters')
      .select('email, full_name, wallet_address')
      .in('wallet_address', uncommittedWallets)
      .eq('status', 'active')

    if (!voters || voters.length === 0) continue

    let batchSent = 0
    for (const voter of voters) {
      if (!voter.email) continue
      const result = await sendDeadlineReminderEmail({
        email: voter.email,
        voterName: voter.full_name || 'Pemilih',
        electionTitle: election.title,
        commitEndsAt,
        siteUrl,
      })
      if (result.success) batchSent++
    }

    sent += batchSent
    await markSent(client, 'deadline_reminder', election.id, {
      electionTitle: election.title,
      sentToCount: batchSent,
      inAppSentToCount: inAppSent,
    })
  }

  return { processed: elections.length, sent }
}

// ─── Election Results (after ended_at) ───────────────────────────────────────

async function processElectionResults(
  client: NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>,
  siteUrl: string,
) {
  const lookbackMinutes = getResultsLookbackMinutes()
  const now = new Date()
  const lookback = new Date(now.getTime() - lookbackMinutes * 60 * 1000)

  // Elections that ended in the lookback window
  const { data: elections } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('id, title, deployed_space_address, ended_at')
    .eq('status', 'deployed')
    .not('ended_at', 'is', null)
    .not('deployed_space_address', 'is', null)
    .lte('ended_at', now.toISOString())
    .gte('ended_at', lookback.toISOString())

  if (!elections || elections.length === 0) return { processed: 0, sent: 0, lookbackMinutes }

  // Try Ponder GraphQL first, fallback to Alchemy RPC
  const graphqlUrl = getPonderGraphqlUrl()

  let sent = 0
  for (const election of elections) {
    // Dedup: skip if already sent within the same window
    if (await wasRecentlySent(client, 'election_results', election.id, lookbackMinutes * 60 * 1000)) continue

    const addr = election.deployed_space_address!

    // Get candidate count from Supabase
    const { data: candidates } = await client
      .schema('app')
      .from('proposal_candidates')
      .select('candidate_local_id, full_name')
      .eq('proposal_draft_id', election.id)
      .order('sort_order')

    if (!candidates || candidates.length === 0) continue

    let candidateResults: Array<{ candidateId: number; voteCount: number }> = []
    let dataSource = ''

    // 1. Try Ponder GraphQL
    if (graphqlUrl) {
      try {
        const response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query ElectionResults($addresses: [String]) {
                candidateResults(where: { spaceAddress_in: $addresses }, orderBy: "candidateId", orderDirection: "asc", limit: 100) {
                  items { candidateId voteCount }
                }
              }
            `,
            variables: { addresses: [addr, addr.toLowerCase()] },
          }),
        })

        if (response.ok) {
          const gqlPayload = await response.json()
          candidateResults = gqlPayload?.data?.candidateResults?.items ?? []
          if (candidateResults.length > 0) dataSource = 'ponder'
        }
      } catch {
        // Ponder failed, try Alchemy
      }
    }

    // 2. Fallback: Alchemy RPC (direct contract read)
    if (candidateResults.length === 0 && isAlchemyConfigured()) {
      try {
        candidateResults = await fetchVoteCountsViaAlchemy(addr, candidates.length)
        if (candidateResults.length > 0) dataSource = 'alchemy'
      } catch (err) {
        console.error('[Cron] Alchemy RPC fallback failed:', err)
      }
    }

    if (candidateResults.length === 0) continue

    const totalVotes = candidateResults.reduce(
      (sum: number, c: { voteCount: number }) => sum + (c.voteCount ?? 0),
      0,
    )
    if (totalVotes === 0) continue

    const nameMap = new Map(
      candidates.map((c) => [c.candidate_local_id, c.full_name]),
    )

    const sortedResults = candidateResults
      .map((cr: { candidateId: number; voteCount: number }) => {
        const localId = `candidate-${cr.candidateId}`
        const name = nameMap.get(localId) || `Kandidat ${cr.candidateId}`
        const pct = totalVotes > 0 ? ((cr.voteCount / totalVotes) * 100).toFixed(1) : '0.0'
        return { name, voteCount: cr.voteCount ?? 0, percentage: pct }
      })
      .sort((a: { voteCount: number }, b: { voteCount: number }) => b.voteCount - a.voteCount)

    const winnerName = sortedResults[0]?.name || 'Tidak diketahui'

    // Get all voters to notify
    const { data: whitelistEntries } = await client
      .schema('app')
      .from('proposal_whitelist_entries')
      .select('wallet_address')
      .eq('proposal_draft_id', election.id)
      .eq('validation_status', 'valid')

    if (!whitelistEntries || whitelistEntries.length === 0) continue

    const walletAddresses = whitelistEntries
      .map((e) => e.wallet_address?.toLowerCase())
      .filter(Boolean) as string[]

    let inAppSent = 0
    if (!await wasRecentlySent(client, 'election_results_in_app', election.id, lookbackMinutes * 60 * 1000)) {
      inAppSent = await notifyWallets(client, {
        wallets: walletAddresses,
        templateKey: 'election_results',
        payload: {
          proposalDraftId: election.id,
          eventType: 'election_results',
          title: 'Hasil pemilihan tersedia',
          description: `Hasil pemilihan "${election.title}" sudah tersedia. Pemenang sementara: ${winnerName}.`,
          type: 'success',
          link: `/pemilih/pemilihan/${election.deployed_space_address}/hasil`,
        },
      })
      await markSent(client, 'election_results_in_app', election.id, { electionTitle: election.title, sentToCount: inAppSent })
    }

    const { data: voters } = await client
      .schema('app')
      .from('master_voters')
      .select('email, full_name, wallet_address')
      .in('wallet_address', walletAddresses)
      .eq('status', 'active')

    if (!voters || voters.length === 0) continue

    let batchSent = 0
    for (const voter of voters) {
      if (!voter.email) continue
      const result = await sendElectionResultsEmail({
        email: voter.email,
        voterName: voter.full_name || 'Pemilih',
        electionTitle: election.title,
        winnerName,
        totalVotes,
        candidates: sortedResults,
        siteUrl,
      })
      if (result.success) batchSent++
    }

    sent += batchSent
    await markSent(client, 'election_results', election.id, {
      electionTitle: election.title,
      winnerName,
      totalVotes,
      sentToCount: batchSent,
      inAppSentToCount: inAppSent,
      dataSource,
    })
  }

  return { processed: elections.length, sent }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const secret = getCronSecret()
  if (secret && request.headers.get('x-cron-secret') !== secret) {
    return jsonError('Akses cron tidak diizinkan.', 401)
  }

  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const siteUrl = getSiteUrl()
  const results: Record<string, unknown> = {}

  // 1. Commit reminders (N min before commit starts)
  try {
    results.commitReminders = await processCommitReminders(client, siteUrl)
  } catch (err) {
    console.error('[Cron] Commit reminder error:', err)
    results.commitReminders = { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  // 2. Deadline reminders (N min before commit ends / reveal starts)
  try {
    results.deadlineReminders = await processDeadlineReminders(client, siteUrl)
  } catch (err) {
    console.error('[Cron] Deadline reminder error:', err)
    results.deadlineReminders = { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  // 3. Election results (after ended)
  try {
    results.electionResults = await processElectionResults(client, siteUrl)
  } catch (err) {
    console.error('[Cron] Election results error:', err)
    results.electionResults = { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  return NextResponse.json({ ok: true, results })
}
