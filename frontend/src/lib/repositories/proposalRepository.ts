'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import { getCurrentProfile } from '@/lib/repositories/profileRepository'
import type { ProposalCandidateRecord, ProposalDraftRecord, ProposalDraftUpsertInput } from '@/lib/repositories/types'
import { RepositoryError } from '@/lib/repositories/errors'

type ProposalRow = Database['app']['Tables']['proposal_drafts']['Row']
type ProposalCandidateRow = Database['app']['Tables']['proposal_candidates']['Row']

function mapProposalRow(row: ProposalRow): ProposalDraftRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    organizationName: row.organization_name,
    candidateCount: row.candidate_count,
    status: row.status,
    proposalTxHash: row.proposal_tx_hash,
    reviewTxHash: row.review_tx_hash,
    deploymentTxHash: row.deployment_tx_hash,
    deployedSpaceAddress: row.deployed_space_address,
    commitStartAt: row.commit_start_at,
    revealStartAt: row.reveal_start_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  }
}

function mapProposalCandidateRow(row: ProposalCandidateRow): ProposalCandidateRecord {
  return {
    id: row.id,
    proposalDraftId: row.proposal_draft_id,
    candidateLocalId: row.candidate_local_id,
    fullName: row.full_name,
    studentId: row.student_id,
    faculty: row.faculty,
    bio: row.bio,
    vision: row.vision,
    avatarPath: row.avatar_path,
    sortOrder: row.sort_order,
  }
}

export async function listProposalDrafts(): Promise<ProposalDraftRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat daftar proposal. Coba lagi.')
  return (data ?? []).map(mapProposalRow)
}

export async function getProposalDraftById(id: string): Promise<ProposalDraftRecord | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const { data, error } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memuat detail proposal. Coba lagi.')
  return data ? mapProposalRow(data) : null
}

export async function listProposalCandidates(proposalDraftId: string): Promise<ProposalCandidateRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('proposal_candidates')
    .select('*')
    .eq('proposal_draft_id', proposalDraftId)
    .order('sort_order', { ascending: true })

  if (error) throw new RepositoryError('Gagal memuat kandidat proposal. Coba lagi.')
  return (data ?? []).map(mapProposalCandidateRow)
}

export async function saveProposalDraft(input: ProposalDraftUpsertInput): Promise<ProposalDraftRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const profile = await getCurrentProfile()
  if (!profile) throw new RepositoryError('Sesi admin belum aktif untuk menyimpan proposal.')

  const payload: Database['app']['Tables']['proposal_drafts']['Insert'] = {
    id: input.id,
    created_by: profile.id,
    title: input.title,
    organization_name: input.organizationName ?? null,
    description: input.description ?? null,
    candidate_count: input.candidateCount,
    commit_start_at: input.commitStartAt ?? null,
    reveal_start_at: input.revealStartAt ?? null,
    ended_at: input.endedAt ?? null,
    status: input.status ?? 'draft',
  }

  const { data, error } = await client
    .schema('app')
    .from('proposal_drafts')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw new RepositoryError('Gagal menyimpan proposal. Coba lagi.')

  if (input.candidates) {
    const sanitizedCandidates = input.candidates
      .map((candidate, index) => ({
        proposal_draft_id: data.id,
        candidate_local_id: `candidate-${index + 1}`,
        full_name: candidate.name.trim(),
        student_id: candidate.studentId?.trim() || null,
        faculty: candidate.faculty?.trim() || null,
        bio: candidate.bio?.trim() || null,
        vision: candidate.vision?.trim() || null,
        avatar_path: candidate.avatarPath?.trim() || null,
        sort_order: index,
      }))
      .filter((candidate) => candidate.full_name.length > 0)

    const { error: deleteCandidatesError } = await client
      .schema('app')
      .from('proposal_candidates')
      .delete()
      .eq('proposal_draft_id', data.id)

    if (deleteCandidatesError) {
      throw new RepositoryError('Proposal tersimpan, tetapi data kandidat gagal diperbarui.')
    }

    if (sanitizedCandidates.length > 0) {
      const { error: insertCandidatesError } = await client
        .schema('app')
        .from('proposal_candidates')
        .insert(sanitizedCandidates)

      if (insertCandidatesError) {
        throw new RepositoryError('Proposal tersimpan, tetapi data kandidat gagal diperbarui.')
      }
    }
  }

  if (input.whitelistEntries) {
    const sanitizedWhitelistEntries = input.whitelistEntries
      .map((entry) => ({
        proposal_draft_id: data.id,
        wallet_address: entry.walletAddress.trim(),
        voter_name: entry.voterName?.trim() || null,
        source: 'manual' as const,
      }))
      .filter((entry) => /^0x[a-fA-F0-9]{40}$/.test(entry.wallet_address))

    const { error: deleteWhitelistError } = await client
      .schema('app')
      .from('proposal_whitelist_entries')
      .delete()
      .eq('proposal_draft_id', data.id)

    if (deleteWhitelistError) {
      throw new RepositoryError('Proposal tersimpan, tetapi daftar pemilih gagal diperbarui.')
    }

    if (sanitizedWhitelistEntries.length > 0) {
      const { error: insertWhitelistError } = await client
        .schema('app')
        .from('proposal_whitelist_entries')
        .insert(sanitizedWhitelistEntries)

      if (insertWhitelistError) {
        throw new RepositoryError('Proposal tersimpan, tetapi daftar pemilih gagal diperbarui.')
      }
    }
  }

  return mapProposalRow(data)
}
