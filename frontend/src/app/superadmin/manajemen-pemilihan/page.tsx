'use client'

import { AlertTriangle, Clock3, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import {
  SuperadminEmptyState,
  SuperadminFilterChip,
  SuperadminShell,
} from '@/components/superadmin/superadmin-shell'
import { SuperadminOnboardingTour } from '@/components/superadmin/onboarding-tour'
import { useSuperadminProposalDrafts } from '@/hooks/use-proposal-draft'
import { SuperadminElectionState, superadminElectionFilters } from '@/lib/superadmin-data'
import { useSuperadminElectionsStore } from '@/lib/superadmin-store'
import type { SuperadminElectionRecord } from '@/lib/superadmin-data'
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

type ElectionFilter = (typeof superadminElectionFilters)[number]
const PAGE_SIZE = 10

function getElectionTone(status: SuperadminElectionState) {
  if (status === 'Aktif') return 'bg-blue-50 text-slate-800'
  if (status === 'Ditangguhkan') return 'bg-red-50 text-red-600'
  return 'bg-emerald-50 text-emerald-600'
}

export default function SuperadminElectionManagementPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [activeFilter, setActiveFilter] = useState<ElectionFilter>('Semua')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { data: proposalRowsRaw, isLoading, error } = useSuperadminProposalDrafts()
  const { elections: storeElections, setElections } = useSuperadminElectionsStore()

  const elections = useMemo(() => {
    if (!proposalRowsRaw) return []
    return proposalRowsRaw
      .filter(p => p.status === 'approved' || p.status === 'deployed')
      .map(p => {
        const fromStore = storeElections.find(item => item.id === p.id)
        const status = (fromStore?.status ?? (p.status === 'deployed' ? 'Aktif' : 'Selesai')) as SuperadminElectionState
        
        return {
          id: p.id,
          title: p.title,
          code: `VC-${p.id.slice(0, 4).toUpperCase()}`,
          status,
          note: status === 'Ditangguhkan' ? 'Halted' : (p.status === 'deployed' ? 'Online' : 'Final'),
          phaseLabel: p.status === 'deployed' ? 'Fase Berjalan' : 'Pemilihan Selesai',
          totalVoters: fromStore?.totalVoters ?? '0',
          participation: fromStore?.participation ?? '0%'
        }
      })
  }, [proposalRowsRaw, storeElections])

  const filteredElections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return elections.filter((election) => {
      const matchesStatus = activeFilter === 'Semua' ? true : election.status === activeFilter
      const matchesSearch = !normalizedSearch
        || election.title.toLowerCase().includes(normalizedSearch)
        || election.code.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [activeFilter, elections, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredElections.length / PAGE_SIZE))
  const paginatedElections = filteredElections.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter, searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const updateElectionStatus = (id: string, status: SuperadminElectionState, message: string) => {
    setElections((current) => {
      const existing = current.find(item => item.id === id)
      if (existing) {
        return current.map(item => item.id === id ? { ...item, status, note: status === 'Ditangguhkan' ? 'Halted' : 'Online' } : item)
      } else {
        const election = elections.find(e => e.id === id)
        if (!election) return current
        return [...current, { ...election, status, note: status === 'Ditangguhkan' ? 'Halted' : 'Online' } as unknown as SuperadminElectionRecord]
      }
    })
    showToast({ tone: 'success', title: message, description: 'Perubahan berhasil diterapkan pada blockchain.' })
  }

  const getCardTarget = (id: string, status: SuperadminElectionState) => {
    if (status === 'Aktif') return `/superadmin/manajemen-pemilihan/${id}/moderasi`
    if (status === 'Ditangguhkan') return `/superadmin/manajemen-pemilihan/${id}/investigasi`
    return `/superadmin/manajemen-pemilihan/${id}/laporan-final`
  }

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader
          title="Manajemen Pemilihan"
          description="Pantau dan kelola ruang pemilihan aktif di jaringan blockchain."
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1 rounded-[24px] bg-slate-100 p-1.5">
            {superadminElectionFilters.map((filter) => (
              <SuperadminFilterChip key={filter} active={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
                {filter}
              </SuperadminFilterChip>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pemilihan..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-black md:w-64"
            />
          </div>
        </div>
      </ScrollReveal>

      <StaggerContainer stagger={50} variant="fade-up" duration={600} className="mt-4">
        <DataTableShell className="relative rounded-[32px] border border-slate-200 bg-slate-50 p-3">
          <DataTableViewport>
            <DataTable className="[border-spacing:0_10px]">
              <DataTableHead className="bg-transparent">
                <DataTableHeaderRow>
                  <DataTableHeaderCell>Pemilihan</DataTableHeaderCell>
                  <DataTableHeaderCell>Kode</DataTableHeaderCell>
                  <DataTableHeaderCell>Status / Fase</DataTableHeaderCell>
                  <DataTableHeaderCell>Total Pemilih</DataTableHeaderCell>
                  <DataTableHeaderCell>Partisipasi</DataTableHeaderCell>
                  <DataTableHeaderCell className="text-center">Aksi</DataTableHeaderCell>
                </DataTableHeaderRow>
              </DataTableHead>
              <DataTableBody className="bg-transparent">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <DataTableRow key={`election-loading-${index}`} className="[&>td]:rounded-[20px] [&>td]:border [&>td]:border-slate-200 [&>td]:bg-white">
                      <DataTableCell colSpan={6}>
                        <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                      </DataTableCell>
                    </DataTableRow>
                  ))
                ) : error ? (
                  <DataTableRow className="[&>td]:rounded-[20px] [&>td]:border [&>td]:border-slate-200 [&>td]:bg-white">
                    <DataTableCell colSpan={6}>
                      <SuperadminEmptyState title="Data pemilihan belum dapat dimuat" description="Terjadi kendala saat mengambil data. Coba muat ulang halaman atau periksa koneksi backend." />
                    </DataTableCell>
                  </DataTableRow>
                ) : paginatedElections.length > 0 ? paginatedElections.map((election) => (
                  <DataTableRow
                    key={election.id}
                    className="cursor-pointer [&>td]:border-y [&>td]:border-slate-200 [&>td]:bg-white [&>td:first-child]:rounded-l-[20px] [&>td:first-child]:border-l [&>td:last-child]:rounded-r-[20px] [&>td:last-child]:border-r hover:[&>td]:border-slate-300 hover:[&>td]:bg-slate-50/80"
                    onClick={() => router.push(getCardTarget(election.id, election.status))}
                  >
                    <DataTableCell>
                      <p className="text-[16px] font-semibold text-slate-900">{election.title}</p>
                    </DataTableCell>
                    <DataTableCell>
                      <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-[12px] text-slate-500">{election.code}</span>
                    </DataTableCell>
                    <DataTableCell>
                      <div className="space-y-2">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getElectionTone(election.status)}`}>
                          {election.status === 'Ditangguhkan' ? <AlertTriangle className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                          {election.note}
                        </span>
                        <p className={`flex items-center gap-2 text-[13px] ${election.status === 'Ditangguhkan' ? 'text-red-600' : 'text-slate-600'}`}>
                          <Clock3 className="h-4 w-4" />
                          {election.phaseLabel}
                        </p>
                      </div>
                    </DataTableCell>
                    <DataTableCell>
                      <p className="text-[16px] font-semibold text-slate-900">{election.totalVoters}</p>
                    </DataTableCell>
                    <DataTableCell>
                      <p className="text-[16px] font-semibold text-slate-900">{election.participation}</p>
                    </DataTableCell>
                    <DataTableCell className="text-center" onClick={(event) => event.stopPropagation()}>
                      <RowActionMenu
                        buttonLabel={`Aksi untuk ${election.title}`}
                        items={[
                          { label: 'Detail', onClick: () => router.push(getCardTarget(election.id, election.status)) },
                          ...(election.status === 'Aktif'
                            ? [
                              { label: 'Moderasi', onClick: () => router.push(`/superadmin/manajemen-pemilihan/${election.id}/moderasi`) },
                              { label: 'Suspend', onClick: () => updateElectionStatus(election.id, 'Ditangguhkan', 'Pemilihan ditangguhkan') },
                            ]
                            : election.status === 'Ditangguhkan'
                              ? [{ label: 'Resume', onClick: () => updateElectionStatus(election.id, 'Aktif', 'Pemilihan dilanjutkan kembali') }]
                              : [{ label: 'Final', onClick: () => showToast({ tone: 'info', title: 'Pemilihan selesai', description: 'Status final tidak dapat dimoderasi lagi.' }) }]),
                        ]}
                      />
                    </DataTableCell>
                  </DataTableRow>
                )) : (
                  <DataTableEmpty
                    colSpan={6}
                    title={elections.length === 0 ? 'Belum ada data pemilihan' : 'Tidak ada pemilihan pada filter ini'}
                    description={elections.length === 0
                      ? 'Ruang pemilihan akan tampil di sini setelah proposal disetujui atau berhasil dideploy.'
                      : 'Coba pilih filter lain untuk melihat ruang pemilihan yang tersedia.'}
                  />
                )}
              </DataTableBody>
            </DataTable>
          </DataTableViewport>
          <DataTableFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredElections.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            label="pemilihan"
          />
        </DataTableShell>
      </StaggerContainer>
    </SuperadminShell>
  )
}
