'use client'

import { useQuery } from '@tanstack/react-query'
import { getProposalDraftById } from '@/lib/repositories/proposalRepository'

export function useProposalDraft(id: string | null | undefined) {
  return useQuery({
    queryKey: ['proposal-draft', id ?? 'unknown'],
    queryFn: () => getProposalDraftById(id ?? ''),
    enabled: Boolean(id),
    retry: false,
  })
}
