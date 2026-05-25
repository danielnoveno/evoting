'use client'

import { useQuery } from '@tanstack/react-query'
import { listWhitelistImportJobs } from '@/lib/repositories/whitelistRepository'

export function useWhitelistImportJobs(proposalDraftId: string | null | undefined) {
  return useQuery({
    queryKey: ['whitelist-import-jobs', proposalDraftId ?? 'unknown'],
    queryFn: () => listWhitelistImportJobs(proposalDraftId ?? ''),
    enabled: Boolean(proposalDraftId),
    retry: false,
  })
}
