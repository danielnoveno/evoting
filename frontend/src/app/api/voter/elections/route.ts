import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'
import { asStringArray } from '@/lib/repositories/helpers'
import { formatDateTime } from '@/lib/voter-helpers'
import { resolveSchedulePhase } from '@/lib/election-phase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProposalRow = Database['app']['Tables']['proposal_drafts']['Row']
type CandidateRow = Database['app']['Tables']['proposal_candidates']['Row']
type WhitelistRow = Database['app']['Tables']['proposal_whitelist_entries']['Row']

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function phaseLabel(phase: string): string {
  if (phase === 'commit') return 'Tahap Memilih'
  if (phase === 'reveal') return 'Tahap Konfirmasi'
  if (phase === 'ended') return 'Selesai'
  if (phase === 'suspended') return 'Ditangguhkan'
  return 'Menunggu Dibuka'
}

function deadlineLabel(row: ProposalRow, phase: string): string {
  if (phase === 'commit') return `Batas memilih ${formatDateTime(row.reveal_start_at)}`
  if (phase === 'reveal') return `Batas konfirmasi ${formatDateTime(row.ended_at)}`
  if (phase === 'registration') return `Mulai mencoblos ${formatDateTime(row.commit_start_at)}`
  return row.ended_at ? `Selesai ${formatDateTime(row.ended_at)}` : 'Selesai'
}

function mapCandidate(row: CandidateRow) {
  return {
    id: row.id,
    candidateLocalId: row.candidate_local_id,
    fullName: row.full_name,
    studentId: row.student_id,
    faculty: row.faculty,
    bio: row.bio,
    vision: row.vision,
    mission: asStringArray(row.mission),
    youtubeUrl: row.youtube_url,
    avatarPath: row.avatar_path,
    sortOrder: row.sort_order,
  }
}

function mapElection(row: ProposalRow, candidates: CandidateRow[], whitelistRows: WhitelistRow[]) {
  const phase = row.status === 'suspended'
    ? 'suspended'
    : resolveSchedulePhase({
        status: row.status,
        commitStartAt: row.commit_start_at,
        revealStartAt: row.reveal_start_at,
        endedAt: row.ended_at,
      }).phase
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    bannerImagePath: row.banner_image_path,
    organizationName: row.organization_name,
    status: row.status,
    phase,
    phaseLabel: phaseLabel(phase),
    deadlineLabel: deadlineLabel(row, phase),
    commitStartAt: row.commit_start_at,
    revealStartAt: row.reveal_start_at,
    endedAt: row.ended_at,
    candidateCount: row.candidate_count,
    participantCount: whitelistRows.length,
    deployedSpaceId: row.deployed_space_id,
    deployedSpaceAddress: row.deployed_space_address,
    deploymentTxHash: row.deployment_tx_hash,
    candidates: candidates
      .filter((candidate) => candidate.proposal_draft_id === row.id)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map(mapCandidate),
  }
}

export async function GET(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const authorization = request.headers.get('authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return jsonError('Sesi voter tidak ditemukan.', 401)

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) return jsonError('Sesi voter tidak valid atau sudah berakhir.', 401)

  const { data: profile, error: profileError } = await client
    .from('app_profiles')
    .select('wallet_address,email')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (profileError) return jsonError('Gagal memuat profil voter.', 500)

  // Accept wallet from profile, query param, or X-Wallet-Address header as fallback
  // This handles cases where app_profiles.wallet_address is not yet set but the voter
  // has a wallet stored in localStorage from the "Hubungkan Dompet" flow
  const walletFromHeader = request.headers.get('x-wallet-address')?.trim()
  const walletFromQuery = request.nextUrl.searchParams.get('wallet')?.trim()
  const walletsFromQuery = request.nextUrl.searchParams.get('wallets')?.trim()
  const profileEmail = profile?.email?.trim().toLowerCase() || userData.user.email?.trim().toLowerCase() || ''
  const { data: masterVoter } = profileEmail
    ? await client
      .from('master_voters')
      .select('wallet_address')
      .eq('email', profileEmail)
      .maybeSingle()
    : { data: null }
  
  // Collect all wallet candidates: profile wallet + query param(s) + header
  const profileWallet = profile?.wallet_address?.trim()
  const queryWallets = [walletFromQuery, ...(walletsFromQuery ? walletsFromQuery.split(',').map(w => w.trim()).filter(Boolean) : [])]
    .filter((w): w is string => Boolean(w))
  const masterVoterWallet = masterVoter?.wallet_address?.trim()
  const allWalletCandidates = Array.from(new Set([profileWallet, ...queryWallets, walletFromHeader, masterVoterWallet].filter((w): w is string => Boolean(w))))
  
  // ponytail: debug logging — remove after voter dashboard issue is resolved
  // ponytail: debug — return in response so we can see it in browser
  const debug = {
    userId: userData.user.id,
    profileEmail,
    profileWallet: profileWallet ?? null,
    masterVoterWallet: masterVoterWallet ?? null,
    walletFromHeader: walletFromHeader ?? null,
    walletFromQuery: walletFromQuery ?? null,
    allWalletCandidates,
  }
  console.log('[voter-elections] wallet-resolution', debug)
  
  if (allWalletCandidates.length === 0) return NextResponse.json({ elections: [] })

  // ponytail: normalize all wallets to lowercase for reliable .in() matching
  // Previous .or() + ilike filter returned 0 matches despite wallet existing in DB
  const normalizedWallets = allWalletCandidates
    .map((w) => w.toLowerCase().trim())
    .filter((w) => /^0x[a-f0-9]{40}$/.test(w))

  const { data: matchedWhitelist, error: whitelistError } = await client
    .from('proposal_whitelist_entries')
    .select('*')
    .or(normalizedWallets.map((wallet) => `wallet_address.ilike.${wallet}`).join(','))

  if (whitelistError) return jsonError('Gagal memeriksa whitelist voter.', 500)

  const proposalIds = Array.from(new Set((matchedWhitelist ?? []).map((entry) => entry.proposal_draft_id)))

  console.log('[voter-elections] whitelist-match', {
    matchedCount: (matchedWhitelist ?? []).length,
    proposalIds,
    matchedEntries: (matchedWhitelist ?? []).slice(0, 5).map(e => ({ wallet: e.wallet_address, proposalId: e.proposal_draft_id })),
  })

  if (proposalIds.length === 0) return NextResponse.json({ elections: [] })

  const { data: proposals, error: proposalError } = await client
    .from('proposal_drafts')
    .select('*')
    .in('id', proposalIds)
    .in('status', ['approved', 'deployed', 'archived', 'suspended'])
    .order('created_at', { ascending: false })

  if (proposalError) return jsonError('Gagal memuat pemilihan voter.', 500)

  const rows = proposals ?? []

  // ponytail: debug logging — remove after voter dashboard issue is resolved
  console.log('[voter-elections] proposals', {
    foundProposals: rows.length,
    totalProposalIds: proposalIds.length,
    statuses: rows.map(r => ({ id: r.id.slice(0, 8), status: r.status })),
  })

  if (rows.length === 0) return NextResponse.json({ elections: [] })

  const ids = rows.map((row) => row.id)
  const [{ data: candidates, error: candidatesError }, { data: allWhitelist, error: allWhitelistError }] = await Promise.all([
    client.from('proposal_candidates').select('*').in('proposal_draft_id', ids),
    client.from('proposal_whitelist_entries').select('*').in('proposal_draft_id', ids),
  ])

  if (candidatesError) return jsonError('Gagal memuat kandidat pemilihan.', 500)
  if (allWhitelistError) return jsonError('Gagal memuat jumlah whitelist pemilihan.', 500)

  const [{ count: proposalCount }, { count: whitelistCount }] = await Promise.all([
    client.from('proposal_drafts').select('id', { count: 'exact', head: true }),
    client.from('proposal_whitelist_entries').select('id', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    elections: rows.map((row) => mapElection(
      row,
      candidates ?? [],
      (allWhitelist ?? []).filter((entry) => entry.proposal_draft_id === row.id),
    )),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}
