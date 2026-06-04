'use client'

import { ArrowUpDown, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { SuperadminEmptyState, SuperadminShell, SuperadminStatusBadge, SuperadminFilterChip } from '@/components/superadmin/superadmin-shell'
import { SuperadminOnboardingTour } from '@/components/superadmin/onboarding-tour'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useSuperadminProposalDrafts } from '@/hooks/use-proposal-draft'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  DataTableHead,
  DataTableHeaderCell,
  DataTableHeaderRow,
  DataTableRow,
  DataTableShell,
  DataTableViewport,
  RowActionMenu,
} from '@/components/ui/data-table'

type SortField = 'tanggal' | 'organisasi' | 'jenis' | 'status'
const PAGE_SIZE = 10
const PROPOSAL_STATUS_FILTERS = ['Semua', 'Menunggu Review', 'Disetujui', 'Berjalan'] as const
type ProposalStatusFilter = (typeof PROPOSAL_STATUS_FILTERS)[number]

export default function SuperadminProposalManagementPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState<ProposalStatusFilter>('Semua')
  const [currentPage, setCurrentPage] = useState(1)
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
    let rows = proposalRows

    if (activeStatus !== 'Semua') {
      rows = rows.filter((row) => row.status === activeStatus)
    }

    if (normalizedQuery) {
      rows = rows.filter((row) => row.organizationName.toLowerCase().includes(normalizedQuery) || row.id.toLowerCase().includes(normalizedQuery) || row.proposalType.toLowerCase().includes(normalizedQuery))
    }

    return [...rows].sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1

      if (sortField === 'organisasi') return left.organizationName.localeCompare(right.organizationName) * direction
      if (sortField === 'jenis') return left.proposalType.localeCompare(right.proposalType) * direction
      if (sortField === 'status') return left.status.localeCompare(right.status) * direction
      return left.submittedAt.localeCompare(right.submittedAt) * direction
    })
  }, [proposalRows, query, sortDirection, sortField, activeStatus])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const paginatedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [query, sortDirection, sortField, activeStatus])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="group inline-flex items-center gap-1.5 border-none bg-transparent p-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 outline-none transition-colors hover:text-slate-700"
    >
      {label}
      <ArrowUpDown className={`h-3.5 w-3.5 ${sortField === field ? 'text-slate-700' : 'text-slate-400'}`} />
    </button>
  )

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader 
          title="Manajemen Proposal" 
          description="Daftar proposal pemilihan yang menunggu persetujuan dari admin tingkat institusi." 
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1 rounded-[24px] bg-slate-100 p-1.5">
            {PROPOSAL_STATUS_FILTERS.map((status) => (
              <SuperadminFilterChip key={status} active={activeStatus === status} onClick={() => setActiveStatus(status)}>
                {status}
              </SuperadminFilterChip>
            ))}
          </div>
          <label className="relative block w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari proposal..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-black"
            />
          </label>
        </div>
      </ScrollReveal>

      <StaggerContainer stagger={50} variant="fade-up" duration={600} className="mt-4">
        <DataTableShell className="relative rounded-[32px] border border-slate-200 bg-slate-50 p-3">
          <DataTableViewport>
            <DataTable className="[border-spacing:0_10px]">
              <DataTableHead className="bg-transparent">
                <DataTableHeaderRow>
                  <DataTableHeaderCell><SortHeader field="organisasi" label="Organisasi / ID" /></DataTableHeaderCell>
                  <DataTableHeaderCell><SortHeader field="jenis" label="Jenis Proposal" /></DataTableHeaderCell>
                  <DataTableHeaderCell><SortHeader field="tanggal" label="Tanggal Diajukan" /></DataTableHeaderCell>
                  <DataTableHeaderCell><SortHeader field="status" label="Status" /></DataTableHeaderCell>
                  <DataTableHeaderCell className="text-center">Aksi</DataTableHeaderCell>
                </DataTableHeaderRow>
              </DataTableHead>
              <DataTableBody className="bg-transparent">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <DataTableRow key={`proposal-loading-${index}`} className="[&>td]:rounded-[20px] [&>td]:border [&>td]:border-slate-200 [&>td]:bg-white">
                      <DataTableCell colSpan={5}>
                        <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                      </DataTableCell>
                    </DataTableRow>
                  ))
                ) : error ? (
                  <DataTableRow className="[&>td]:rounded-[20px] [&>td]:border [&>td]:border-slate-200 [&>td]:bg-white">
                    <DataTableCell colSpan={5} className="text-[14px] text-red-600">
                      {getRepositoryErrorMessage(error)}
                    </DataTableCell>
                  </DataTableRow>
                ) : paginatedRows.length > 0 ? paginatedRows.map((proposal) => (
                  <DataTableRow
                    key={proposal.id}
                    className="cursor-pointer [&>td]:border-y [&>td]:border-slate-200 [&>td]:bg-white [&>td:first-child]:rounded-l-[20px] [&>td:first-child]:border-l [&>td:last-child]:rounded-r-[20px] [&>td:last-child]:border-r hover:[&>td]:border-slate-300 hover:[&>td]:bg-slate-50/80"
                    onClick={() => router.push(`/superadmin/manajemen-proposal/${proposal.id}`)}
                  >
                    <DataTableCell>
                      <p className="text-[16px] font-semibold text-slate-900">{proposal.organizationName}</p>
                      <p className="mt-1 font-mono text-[12px] text-slate-500">{proposal.id}</p>
                    </DataTableCell>
                    <DataTableCell>
                      <p className="text-[15px] text-slate-900">{proposal.proposalType}</p>
                    </DataTableCell>
                    <DataTableCell>
                      <p className="font-mono text-[13px] text-slate-600">{proposal.submittedAt}</p>
                    </DataTableCell>
                    <DataTableCell>
                      <SuperadminStatusBadge status={proposal.status} />
                    </DataTableCell>
                    <DataTableCell className="text-center" onClick={(event) => event.stopPropagation()}>
                      <RowActionMenu
                        buttonLabel={`Aksi untuk proposal ${proposal.organizationName}`}
                        items={[
                          { label: 'Detail', onClick: () => router.push(`/superadmin/manajemen-proposal/${proposal.id}`) },
                          { label: 'Review', onClick: () => router.push(`/superadmin/manajemen-proposal/${proposal.id}`) },
                        ]}
                      />
                    </DataTableCell>
                  </DataTableRow>
                )) : (
                  <DataTableEmpty colSpan={5} title="Belum ada proposal yang sesuai" description="Coba ubah kata kunci pencarian untuk menampilkan proposal lain." />
                )}
              </DataTableBody>
            </DataTable>
          </DataTableViewport>
          <DataTableFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRows.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="proposal"
          />
        </DataTableShell>
      </StaggerContainer>
    </SuperadminShell>
  )
}
