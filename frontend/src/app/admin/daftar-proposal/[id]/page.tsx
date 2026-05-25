'use client'

import { notFound, useRouter } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { ProposalForm, ProposalFormData } from '@/components/admin/proposal-form'
import { adminProposalContent } from '@/lib/admin-proposal-dummy-data'
import { sharedDummyContext } from '@/lib/dummy-shared-context'
import { useProposalDraft } from '@/hooks/use-proposal-draft'
import { useProposalCandidates, useProposalWhitelistEntries } from '@/hooks/use-proposal-relations'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { useRegistryContract } from '@/hooks/use-registry-contract'
import { Rocket, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { useEffect } from 'react'

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
  
  const { 
    submitProposal, 
    isWritePending, 
    isConfirming, 
    isConfirmed, 
    hash,
    resetWrite
  } = useRegistryContract()

  useEffect(() => {
    if (isConfirmed) {
      showToast({ title: 'Berhasil Terkirim', description: 'Proposal telah didaftarkan ke blockchain.', tone: 'success' })
      resetWrite()
      router.push('/admin/daftar-proposal')
    }
  }, [isConfirmed, resetWrite, router, showToast])

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
      avatarPath: c.avatarPath ?? '',
    })) ?? [],
    whitelistWallets: whitelistQuery.data?.map(e => entry.walletAddress).join('\n') ?? '',
  }

  const handleSubmitToBlockchain = () => {
    if (!liveProposal) return

    const commitStart = new Date(liveProposal.commitStartAt!).getTime()
    const revealStart = new Date(liveProposal.revealStartAt!).getTime()
    const endedAt = new Date(liveProposal.endedAt!).getTime()

    const commitDuration = Math.floor((revealStart - commitStart) / 1000)
    const revealDuration = Math.floor((endedAt - revealStart) / 1000)

    // Using a fake metadata URI for now, ideally this would be an IPFS CID
    const metadataURI = `ipfs://QmFakeMetadataForProposal-${params.id}`

    submitProposal(
      liveProposal.title,
      metadataURI,
      liveProposal.candidateCount,
      commitDuration,
      revealDuration
    )
  }

  return (
    <AdminShell>
      <ProposalForm
        initialData={initialData}
        isReadOnly={true}
        pageTitle="Detail Proposal"
        pageDescription="Tinjau parameter sebelum mengirim ke blockchain."
        extraActions={
          liveProposal?.status === 'draft' && (
            <button
              onClick={handleSubmitToBlockchain}
              disabled={isWritePending || isConfirming}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-6 text-white hover:bg-blue-700"
            >
              {isWritePending || isConfirming ? <Loader2 className="animate-spin h-4 w-4" /> : <Rocket className="h-4 w-4" />}
              Kirim ke Blockchain
            </button>
          )
        }
      />
    </AdminShell>
  )
}
