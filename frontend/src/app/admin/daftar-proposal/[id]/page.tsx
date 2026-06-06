'use client'

import { notFound, useRouter } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { ProposalForm, ProposalFormData } from '@/components/admin/proposal-form'
import { useProposalDraft, useUpdateProposalStatus } from '@/hooks/use-proposal-draft'
import { useProposalCandidates, useProposalWhitelistEntries } from '@/hooks/use-proposal-relations'
import { Send } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'

function toDatetimeLocal(value: string | null, fallback: string) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function AdminDetailProposalPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const proposalQuery = useProposalDraft(params.id)
  const candidateQuery = useProposalCandidates(params.id)
  const whitelistQuery = useProposalWhitelistEntries(params.id)
  const updateStatus = useUpdateProposalStatus()
  const liveProposal = proposalQuery.data
  if (!liveProposal && !proposalQuery.isLoading) notFound()

  const initialData: Partial<ProposalFormData> = {
    title: liveProposal?.title ?? 'Proposal',
    category: liveProposal?.organizationName ?? 'Organisasi',
    description: liveProposal?.description ?? '',
    candidateCount: liveProposal?.candidateCount ?? 0,
    commitDate: toDatetimeLocal(liveProposal?.commitStartAt ?? null, ''),
    revealDate: toDatetimeLocal(liveProposal?.revealStartAt ?? null, ''),
    endedDate: toDatetimeLocal(liveProposal?.endedAt ?? null, ''),
    candidateEntries: candidateQuery.data?.map(c => ({
      name: c.fullName,
      studentId: c.studentId ?? '',
      faculty: c.faculty ?? '',
      bio: c.bio ?? '',
      vision: c.vision ?? '',
      mission: c.mission.join('\n'),
      youtubeUrl: c.youtubeUrl ?? '',
      avatarPath: c.avatarPath ?? '',
    })) ?? [],
    whitelistWallets: whitelistQuery.data?.map(e => e.walletAddress).join('\n') ?? '',
  }

  const handleSubmitForReview = () => {
    if (!liveProposal) return
    updateStatus.mutate({ id: params.id, status: 'submitted' }, {
      onSuccess: () => {
        showToast({
          title: 'Proposal diajukan ke superadmin',
          description: 'Data tersimpan di Supabase. Deploy blockchain akan dilakukan oleh superadmin setelah disetujui.',
          tone: 'success',
        })
        router.push('/admin/daftar-proposal')
      },
      onError: () => {
        showToast({
          title: 'Gagal mengajukan proposal',
          description: 'Status proposal belum berhasil diperbarui di Supabase.',
          tone: 'error',
        })
      }
    })
  }

  return (
    <AdminShell>
      <ProposalForm
        initialData={initialData}
        isReadOnly={true}
        pageTitle="Detail Proposal"
        pageDescription="Tinjau parameter proposal. Deploy blockchain dilakukan oleh superadmin saat proposal disetujui."
        extraActions={
          (liveProposal?.status === 'draft' || liveProposal?.status === 'revision_requested') && (
            <button
              onClick={handleSubmitForReview}
              disabled={updateStatus.isPending}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-white hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              Ajukan ke Superadmin
            </button>
          )
        }
      />
    </AdminShell>
  )
}
