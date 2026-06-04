'use client'

import { useQuery } from '@tanstack/react-query'
import { getElectionResultsFromIndexer } from '@/lib/repositories/electionRepository'

export function useElectionResults(spaceAddress?: string | null) {
  return useQuery({
    queryKey: ['election', 'results', spaceAddress ?? 'unknown'],
    queryFn: () => getElectionResultsFromIndexer(spaceAddress!),
    enabled: Boolean(spaceAddress && spaceAddress.startsWith('0x')),
    refetchInterval: 1000 * 10, // Refresh every 10 seconds
    retry: false,
  })
}
