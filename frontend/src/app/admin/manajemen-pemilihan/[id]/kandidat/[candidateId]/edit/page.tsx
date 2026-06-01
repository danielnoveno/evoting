'use client'

import { notFound } from 'next/navigation'
import { AdminCandidateFormView } from '@/components/admin/admin-candidate-form-view'
import { useAdminElectionList } from '@/hooks/use-admin-proposal-list'
import { Loader2 } from 'lucide-react'

export default function AdminElectionEditCandidatePage({
  params,
}: {
  params: { id: string; candidateId: string }
}) {
  const electionListQuery = useAdminElectionList()
  const election = electionListQuery.elections.find(e => e.id === params.id)
  const candidate = election?.detail.candidates.find(c => c.id === params.candidateId)

  if (electionListQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!election || !candidate) {
    notFound()
  }

  return (
    <AdminCandidateFormView
      election={election}
      title="Edit Profil Kandidat"
      description={`Perbarui informasi kandidat ${candidate.name}. Pastikan data tetap konsisten sebelum disimpan ke sistem.`}
      primaryActionLabel="Simpan Perubahan"
      candidateId={candidate.id}
      prefill={{
        fullName: candidate.name,
        identityNumber: candidate.identityNumber,
        faculty: candidate.faculty,
        bio: candidate.bio,
        vision: candidate.vision,
        mission: candidate.mission,
      }}
    />
  )
}
