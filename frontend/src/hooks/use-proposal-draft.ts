'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listProposalActivities, listProposalDrafts, getProposalDraftById, updateProposalStatus } from '@/lib/repositories/proposalRepository'

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
    mutationFn: updateProposalStatus,
    onSuccess: (proposal) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'proposal-drafts'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'elections'] })
      void queryClient.invalidateQueries({ queryKey: ['superadmin', 'all-proposals'] })
      void queryClient.invalidateQueries({ queryKey: ['proposal-draft', proposal.id] })
      void queryClient.invalidateQueries({ queryKey: ['proposal-activities', proposal.id] })
    },
  })
}

export function useProposalActivities(id: string | null | undefined) {
  return useQuery({
    queryKey: ['proposal-activities', id ?? 'unknown'],
    queryFn: () => listProposalActivities(id ?? ''),
    enabled: Boolean(id),
    retry: false,
  })
}
