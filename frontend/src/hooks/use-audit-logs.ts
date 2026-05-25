'use client'

import { useQuery } from '@tanstack/react-query'
import { listAuditLogs } from '@/lib/repositories/auditLogRepository'

export function useAuditLogs(proposalId: string | null | undefined) {
  return useQuery({
    queryKey: ['audit-logs', proposalId ?? 'unknown'],
    queryFn: () => listAuditLogs(proposalId ?? ''),
    enabled: Boolean(proposalId),
    refetchInterval: 10000, // Poll every 10 seconds for monitoring
  })
}
