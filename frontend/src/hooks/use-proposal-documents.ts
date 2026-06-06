'use client'

import { useQuery } from '@tanstack/react-query'
import { listProposalDocuments } from '@/lib/repositories/proposalDocumentRepository'

export function useProposalDocuments(proposalDraftId: string | null | undefined) {
  return useQuery({
    queryKey: ['proposal-documents', proposalDraftId ?? 'unknown'],
    queryFn: () => listProposalDocuments(proposalDraftId ?? ''),
    enabled: Boolean(proposalDraftId),
    retry: false,
  })
}
