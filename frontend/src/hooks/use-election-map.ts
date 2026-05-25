'use client'

import { useQuery } from '@tanstack/react-query'
import { getSpaceRegistryMapByProposalId } from '@/lib/repositories/electionRepository'

export function useSpaceRegistryMap(proposalId: string | null | undefined) {
  return useQuery({
    queryKey: ['space-registry-map', proposalId ?? 'unknown'],
    queryFn: () => getSpaceRegistryMapByProposalId(proposalId ?? ''),
    enabled: Boolean(proposalId),
    retry: false,
  })
}
