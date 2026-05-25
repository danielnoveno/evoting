'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveProposalDraft } from '@/lib/repositories/proposalRepository'

export function useSaveProposalDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveProposalDraft,
    onSuccess: (proposal) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'proposal-drafts'] })
      void queryClient.invalidateQueries({ queryKey: ['proposal-draft', proposal.id] })
    },
  })
}
