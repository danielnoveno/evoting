import { notFound } from 'next/navigation'
import { AdminImportJobDetailView } from '@/components/admin/admin-import-job-detail-view'
import { getAdminElectionById } from '@/lib/admin-election-dummy-data'

export default function AdminImportJobDetailPage({ params }: { params: { id: string; jobId: string } }) {
  const election = getAdminElectionById(params.id)

  if (!election) {
    notFound()
  }

  return (
    <AdminImportJobDetailView
      jobId={params.jobId}
      election={election}
    />
  )
}
