'use client'

import { notFound } from 'next/navigation'
import { AdminCandidateFormView } from '@/components/admin/admin-candidate-form-view'
import { useAdminElectionList } from '@/hooks/use-admin-proposal-list'
import { Loader2 } from 'lucide-react'

export default function AdminElectionAddCandidatePage({ params }: { params: { id: string } }) {
  const electionListQuery = useAdminElectionList()
  const election = electionListQuery.elections.find(e => e.id === params.id)

  if (electionListQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
      </div>
    )
  }

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
