import { notFound } from 'next/navigation'
import { AdminElectionDetailView } from '@/components/admin/admin-election-detail-view'
import { AdminElectionDetailTabId, adminElectionDetailTabs, getAdminElectionById } from '@/lib/admin-election-data'

export default function AdminElectionDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { tab?: string }
}) {
  const election = getAdminElectionById(params.id)

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
