'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import { RepositoryError } from '@/lib/repositories/errors'
import type { ProposalCandidateRecord, ProposalDraftRecord } from '@/lib/repositories/types'

export interface VoterElectionDetail {
  election: ProposalDraftRecord
  candidates: ProposalCandidateRecord[]
  spaceAddress: string | null
}

export async function getVoterElectionDetail(id: string): Promise<VoterElectionDetail | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  // Fetch election proposal
  const { data: election, error: electionError } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (electionError) throw new RepositoryError('Gagal memuat data pemilihan.')
  if (!election) return null

  // Fetch candidates
  const { data: candidates, error: candidatesError } = await client
    .schema('app')
    .from('proposal_candidates')
    .select('*')
    .eq('proposal_draft_id', id)
    .order('sort_order', { ascending: true })

  if (candidatesError) throw new RepositoryError('Gagal memuat daftar kandidat.')

  // Map correctly
  return {
    election: {
      id: election.id,
      title: election.title,
      description: election.description,
      organizationName: election.organization_name,
      candidateCount: election.candidate_count,
      status: election.status,
      proposalTxHash: election.proposal_tx_hash,
      reviewTxHash: election.review_tx_hash,
      deploymentTxHash: election.deployment_tx_hash,
      deployedSpaceAddress: election.deployed_space_address,
      commitStartAt: election.commit_start_at,
      revealStartAt: election.reveal_start_at,
      endedAt: election.ended_at,
      createdAt: election.created_at,
      updatedAt: election.updated_at,
      createdBy: election.created_by,
    },
    candidates: (candidates ?? []).map((c) => ({
      id: c.id,
      proposalDraftId: c.proposal_draft_id,
      candidateLocalId: c.candidate_local_id,
      fullName: c.full_name,
      studentId: c.student_id,
      faculty: c.faculty || null,
      bio: c.bio || null,
      vision: c.vision || null,
      avatarPath: c.avatar_path || null,
      sortOrder: c.sort_order,
    })),
    spaceAddress: election.deployed_space_address,
  }
}

export async function listActiveElections(): Promise<ProposalDraftRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('*')
    .eq('status', 'deployed')
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat daftar pemilihan aktif.')

  return (data ?? []).map((row) => ({
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
  }))
}
