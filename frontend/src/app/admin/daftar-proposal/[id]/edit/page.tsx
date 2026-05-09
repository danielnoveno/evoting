'use client'

import { notFound } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'
import { ProposalForm, ProposalFormData } from '@/components/admin/proposal-form'
import { adminProposalContent } from '@/lib/admin-proposal-dummy-data'

export default function AdminEditProposalPage({ params }: { params: { id: string } }) {
  const proposal = adminProposalContent.proposals.find(p => p.id === params.id)
  
  if (!proposal) {
    notFound()
  }

  // Map dummy row to form data
  const initialData: Partial<ProposalFormData> = {
    title: proposal.title,
    category: proposal.category,
    description: `Deskripsi default untuk proposal ${proposal.title}.`,
    candidateCount: 2,
    voterCount: parseInt(proposal.votersEstimate.replace(/,/g, ''), 10) || 0,
    commitDate: '2026-06-12T09:00',
    revealDate: '2026-06-19T09:00'
  }

  return (
    <AdminShell>
      <ProposalForm
        initialData={initialData}
        pageTitle="Edit Proposal"
        pageDescription={`Perbarui parameter untuk proposal ${proposal.title}. Perubahan yang dilakukan akan disimpan ke dalam draf sebelum dipublikasi.`}
        submitLabel="Simpan Perubahan"
        successMessageTitle="Perubahan Disimpan"
        successMessageDesc={`Proposal ${proposal.title} berhasil diperbarui.`}
      />
    </AdminShell>
  )
}
