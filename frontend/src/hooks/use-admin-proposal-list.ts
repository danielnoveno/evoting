'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listProposalDrafts } from '@/lib/repositories/proposalRepository'
import { mapProposalDraftToListItem } from '@/lib/mappers/proposalMapper'
import { adminProposalContent } from '@/lib/admin-proposal-dummy-data'

export function useAdminProposalList() {
  const query = useQuery({
    queryKey: ['admin', 'proposal-drafts'],
    queryFn: listProposalDrafts,
    retry: false,
  })

  const rows = useMemo(() => {
    if (!query.data || query.data.length === 0) {
      return adminProposalContent.proposals
    }

    return query.data.map(mapProposalDraftToListItem)
  }, [query.data])

  const stats = useMemo(() => {
    if (!query.data || query.data.length === 0) {
      return adminProposalContent.stats
    }

    const total = query.data.length
    const waiting = query.data.filter((item) => item.status === 'submitted').length
    const running = query.data.filter((item) => item.status === 'approved' || item.status === 'deployed').length
    const finished = query.data.filter((item) => item.endedAt).length

    return [
      { label: 'TOTAL PROPOSAL', value: String(total), iconKey: 'bar-chart' },
      { label: 'MENUNGGU REVIEW', value: String(waiting), iconKey: 'hourglass' },
      { label: 'BERJALAN', value: String(running), iconKey: 'rocket' },
      { label: 'SELESAI', value: String(finished), iconKey: 'check-circle' },
    ]
  }, [query.data])

  return {
    ...query,
    rows,
    stats,
    isUsingFallback: !query.data || query.data.length === 0,
  }
}
