'use client'

import { useQuery } from '@tanstack/react-query'
import { listProposalCandidates } from '@/lib/repositories/proposalRepository'
import { listWhitelistEntries } from '@/lib/repositories/whitelistRepository'

export function useProposalCandidates(proposalDraftId: string | null | undefined) {
  return useQuery({
    queryKey: ['proposal-candidates', proposalDraftId ?? 'unknown'],
    queryFn: () => listProposalCandidates(proposalDraftId ?? ''),
    enabled: Boolean(proposalDraftId),
    retry: false,
  })
}

export function useProposalWhitelistEntries(proposalDraftId: string | null | undefined) {
  return useQuery({
    queryKey: ['proposal-whitelist', proposalDraftId ?? 'unknown'],
    queryFn: () => listWhitelistEntries(proposalDraftId ?? ''),
    enabled: Boolean(proposalDraftId),
    retry: false,
  })
}
