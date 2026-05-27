'use client'

import { notFound } from 'next/navigation'
import { AdminElectionDetailView } from '@/components/admin/admin-election-detail-view'
import { AdminElectionDetailTabId, adminElectionDetailTabs, AdminElectionRecord } from '@/lib/admin-election-data'
import { useProposalDraft } from '@/hooks/use-proposal-draft'
import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useAdminElectionList } from '@/hooks/use-admin-proposal-list'

export default function AdminElectionDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { tab?: string }
}) {
  const proposalQuery = useProposalDraft(params.id)
  const electionListQuery = useAdminElectionList()

  const election = useMemo<AdminElectionRecord | null>(() => {
    const p = proposalQuery.data
    if (!p) return null
    return electionListQuery.elections.find((item) => item.id === p.id) ?? null
  }, [proposalQuery.data, electionListQuery.elections])

  if (proposalQuery.isLoading || electionListQuery.isLoading) return <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-400" /></div>
  if (!election) {
    notFound()
  }

  const allowedTabs = new Set(adminElectionDetailTabs.map((tab) => tab.id))
  const requestedTab = searchParams.tab
  const activeTab: AdminElectionDetailTabId = requestedTab && allowedTabs.has(requestedTab as AdminElectionDetailTabId)
    ? (requestedTab as AdminElectionDetailTabId)
    : 'kandidat'

  return <AdminElectionDetailView election={election} activeTab={activeTab} />
}
