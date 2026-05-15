'use client'

import { notFound } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { ProposalForm, ProposalFormData } from '@/components/admin/proposal-form'
import { adminProposalContent } from '@/lib/admin-proposal-dummy-data'
import { sharedDummyContext } from '@/lib/dummy-shared-context'

export default function AdminDetailProposalPage({ params }: { params: { id: string } }) {
  const proposal = adminProposalContent.proposals.find(p => p.id === params.id)
  
  if (!proposal) {
    notFound()
  }

  // Map dummy row to form data
  const initialData: Partial<ProposalFormData> = {
    title: proposal.title,
    category: proposal.category,
    description: proposal.id === sharedDummyContext.proposalId
      ? sharedDummyContext.proposalSummary.join(' ')
      : `Deskripsi default untuk proposal ${proposal.title}.`,
    candidateCount: proposal.id === sharedDummyContext.proposalId ? sharedDummyContext.candidates.length : 2,
    voterCount: parseInt(proposal.votersEstimate.replace(/,/g, ''), 10) || 0,
    commitDate: '2026-06-12T09:00',
    revealDate: '2026-06-19T09:00'
  }

  return (
    <AdminShell>
      <ProposalForm
        initialData={initialData}
        isReadOnly={true}
        pageTitle="Detail Proposal"
        pageDescription={`Melihat detail informasi dan konfigurasi untuk proposal ${proposal.title}. Formulir ini dalam mode baca saja (read-only).`}
      />
    </AdminShell>
  )
}
