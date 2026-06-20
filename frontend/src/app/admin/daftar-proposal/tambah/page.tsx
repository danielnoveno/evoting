'use client'

import { AdminShell } from '@/components/admin/admin-shell'
import { ProposalForm } from '@/components/admin/proposal-form'

export default function AdminCreateProposalPage() {
  return (
    <AdminShell>
      <ProposalForm
        pageTitle="Formulir Proposal"
        pageDescription="Ajukan proposal pemilihan ke superadmin. Pemilihan baru akan dibuat di blockchain hanya setelah proposal disetujui dan di-deploy oleh superadmin."
        stepper
      />
    </AdminShell>
  )
}
