import { notFound } from 'next/navigation'
import { AdminCandidateFormView } from '@/components/admin/admin-candidate-form-view'
import { getAdminElectionById, getAdminElectionCandidateById } from '@/lib/admin-election-data'

export default function AdminElectionEditCandidatePage({
  params,
}: {
  params: { id: string; candidateId: string }
}) {
  const election = getAdminElectionById(params.id)
  const candidate = getAdminElectionCandidateById(params.id, params.candidateId)

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
