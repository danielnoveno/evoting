'use client'

import { useQuery } from '@tanstack/react-query'
import { listWhitelistEntriesByJobId } from '@/lib/repositories/whitelistRepository'

export function useWhitelistImportJobEntries(jobId: string | null | undefined) {
  return useQuery({
    queryKey: ['whitelist-import-job-entries', jobId ?? 'unknown'],
    queryFn: () => listWhitelistEntriesByJobId(jobId ?? ''),
    enabled: Boolean(jobId),
    retry: false,
  })
}
