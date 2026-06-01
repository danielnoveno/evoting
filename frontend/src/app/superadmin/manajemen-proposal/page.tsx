'use client'

import { ArrowUpDown, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { SuperadminEmptyState, SuperadminInteractiveCard, SuperadminShell, SuperadminStatusBadge } from '@/components/superadmin/superadmin-shell'
import { SuperadminOnboardingTour } from '@/components/superadmin/onboarding-tour'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useSuperadminProposalDrafts } from '@/hooks/use-proposal-draft'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

type SortField = 'tanggal' | 'organisasi' | 'jenis' | 'status'

export default function SuperadminProposalManagementPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { data: proposalRowsRaw, isLoading, error } = useSuperadminProposalDrafts()
  
  const proposalRows = useMemo(() => {
    if (!proposalRowsRaw) return []
    return proposalRowsRaw.map(p => ({
      id: p.id,
      organizationName: p.organizationName ?? 'Organisasi Tanpa Nama',
      proposalType: 'Internal Organisasi', // Fallback type
      submittedAt: new Date(p.createdAt).toLocaleDateString('id-ID'),
      status: p.status === 'draft' ? 'Draf' : p.status === 'submitted' ? 'Menunggu Review' : p.status === 'approved' ? 'Disetujui' : p.status === 'deployed' ? 'Berjalan' : p.status
    }))
  }, [proposalRowsRaw])
  const [sortField, setSortField] = useState<SortField>('tanggal')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (nextField: SortField) => {
    if (sortField === nextField) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
      return
    }

    setSortField(nextField)
    setSortDirection(nextField === 'tanggal' ? 'desc' : 'asc')
  }

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    let rows = normalizedQuery
      ? proposalRows.filter((row) => row.organizationName.toLowerCase().includes(normalizedQuery) || row.id.toLowerCase().includes(normalizedQuery) || row.proposalType.toLowerCase().includes(normalizedQuery))
      : proposalRows

    return [...rows].sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1

      if (sortField === 'organisasi') return left.organizationName.localeCompare(right.organizationName) * direction
      if (sortField === 'jenis') return left.proposalType.localeCompare(right.proposalType) * direction
      if (sortField === 'status') return left.status.localeCompare(right.status) * direction
      return left.submittedAt.localeCompare(right.submittedAt) * direction
    })
  }, [proposalRows, query, sortDirection, sortField])

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader 
          title="Manajemen Proposal" 
          description="Daftar proposal pemilihan yang menunggu persetujuan dari admin tingkat institusi." 
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={150} duration={800}>
        <AppSectionCard className="mt-8">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-4 text-[13px] text-red-600">
              {getRepositoryErrorMessage(error)}
            </div>
          )}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 lg:max-w-[420px]">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama organisasi atau ID proposal..."
                className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
        </AppSectionCard>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={250} duration={800}>
        <section className="mt-8 rounded-[24px] bg-white px-6 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-4 lg:hidden">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Urutan Aktif</p>
              <p className="mt-1 text-[14px] font-medium text-slate-900">
                {sortField.charAt(0).toUpperCase() + sortField.slice(1)} · {sortDirection === 'asc' ? 'Menaik' : 'Menurun'}
              </p>
            </div>
          </div>

          <div className="hidden gap-4 lg:grid lg:grid-cols-[1.3fr_1.3fr_0.8fr_220px] lg:items-center">
            {[
              { key: 'organisasi', label: 'Nama Organisasi' },
              { key: 'jenis', label: 'Jenis Proposal' },
              { key: 'tanggal', label: 'Tanggal Diajukan' },
              { key: 'status', label: 'Status' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSort(item.key as SortField)}
                className={sortField === item.key
                  ? 'inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-white'
                  : 'inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
              >
                {item.label}
                <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === item.key ? 'opacity-100' : 'opacity-50'}`} />
                {sortField === item.key ? <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-white">{sortDirection === 'asc' ? 'Naik' : 'Turun'}</span> : null}
              </button>
            ))}
          </div>

          <div className="hidden pt-4 lg:flex lg:items-center lg:justify-between">
            <p className="text-[12px] text-slate-500">
              Klik judul kolom untuk mengganti urutan data.
            </p>
            <p className="text-[12px] font-medium text-slate-700">
              Aktif: <span className="text-slate-900">{sortField}</span> · {sortDirection === 'asc' ? 'menaik' : 'menurun'}
            </p>
          </div>
        </section>
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 w-full animate-pulse rounded-[24px] bg-slate-100" />
          ))
        ) : filteredRows.length > 0 ? filteredRows.map((proposal) => (
          <SuperadminInteractiveCard key={proposal.id} onClick={() => router.push(`/superadmin/manajemen-proposal/${proposal.id}`)} className="bg-slate-100 px-6 py-5 shadow-[0_16px_60px_rgba(15,23,42,0.05)]">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_1.3fr_0.8fr_220px] lg:items-center">
              <div>
                <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">Nama Organisasi</p>
                <p className="mt-2 text-[18px] font-semibold text-slate-900">{proposal.organizationName}</p>
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">Jenis Proposal</p>
                <p className="mt-2 text-[18px] text-slate-900">{proposal.proposalType}</p>
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">Tanggal Diajukan</p>
                <p className="mt-2 font-mono text-[18px] text-slate-900">{proposal.submittedAt}</p>
              </div>
              <div className="flex flex-col items-start gap-3 lg:items-end">
                <SuperadminStatusBadge status={proposal.status} />
                <Link
                  href={`/superadmin/manajemen-proposal/${proposal.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#0B1120] px-6 text-[15px] font-medium text-white hover:bg-slate-800"
                >
                  Review
                </Link>
              </div>
            </div>
          </SuperadminInteractiveCard>
        )) : <SuperadminEmptyState title="Belum ada proposal yang sesuai" description="Coba ubah kata kunci pencarian untuk menampilkan proposal lain." />}
      </StaggerContainer>
    </SuperadminShell>
  )
}
