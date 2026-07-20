'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ProposalForm, ProposalFormData } from '@/components/admin/proposal-form'
import { useProposalDraft, useProposalActivities } from '@/hooks/use-proposal-draft'
import { useProposalCandidates, useProposalWhitelistEntries } from '@/hooks/use-proposal-relations'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

const READ_ONLY_STATUSES = ['approved', 'deployed', 'archived'] as const

function toDatetimeLocal(value: string | null, fallback: string) {
  if (!value) return fallback

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback

  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AdminEditProposalPage({ params }: { params: { id: string } }) {
  const proposalQuery = useProposalDraft(params.id)
  const candidateQuery = useProposalCandidates(params.id)
  const whitelistQuery = useProposalWhitelistEntries(params.id)
  const activitiesQuery = useProposalActivities(params.id)
  const latestRevisionMessage = (activitiesQuery.data ?? []).find((activity) => activity.eventType === 'revision_requested')?.message
  const liveProposal = proposalQuery.data
  const initialData = useMemo<Partial<ProposalFormData>>(() => ({
    title: liveProposal?.title ?? 'Proposal',
    category: liveProposal?.organizationName ?? 'Organisasi',
    description: liveProposal?.description ?? `Deskripsi default untuk proposal ${liveProposal?.title ?? 'proposal'}.`,
    bannerImagePath: liveProposal?.bannerImagePath ?? '',
    candidateCount: liveProposal?.candidateCount ?? 2,
    voterCount: 0,
    commitDate: toDatetimeLocal(liveProposal?.commitStartAt ?? null, ''),
    revealDate: toDatetimeLocal(liveProposal?.revealStartAt ?? null, ''),
    endedDate: toDatetimeLocal(liveProposal?.endedAt ?? null, ''),
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
  }), [candidateQuery.data, liveProposal, whitelistQuery.data])
  
  if (proposalQuery.isLoading) {
    return (
      <AdminShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </AdminShell>
    )
  }

  if (!proposalQuery.isError && !proposalQuery.data) {
    notFound()
  }

  // Guard: deployed/approved/archived proposals cannot be edited
  if (liveProposal && READ_ONLY_STATUSES.includes(liveProposal.status as typeof READ_ONLY_STATUSES[number])) {
    return (
      <AdminShell>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm">
            <h1 className="text-[24px] font-semibold text-slate-900">Proposal Tidak Bisa Diedit</h1>
            <p className="mt-3 max-w-md text-[14px] leading-7 text-slate-500">
              Proposal ini sudah {liveProposal.status === 'deployed' ? 'dideploy' : liveProposal.status === 'approved' ? 'disetujui' : 'dibatalkan'} dan tidak dapat diubah lagi. 
              {liveProposal.status === 'deployed' ? ' Pemilihan yang sudah aktif di blockchain harus tetap konsisten.' : ''}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href={`/admin/daftar-proposal/${params.id}`} className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white hover:bg-slate-900">
                Lihat Detail
              </Link>
              <Link href="/admin/daftar-proposal" className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-700 hover:bg-slate-200">
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      {proposalQuery.error ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800" role="status">
          {getRepositoryErrorMessage(proposalQuery.error, 'Proposal live belum tersedia.')}
        </div>
      ) : null}
      {candidateQuery.error || whitelistQuery.error ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800" role="status">
          Relasi kandidat atau whitelist live belum lengkap. Pengeditan tetap memakai data yang tersedia.
        </div>
      ) : null}
      {liveProposal?.status === 'revision_requested' && latestRevisionMessage ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-amber-700">Pesan Revisi dari Superadmin</p>
              <p className="mt-2 text-[14px] leading-7 text-amber-900">{latestRevisionMessage}</p>
            </div>
          </div>
        </div>
      ) : null}
      <ProposalForm
        proposalId={params.id}
        initialData={initialData}
        pageTitle="Edit Proposal"
        pageDescription={`Perbarui parameter untuk proposal ${liveProposal?.title ?? 'proposal'}. Setelah disimpan, proposal akan kembali masuk antrean review superadmin.`}
        submitLabel="Ajukan Ulang"
        submitStatus="submitted"
        successMessageTitle="Proposal Diajukan Ulang"
        successMessageDesc={`Proposal ${liveProposal?.title ?? 'proposal'} berhasil diperbarui dan menunggu review superadmin.`}
      />
    </AdminShell>
  )
}
