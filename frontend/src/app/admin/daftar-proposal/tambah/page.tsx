'use client'

import { AdminShell } from '@/components/admin/admin-shell'
import { ProposalForm } from '@/components/admin/proposal-form'

export default function AdminCreateProposalPage() {
  return (
    <AdminShell>
      <ProposalForm
        pageTitle="Formulir Proposal"
        pageDescription="Konfigurasikan parameter pemilihan umum berbasis blockchain dengan presisi tinggi untuk menjamin integritas data."
      />
    </AdminShell>
  )
}
