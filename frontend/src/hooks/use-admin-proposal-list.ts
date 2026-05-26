'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listProposalDrafts } from '@/lib/repositories/proposalRepository'
import { mapProposalDraftToListItem } from '@/lib/mappers/proposalMapper'
import { adminProposalContent } from '@/lib/admin-proposal-data'
import { adminElectionData, AdminElectionRecord } from '@/lib/admin-election-data'

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

export function useAdminElectionList() {
  const query = useQuery({
    queryKey: ['admin', 'elections'],
    queryFn: listProposalDrafts,
    retry: false,
  })

  const elections = useMemo<AdminElectionRecord[]>(() => {
    if (!query.data || query.data.length === 0) return []
    
    return query.data
      .filter(p => p.status === 'approved' || p.status === 'deployed')
      .map((p, index) => {
        const baseElection = adminElectionData[index % adminElectionData.length] ?? adminElectionData[0]
        const voterTarget = String(p.candidateCount * 10)

        return {
          ...baseElection,
          id: p.id,
          title: p.title,
          code: `VC-${p.id.slice(0, 4).toUpperCase()}`,
          status: p.status === 'deployed' ? 'aktif' : 'selesai',
          badge: p.status === 'deployed' ? 'Active' : 'Approved',
          meta: p.description ?? 'Ruang pemilihan blockchain.',
          iconTone: p.status === 'deployed' ? 'emerald' : 'blue',
          actionLabel: p.status === 'deployed' ? 'Monitoring' : 'Review Draft',
          secondaryActionLabel: 'Statistik',
          actionTone: 'blue',
          periodLabel: 'Mei - Juni 2026',
          turnoutLabel: `${voterTarget} pemilih terdaftar`,
          commits: p.status === 'deployed' ? {
            total: '0',
            target: voterTarget,
            hash: p.deploymentTxHash?.slice(0, 10) ?? '0x...',
            revealStart: p.revealStartAt ? new Date(p.revealStartAt).toLocaleDateString() : '-',
            integrity: 'Verified'
          } : undefined
        }
      })
  }, [query.data])

  return {
    ...query,
    elections,
    isUsingFallback: !query.data || query.data.length === 0
  }
}
