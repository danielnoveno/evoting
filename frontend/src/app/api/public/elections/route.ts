import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'
import { asStringArray } from '@/lib/repositories/helpers'
import { formatDateTime } from '@/lib/voter-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ProposalRow = Database['app']['Tables']['proposal_drafts']['Row']
type CandidateRow = Database['app']['Tables']['proposal_candidates']['Row']
type WhitelistRow = Database['app']['Tables']['proposal_whitelist_entries']['Row']

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
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
  if (phase === 'commit') return `Batas memilih ${formatDateTime(row.reveal_start_at)}`
  if (phase === 'reveal') return `Batas konfirmasi ${formatDateTime(row.ended_at)}`
  if (phase === 'registration') return `Mulai memilih ${formatDateTime(row.commit_start_at)}`
  return row.ended_at ? `Selesai ${formatDateTime(row.ended_at)}` : 'Selesai'
}

function mapElection(row: ProposalRow, candidates: CandidateRow[], whitelistRows: WhitelistRow[]) {
  const phase = resolvePhase(row)
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
      .map((candidate) => ({
        id: candidate.id,
        candidateLocalId: candidate.candidate_local_id,
        fullName: candidate.full_name,
        studentId: candidate.student_id,
        faculty: candidate.faculty,
        bio: candidate.bio,
        vision: candidate.vision,
        mission: asStringArray(candidate.mission),
        youtubeUrl: candidate.youtube_url,
        avatarPath: candidate.avatar_path,
        sortOrder: candidate.sort_order,
      })),
  }
}

export async function GET() {
  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const { data: proposals, error } = await client.from('proposal_drafts').select('*').in('status', ['deployed', 'archived']).order('created_at', { ascending: false })
  if (error) return jsonError('Gagal memuat pemilihan publik.', 500)
  const rows = proposals ?? []
  if (rows.length === 0) return NextResponse.json({ elections: [] })
  const ids = rows.map((row) => row.id)
  const [{ data: candidates, error: candidateError }, { data: whitelist, error: whitelistError }] = await Promise.all([
    client.from('proposal_candidates').select('*').in('proposal_draft_id', ids),
    client.from('proposal_whitelist_entries').select('*').in('proposal_draft_id', ids),
  ])
  if (candidateError) return jsonError('Gagal memuat kandidat pemilihan publik.', 500)
  if (whitelistError) return jsonError('Gagal memuat jumlah peserta pemilihan publik.', 500)
  return NextResponse.json({ elections: rows.map((row) => mapElection(row, candidates ?? [], (whitelist ?? []).filter((entry) => entry.proposal_draft_id === row.id))) })
}
