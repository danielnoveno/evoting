import { notFound } from 'next/navigation'
import { AdminCandidateFormView } from '@/components/admin/admin-candidate-form-view'
import { getAdminElectionById } from '@/lib/admin-election-data'

export default function AdminElectionAddCandidatePage({ params }: { params: { id: string } }) {
  const election = getAdminElectionById(params.id)

  if (!election) {
    notFound()
  }

  const form = election.detail.candidateForm

  return (
    <AdminCandidateFormView
      election={election}
      title={form.title}
      description={form.description}
      primaryActionLabel="Simpan Perubahan"
    />
  )
}
