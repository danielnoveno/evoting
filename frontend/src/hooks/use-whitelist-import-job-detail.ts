'use client'

import { useQuery } from '@tanstack/react-query'
import { getWhitelistImportJob } from '@/lib/repositories/whitelistRepository'

export function useWhitelistImportJobDetail(jobId: string | null | undefined) {
  return useQuery({
    queryKey: ['whitelist-import-job-detail', jobId ?? 'unknown'],
    queryFn: () => getWhitelistImportJob(jobId ?? ''),
    enabled: Boolean(jobId),
    retry: false,
  })
}
