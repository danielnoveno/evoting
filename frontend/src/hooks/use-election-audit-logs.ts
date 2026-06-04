'use client'

import { useQuery } from '@tanstack/react-query'
import { listPonderAuditLogs } from '@/lib/repositories/electionRepository'

export function useElectionAuditLogs(spaceAddress?: string | null, limit = 6) {
  return useQuery({
    queryKey: ['election', 'audit-logs', spaceAddress ?? 'unknown', limit],
    queryFn: () => listPonderAuditLogs(spaceAddress!, limit),
    enabled: Boolean(spaceAddress && spaceAddress.startsWith('0x')),
    refetchInterval: 1000 * 15, // Refresh every 15 seconds
    retry: false,
  })
}
