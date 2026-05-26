'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listProposalDrafts, getProposalDraftById, updateProposalStatus } from '@/lib/repositories/proposalRepository'

export function useProposalDraft(id: string | null | undefined) {
  return useQuery({
    queryKey: ['proposal-draft', id ?? 'unknown'],
    queryFn: () => getProposalDraftById(id ?? ''),
    enabled: Boolean(id),
    retry: false,
  })
}

export function useSuperadminProposalDrafts() {
  return useQuery({
    queryKey: ['superadmin', 'all-proposals'],
    queryFn: listProposalDrafts,
    retry: false,
  })
}

export function useUpdateProposalStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; status: any; txHash?: string; deployedSpaceAddress?: string }) => 
      updateProposalStatus(input.id, input.status, input.txHash, input.deployedSpaceAddress),
    onSuccess: (proposal) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'proposal-drafts'] })
      void queryClient.invalidateQueries({ queryKey: ['proposal-draft', proposal.id] })
    },
  })
}
