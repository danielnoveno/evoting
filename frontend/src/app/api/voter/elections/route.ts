import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/lib/supabase/database.types'

export const runtime = 'nodejs'

type ProposalRow = Database['app']['Tables']['proposal_drafts']['Row']
type CandidateRow = Database['app']['Tables']['proposal_candidates']['Row']
type WhitelistRow = Database['app']['Tables']['proposal_whitelist_entries']['Row']

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function asStringArray(value: Json): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function formatDateTimeLabel(value: string | null): string {
  if (!value) return 'Jadwal belum diatur'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Jadwal belum diatur'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function resolvePhase(row: ProposalRow) {
  const now = Date.now()
  const commitStart = row.commit_start_at ? new Date(row.commit_start_at).getTime() : Number.NaN
  const revealStart = row.reveal_start_at ? new Date(row.reveal_start_at).getTime() : Number.NaN
  const endedAt = row.ended_at ? new Date(row.ended_at).getTime() : Number.NaN

  if (row.status === 'archived' || (!Number.isNaN(endedAt) && now >= endedAt)) return 'ended'
  if (row.status !== 'deployed') return 'registration'
  if (!Number.isNaN(revealStart) && now >= revealStart) return 'reveal'
  if (!Number.isNaN(commitStart) && now >= commitStart) return 'commit'
  return 'registration'
}

function phaseLabel(phase: string): string {
  if (phase === 'commit') return 'Tahap Memilih'
  if (phase === 'reveal') return 'Tahap Konfirmasi'
  if (phase === 'ended') return 'Selesai'
  return 'Persiapan'
}

function deadlineLabel(row: ProposalRow, phase: string): string {
  if (phase === 'commit') return `Batas memilih ${formatDateTimeLabel(row.reveal_start_at)}`
  if (phase === 'reveal') return `Batas konfirmasi ${formatDateTimeLabel(row.ended_at)}`
  if (phase === 'registration') return `Mulai memilih ${formatDateTimeLabel(row.commit_start_at)}`
  return row.ended_at ? `Selesai ${formatDateTimeLabel(row.ended_at)}` : 'Selesai'
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
  const phase = resolvePhase(row)
  return {
    id: row.id,
    title: row.title,
    description: row.description,
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
    .select('wallet_address')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (profileError) return jsonError('Gagal memuat profil voter.', 500)
  const walletAddress = profile?.wallet_address?.trim()
  if (!walletAddress) return NextResponse.json({ elections: [] })

  const { data: matchedWhitelist, error: whitelistError } = await client
    .from('proposal_whitelist_entries')
    .select('*')
    .ilike('wallet_address', walletAddress)

  if (whitelistError) return jsonError('Gagal memeriksa whitelist voter.', 500)

  const proposalIds = Array.from(new Set((matchedWhitelist ?? []).map((entry) => entry.proposal_draft_id)))
  if (proposalIds.length === 0) return NextResponse.json({ elections: [] })

  const { data: proposals, error: proposalError } = await client
    .from('proposal_drafts')
    .select('*')
    .in('id', proposalIds)
    .in('status', ['approved', 'deployed', 'archived'])
    .order('created_at', { ascending: false })

  if (proposalError) return jsonError('Gagal memuat pemilihan voter.', 500)

  const rows = proposals ?? []
  if (rows.length === 0) return NextResponse.json({ elections: [] })

  const ids = rows.map((row) => row.id)
  const [{ data: candidates, error: candidatesError }, { data: allWhitelist, error: allWhitelistError }] = await Promise.all([
    client.from('proposal_candidates').select('*').in('proposal_draft_id', ids),
    client.from('proposal_whitelist_entries').select('*').in('proposal_draft_id', ids),
  ])

  if (candidatesError) return jsonError('Gagal memuat kandidat pemilihan.', 500)
  if (allWhitelistError) return jsonError('Gagal memuat jumlah whitelist pemilihan.', 500)

  return NextResponse.json({
    elections: rows.map((row) => mapElection(
      row,
      candidates ?? [],
      (allWhitelist ?? []).filter((entry) => entry.proposal_draft_id === row.id),
    )),
  })
}
