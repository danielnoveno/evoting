'use client'

import { AlertTriangle, Clock3, Eye, FileCheck2, PauseCircle, PlayCircle, Search, ShieldCheck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useCallback } from 'react'
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
import { useAuthSession } from '@/hooks/use-auth-session'
import { SuperadminElectionState, superadminElectionFilters } from '@/lib/superadmin-data'
import { useSuperadminElectionsStore } from '@/lib/superadmin-store'
import type { SuperadminElectionRecord } from '@/lib/superadmin-data'
import { resolveSchedulePhase } from '@/lib/election-phase'
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
  SortableTableHeader,
  type TableSortDirection,
} from '@/components/ui/data-table'

type ElectionFilter = (typeof superadminElectionFilters)[number]
type SortField = 'title' | 'code' | 'status' | 'voters' | 'participation'
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
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<TableSortDirection>(null)
  const { data: proposalRowsRaw, isLoading, error } = useSuperadminProposalDrafts()
  const { elections: storeElections, setElections } = useSuperadminElectionsStore()
  const authSession = useAuthSession()

  // Halt dialog state
  const [haltDialogOpen, setHaltDialogOpen] = useState(false)
  const [haltNote, setHaltNote] = useState('')
  const [haltingElectionId, setHaltingElectionId] = useState<string | null>(null)
  const [haltingElectionTitle, setHaltingElectionTitle] = useState('')

  const elections = useMemo(() => {
    if (!proposalRowsRaw) return []
    return proposalRowsRaw
      .filter(p => p.status === 'approved' || p.status === 'deployed' || p.status === 'suspended')
      .map(p => {
        const fromStore = storeElections.find(item => item.id === p.id)
        const phaseInfo = resolveSchedulePhase(p)
        const status = (p.status === 'suspended' || fromStore?.status === 'Ditangguhkan'
          ? 'Ditangguhkan'
          : phaseInfo.phase === 'ended'
            ? 'Selesai'
            : p.status === 'deployed'
              ? 'Aktif'
              : 'Selesai') as SuperadminElectionState
        
        return {
          id: p.id,
          title: p.title,
          code: `VC-${p.id.slice(0, 4).toUpperCase()}`,
          status,
          note: status === 'Ditangguhkan' ? 'Halted' : (p.status === 'deployed' ? 'Online' : 'Final'),
          phaseLabel: phaseInfo.phase === 'ended' ? 'Pemilihan Selesai' : p.status === 'deployed' ? 'Fase Berjalan' : 'Pemilihan Selesai',
          totalVoters: fromStore?.totalVoters ?? '0',
          participation: fromStore?.participation ?? '0%'
        }
      })
  }, [proposalRowsRaw, storeElections])

  const filteredElections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const filtered = elections.filter((election) => {
      const matchesStatus = activeFilter === 'Semua' ? true : election.status === activeFilter
      const matchesSearch = !normalizedSearch
        || election.title.toLowerCase().includes(normalizedSearch)
        || election.code.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })

    if (!sortField || !sortDirection) return filtered

    return [...filtered].sort((left, right) => {
      const leftValue = sortField === 'title' ? left.title
        : sortField === 'code' ? left.code
          : sortField === 'status' ? `${left.status} ${left.phaseLabel}`
            : sortField === 'voters' ? left.totalVoters
              : left.participation
      const rightValue = sortField === 'title' ? right.title
        : sortField === 'code' ? right.code
          : sortField === 'status' ? `${right.status} ${right.phaseLabel}`
            : sortField === 'voters' ? right.totalVoters
              : right.participation

      const leftNumber = Number(String(leftValue).replace(/[^0-9.]/g, ''))
      const rightNumber = Number(String(rightValue).replace(/[^0-9.]/g, ''))
      const comparison = sortField === 'voters' || sortField === 'participation'
        ? (leftNumber || 0) - (rightNumber || 0)
        : String(leftValue).toLowerCase().localeCompare(String(rightValue).toLowerCase())

      return comparison * (sortDirection === 'asc' ? 1 : -1)
    })
  }, [activeFilter, elections, searchTerm, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredElections.length / PAGE_SIZE))
  const paginatedElections = filteredElections.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter, searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field)
      setSortDirection('asc')
      return
    }

    if (sortDirection === 'asc') {
      setSortDirection('desc')
      return
    }

    if (sortDirection === 'desc') {
      setSortField(null)
      setSortDirection(null)
      return
    }

    setSortDirection('asc')
  }

  const updateElectionStatus = useCallback(async (id: string, newStatus: SuperadminElectionState, message: string) => {
    // Optimistic UI update
    setElections((current) => {
      const existing = current.find(item => item.id === id)
      if (existing) {
        return current.map(item => item.id === id ? { ...item, status: newStatus, note: newStatus === 'Ditangguhkan' ? 'Halted' : 'Online' } : item)
      } else {
        const election = elections.find(e => e.id === id)
        if (!election) return current
        return [...current, { ...election, status: newStatus, note: newStatus === 'Ditangguhkan' ? 'Halted' : 'Online' } as unknown as SuperadminElectionRecord]
      }
    })

    // Map SuperadminElectionState to proposal DB status
    const apiStatus = newStatus === 'Ditangguhkan' ? 'suspended' : 'deployed'
    const token = authSession.data?.access_token
    if (!token) {
      showToast({ tone: 'error', title: 'Sesi berakhir', description: 'Silakan masuk kembali.' })
      return
    }

    try {
      const response = await fetch(`/api/proposals/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: apiStatus, message }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(typeof body.error === 'string' ? body.error : 'Gagal memperbarui status.')
      }
      showToast({ tone: 'success', title: message, description: 'Perubahan berhasil diterapkan.' })
    } catch (err) {
      // Revert optimistic update
      setElections((current) => {
        const election = elections.find(e => e.id === id)
        if (!election) return current
        return current.map(item => item.id === id ? { ...item, status: 'Aktif', note: 'Online' } : item)
      })
      const desc = err instanceof Error ? err.message : 'Gagal memperbarui status pemilihan.'
      showToast({ tone: 'error', title: 'Gagal memperbarui', description: desc })
    }
  }, [authSession.data?.access_token, elections, setElections, showToast])

  const getCardTarget = (id: string, status: SuperadminElectionState) => {
    if (status === 'Aktif') return `/superadmin/manajemen-pemilihan/${id}/moderasi`
    if (status === 'Ditangguhkan') return `/superadmin/manajemen-pemilihan/${id}/investigasi`
    return `/superadmin/manajemen-pemilihan/${id}/laporan-final`
  }

  const openHaltDialog = (id: string, title: string) => {
    setHaltingElectionId(id)
    setHaltingElectionTitle(title)
    setHaltNote('')
    setHaltDialogOpen(true)
  }

  const handleHaltConfirm = () => {
    if (!haltingElectionId || !haltNote.trim()) return
    updateElectionStatus(haltingElectionId, 'Ditangguhkan', haltNote.trim())
    setHaltDialogOpen(false)
    setHaltingElectionId(null)
    setHaltNote('')
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
                  <DataTableHeaderCell>
                    <SortableTableHeader label="Pemilihan" active={sortField === 'title'} direction={sortDirection} onClick={() => handleSort('title')} />
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <SortableTableHeader label="Kode" active={sortField === 'code'} direction={sortDirection} onClick={() => handleSort('code')} />
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <SortableTableHeader label="Status / Fase" active={sortField === 'status'} direction={sortDirection} onClick={() => handleSort('status')} />
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <SortableTableHeader label="Total Pemilih" active={sortField === 'voters'} direction={sortDirection} onClick={() => handleSort('voters')} />
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    <SortableTableHeader label="Partisipasi" active={sortField === 'participation'} direction={sortDirection} onClick={() => handleSort('participation')} />
                  </DataTableHeaderCell>
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
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Detail ${election.title}`}
                          onClick={() => router.push(getCardTarget(election.id, election.status))}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {election.status === 'Aktif' ? (
                          <>
                            <button
                              type="button"
                              aria-label={`Moderasi ${election.title}`}
                              onClick={() => router.push(`/superadmin/manajemen-pemilihan/${election.id}/moderasi`)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Tangguhkan ${election.title}`}
                              onClick={() => openHaltDialog(election.id, election.title)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                            >
                              <PauseCircle className="h-4 w-4" />
                            </button>
                          </>
                        ) : election.status === 'Ditangguhkan' ? (
                          <button
                            type="button"
                            aria-label={`Lanjutkan ${election.title}`}
                            onClick={() => updateElectionStatus(election.id, 'Aktif', 'Pemilihan dilanjutkan kembali')}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-600 transition hover:bg-emerald-50"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Final ${election.title}`}
                            onClick={() => showToast({ tone: 'info', title: 'Pemilihan selesai', description: 'Status final tidak dapat dimoderasi lagi.' })}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                          >
                            <FileCheck2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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

      {/* Halt Confirmation Dialog */}
      {haltDialogOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 px-4">
          <button type="button" aria-label="Tutup dialog" className="absolute inset-0" onClick={() => setHaltDialogOpen(false)} />
          <div className="relative w-full max-w-[480px] rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Tangguhkan Pemilihan?</h2>
                <p className="mt-1 text-[13px] text-slate-500">{haltingElectionTitle}</p>
              </div>
              <button type="button" onClick={() => setHaltDialogOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-[13px] font-medium text-amber-800">Perhatian</p>
                  <p className="mt-1 text-[12px] leading-5 text-amber-700">
                    Pemilihan yang ditangguhkan akan segera berhenti menerima transaksi. Pemilih tidak akan bisa melakukan commit/reveal.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="halt-note" className="block text-[13px] font-medium text-slate-700">
                Alasan Penangguhan <span className="text-red-500">*</span>
              </label>
              <textarea
                id="halt-note"
                rows={3}
                value={haltNote}
                onChange={(e) => setHaltNote(e.target.value)}
                placeholder="Contoh: Ditemukan aktivitas mencurigakan pada fase commit, perlu investigasi lebih lanjut."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-black"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">Catatan ini akan dikirim ke admin yang membuat pemilihan sebagai notifikasi.</p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setHaltDialogOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-md px-4 text-[13px] font-medium text-slate-800 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleHaltConfirm}
                disabled={!haltNote.trim()}
                className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-[13px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ya, Tangguhkan
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperadminShell>
  )
}
