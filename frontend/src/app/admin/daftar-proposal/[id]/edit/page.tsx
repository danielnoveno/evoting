'use client'

import { notFound } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { ProposalForm, ProposalFormData } from '@/components/admin/proposal-form'
import { adminProposalContent } from '@/lib/admin-proposal-data'
import { useProposalDraft } from '@/hooks/use-proposal-draft'
import { useProposalCandidates, useProposalWhitelistEntries } from '@/hooks/use-proposal-relations'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

function toDatetimeLocal(value: string | null, fallback: string) {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback

  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AdminEditProposalPage({ params }: { params: { id: string } }) {
  const proposal = adminProposalContent.proposals.find(p => p.id === params.id)
  const proposalQuery = useProposalDraft(params.id)
  const candidateQuery = useProposalCandidates(params.id)
  const whitelistQuery = useProposalWhitelistEntries(params.id)
  
  if (proposalQuery.isLoading) {
    return (
      <AdminShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </AdminShell>
    )
  }

  // Only call notFound if we are not loading, have no error, and both static and live data are missing
  if (!proposalQuery.isError && !proposal && !proposalQuery.data) {
    notFound()
  }

  const liveProposal = proposalQuery.data

  const initialData: Partial<ProposalFormData> = {
    title: liveProposal?.title ?? proposal?.title ?? 'Proposal',
    category: liveProposal?.organizationName ?? proposal?.category ?? 'Organisasi',
    description: liveProposal?.description ?? `Deskripsi default untuk proposal ${liveProposal?.title ?? proposal?.title}.`,
    bannerImagePath: liveProposal?.bannerImagePath ?? '',
    candidateCount: liveProposal?.candidateCount ?? 2,
    voterCount: proposal ? parseInt(proposal.votersEstimate.replace(/,/g, ''), 10) || 0 : 0,
    commitDate: toDatetimeLocal(liveProposal?.commitStartAt ?? null, '2026-06-12T09:00'),
    revealDate: toDatetimeLocal(liveProposal?.revealStartAt ?? null, '2026-06-19T09:00'),
    endedDate: toDatetimeLocal(liveProposal?.endedAt ?? null, '2026-06-26T09:00'),
    candidateEntries: candidateQuery.data?.map((candidate) => ({
      name: candidate.fullName,
      studentId: candidate.studentId ?? '',
      faculty: candidate.faculty ?? '',
      bio: candidate.bio ?? '',
      vision: candidate.vision ?? '',
      mission: candidate.mission.join('\n'),
      youtubeUrl: candidate.youtubeUrl ?? '',
      avatarPath: candidate.avatarPath ?? '',
    })) ?? [],
    whitelistWallets: whitelistQuery.data?.map((entry) => entry.walletAddress).join('\n') ?? '',
  }

  return (
    <AdminShell>
      {proposalQuery.error ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800" role="status">
          {getRepositoryErrorMessage(proposalQuery.error, 'Proposal live belum tersedia. Menggunakan data transisi lokal untuk pengeditan.')}
        </div>
      ) : null}
      {candidateQuery.error || whitelistQuery.error ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800" role="status">
          Relasi kandidat atau whitelist live belum lengkap. Pengeditan tetap memakai data yang tersedia.
        </div>
      ) : null}
      <ProposalForm
        proposalId={params.id}
        initialData={initialData}
        pageTitle="Edit Proposal"
        pageDescription={`Perbarui parameter untuk proposal ${liveProposal?.title ?? proposal?.title}. Setelah disimpan, proposal akan kembali masuk antrean review superadmin.`}
        submitLabel="Ajukan Ulang"
        submitStatus="submitted"
        successMessageTitle="Proposal Diajukan Ulang"
        successMessageDesc={`Proposal ${liveProposal?.title ?? proposal?.title} berhasil diperbarui dan menunggu review superadmin.`}
      />
    </AdminShell>
  )
}
