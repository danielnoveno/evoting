'use client'

import { AlertTriangle, Check, Download, FileText, Loader2, Mail, Pencil, Search, Trash2, Upload, X, UserPlus } from 'lucide-react'
import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { SuperadminShell, SuperadminAvatar, SuperadminTabButton, SuperadminSectionHeading, SuperadminTextInput, SuperadminFieldLabel, SuperadminToolbarButton, SuperadminSelectInput } from '@/components/superadmin/superadmin-shell'
import { SuperadminOnboardingTour } from '@/components/superadmin/onboarding-tour'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableFooter,
  DataTableHead,
  DataTableHeaderCell,
  DataTableHeaderRow,
  FloatingSelectionBar,
  DataTableRow,
  DataTableShell,
  DataTableViewport,
  SelectedCounter,
  SortableTableHeader,
  type TableSortDirection,
} from '@/components/ui/data-table'
import { useToast } from '@/components/ui/toast-provider'
import { useSendVoterActivationEmails } from '@/hooks/use-voter-activation'
import {
  useMasterVotersList,
  useAddMasterVoter,
  useDeleteMasterVoter,
  useBulkDeleteMasterVoters,
  useBulkInsertMasterVoters,
  type MasterVoter,
} from '@/hooks/use-master-voters-admin'

const MASTER_VOTER_CSV_HEADERS = ['nim', 'nama', 'email', 'fakultas'] as const
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const

type TabKey = 'daftar' | 'tambah'
type SortField = 'name' | 'nim' | 'email' | 'prodi' | 'status'

const initialFormData = {
  nim: '',
  name: '',
  email: '',
  faculty: '',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'VT'
}

const PRODI_OPTIONS = [
  'Informatika',
  'Sistem Informasi',
  'Teknik Industri',
  'Arsitektur',
  'Teknik Sipil',
  'Manajemen',
  'Akuntansi',
  'Ekonomi Pembangunan',
  'Hukum',
  'Biologi',
  'Ilmu Komunikasi',
  'Sosiologi',
] as const

export function SuperadminMasterVoterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const sendVoterActivationEmailsMutation = useSendVoterActivationEmails()

  // Supabase hooks
  const votersQuery = useMasterVotersList()
  const addVoterMutation = useAddMasterVoter()
  const deleteVoterMutation = useDeleteMasterVoter()
  const bulkDeleteMutation = useBulkDeleteMasterVoters()
  const bulkInsertMutation = useBulkInsertMasterVoters()

  const voters = useMemo(() => {
    return (votersQuery.data ?? []).map((v) => ({
      ...v,
      syncStatus: v.walletAddress ? 'Tersinkronisasi' as const : 'Belum Sinkron' as const,
    }))
  }, [votersQuery.data])

  const [activeTab, setActiveTab] = useState<TabKey>('daftar')
  const [formData, setFormData] = useState(initialFormData)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'semua' | 'belum-sinkron' | 'tersinkronisasi' | 'terpilih'>('semua')
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [parsedRows, setParsedRows] = useState<Array<{ nim: string; full_name: string; email: string; prodi: string }>>([])
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([])
  const [selectionBarDismissed, setSelectionBarDismissed] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<TableSortDirection>(null)
  const [deleteSelectedDialogOpen, setDeleteSelectedDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    setActiveTab(tab === 'tambah' ? 'tambah' : 'daftar')
  }, [searchParams])

  const updateTab = (tab: TabKey) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'tambah') {
      params.set('tab', 'tambah')
    } else {
      params.delete('tab')
    }
    router.replace(`/superadmin/data-voter?${params.toString()}`)
  }

  const filteredVoters = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    const filtered = voters.filter((voter) => {
      const matchesSearch = (
        voter.nim.includes(term) ||
        voter.fullName.toLowerCase().includes(term) ||
        voter.email.toLowerCase().includes(term) ||
        voter.prodi.toLowerCase().includes(term)
      )
      const matchesFilter = activeFilter === 'semua' ? true
        : activeFilter === 'belum-sinkron' ? voter.syncStatus === 'Belum Sinkron'
          : activeFilter === 'tersinkronisasi' ? voter.syncStatus === 'Tersinkronisasi'
            : selectedVoterIds.includes(voter.id)
      return matchesSearch && matchesFilter
    })

    if (!sortField || !sortDirection) return filtered

    return [...filtered].sort((left, right) => {
      const leftValue = sortField === 'name' ? left.fullName
        : sortField === 'nim' ? left.nim
          : sortField === 'email' ? left.email
            : sortField === 'prodi' ? left.prodi
              : left.syncStatus
      const rightValue = sortField === 'name' ? right.fullName
        : sortField === 'nim' ? right.nim
          : sortField === 'email' ? right.email
            : sortField === 'prodi' ? right.prodi
              : right.syncStatus

      return leftValue.toLowerCase().localeCompare(rightValue.toLowerCase()) * (sortDirection === 'asc' ? 1 : -1)
    })
  }, [voters, searchTerm, activeFilter, selectedVoterIds, sortField, sortDirection])

  const selectedVoters = useMemo(
    () => voters.filter((voter) => selectedVoterIds.includes(voter.id)),
    [selectedVoterIds, voters],
  )

  const handleSendActivationEmails = (targets: MasterVoter[]) => {
    const recipients = targets
      .filter((voter) => !voter.walletAddress)
      .map((voter) => ({
        email: voter.email,
        name: voter.fullName,
        nim: voter.nim,
      }))

    if (recipients.length === 0) {
      showToast({
        tone: 'info',
        title: 'Tidak ada email yang dikirim',
        description: 'Voter terpilih sudah memiliki wallet atau tidak membutuhkan aktivasi ulang.',
      })
      return
    }

    sendVoterActivationEmailsMutation.mutate({ recipients }, {
      onSuccess: (result) => {
        showToast({
          tone: result.failedCount > 0 ? 'info' : 'success',
          title: 'Email aktivasi diproses',
          description: `${result.sentCount} terkirim, ${result.failedCount} gagal.`,
        })
      },
      onError: (error) => {
        showToast({ tone: 'error', title: 'Gagal mengirim email aktivasi', description: error.message })
      },
    })
  }

  const selectedFilteredCount = filteredVoters.filter((voter) => selectedVoterIds.includes(voter.id)).length
  const totalPages = Math.max(1, Math.ceil(filteredVoters.length / pageSize))
  const paginatedVoters = filteredVoters.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const allFilteredSelected = filteredVoters.length > 0 && filteredVoters.every((voter) => selectedVoterIds.includes(voter.id))

  useEffect(() => { setCurrentPage(1) }, [searchTerm, activeFilter, pageSize])
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages) }, [currentPage, totalPages])
  useEffect(() => { setSelectionBarDismissed(false) }, [selectedVoterIds])

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

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedVoterIds((current) => current.filter((id) => !filteredVoters.some((v) => v.id === id)))
    } else {
      setSelectedVoterIds((current) => Array.from(new Set([...current, ...filteredVoters.map((v) => v.id)])))
    }
  }

  const toggleSelectedVoter = (id: string) => {
    setSelectedVoterIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const handleNpmChange = (npm: string) => {
    const cleanNpm = npm.replace(/\D/g, '')
    setFormData((prev) => {
      const newData = { ...prev, nim: cleanNpm }
      if (cleanNpm && (!prev.email || prev.email === `${prev.nim}@students.uajy.ac.id`)) {
        newData.email = `${cleanNpm}@students.uajy.ac.id`
      } else if (!cleanNpm && prev.email === `${prev.nim}@students.uajy.ac.id`) {
        newData.email = ''
      }
      return newData
    })
  }

  const handleCreateManualVoter = () => {
    const { nim, name, email, faculty } = formData
    if (!nim.trim() || !name.trim() || !email.trim() || !faculty.trim()) {
      showToast({ tone: 'error', title: 'Data belum lengkap', description: 'Lengkapi semua kolom formulir.' })
      return
    }
    if (!/^\d{8,10}$/.test(nim)) {
      showToast({ tone: 'error', title: 'NIM tidak valid', description: 'NIM harus berupa 8-10 digit angka.' })
      return
    }

    addVoterMutation.mutate(
      { nim, fullName: name, email, prodi: faculty },
      {
        onSuccess: () => {
          setFormData(initialFormData)
          showToast({ tone: 'success', title: 'Mahasiswa ditambahkan', description: `${name} berhasil ditambahkan ke data master.` })
          updateTab('daftar')
        },
        onError: (error) => {
          showToast({ tone: 'error', title: 'Gagal menambahkan', description: error.message })
        },
      },
    )
  }

  const handleBulkDeleteSelected = () => {
    if (selectedVoterIds.length === 0) return
    bulkDeleteMutation.mutate(selectedVoterIds, {
      onSuccess: (count) => {
        setSelectedVoterIds([])
        setDeleteSelectedDialogOpen(false)
        showToast({ tone: 'success', title: 'Voter terpilih dihapus', description: `${count} data voter berhasil dihapus dari data master.` })
      },
      onError: (error) => {
        showToast({ tone: 'error', title: 'Gagal menghapus', description: error.message })
      },
    })
  }

  const handleCSVParsing = (text: string) => {
    const lines = text.split(/\r?\n/)
    const tempRows: Array<{ nim: string; full_name: string; email: string; prodi: string }> = []
    const tempErrors: string[] = []

    const firstNonEmptyLine = lines.find((line) => line.trim())
    if (firstNonEmptyLine) {
      const headerColumns = firstNonEmptyLine.split(',').map((col) => col.trim().replace(/^["']|["']$/g, '').toLowerCase())
      const hasHeader = MASTER_VOTER_CSV_HEADERS.some((header, index) => headerColumns[index] === header)
      if (hasHeader) {
        const isHeaderValid = MASTER_VOTER_CSV_HEADERS.every((header, index) => headerColumns[index] === header)
        if (!isHeaderValid) {
          setCsvErrors([`Header CSV tidak sesuai template. Gunakan urutan kolom: ${MASTER_VOTER_CSV_HEADERS.join(', ')}.`])
          setParsedRows([])
          return
        }
      }
    }

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim()
      if (!line) continue
      const cols = line.split(',').map((col) => col.trim().replace(/^["']|["']$/g, ''))
      if (cols.length < 4) {
        if (i === 0 && (cols[0].toLowerCase().includes('nim') || cols[0].toLowerCase().includes('nama'))) continue
        tempErrors.push(`Baris ${i + 1}: Data kolom tidak lengkap (harus NIM, Nama, Email, Fakultas).`)
        continue
      }
      const [nim, name, email, faculty] = cols
      if (i === 0 && (nim.toLowerCase() === 'nim' || name.toLowerCase() === 'nama')) continue
      if (!/^\d{8,10}$/.test(nim)) { tempErrors.push(`Baris ${i + 1}: NIM "${nim}" tidak valid.`); continue }
      if (!name) { tempErrors.push(`Baris ${i + 1}: Nama wajib diisi.`); continue }
      if (!/^[a-zA-Z0-9._%+-]+@/.test(email)) { tempErrors.push(`Baris ${i + 1}: Email "${email}" tidak valid.`); continue }
      if (!faculty) { tempErrors.push(`Baris ${i + 1}: Fakultas wajib diisi.`); continue }

      const isDuplicate = voters.some((v) => v.nim === nim) || tempRows.some((r) => r.nim === nim)
      if (isDuplicate) { tempErrors.push(`Baris ${i + 1}: NIM "${nim}" sudah terdaftar.`); continue }

      tempRows.push({ nim, full_name: name, email, prodi: faculty })
    }

    setCsvErrors(tempErrors)
    setParsedRows(tempRows)
  }

  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv') {
      setCsvErrors(['Format file tidak didukung. Harap unggah berkas berekstensi .csv'])
      setCsvFile(null)
      setParsedRows([])
      return
    }
    setCsvFile(file)
    setCsvErrors([])
    const reader = new FileReader()
    reader.onload = (event) => { handleCSVParsing(event.target?.result as string) }
    reader.onerror = () => { setCsvErrors(['Gagal membaca file. Silakan coba lagi.']) }
    reader.readAsText(file)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    processFile(files[0])
  }

  const handleDragOver = (event: DragEvent) => { event.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => { setIsDragging(false) }
  const handleDrop = (event: DragEvent) => {
    event.preventDefault(); setIsDragging(false)
    const files = event.dataTransfer.files
    if (files && files.length > 0) processFile(files[0])
  }

  const closeModal = () => { setShowCsvModal(false); setCsvFile(null); setCsvErrors([]); setParsedRows([]) }

  const handleImportSubmit = () => {
    if (parsedRows.length === 0) return
    bulkInsertMutation.mutate(parsedRows, {
      onSuccess: (count) => {
        showToast({ tone: 'success', title: 'Data berhasil diimpor', description: `${count} mahasiswa berhasil ditambahkan ke Data Master Voter.` })
        closeModal()
      },
      onError: (error) => {
        showToast({ tone: 'error', title: 'Gagal mengimpor', description: error.message })
      },
    })
  }

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[44px]">
              Data Master Voter Platform
            </h1>
            <p className="mt-3 max-w-3xl text-[16px] leading-8 text-slate-800">
              Kelola daftar induk voter platform dari database. Impor data kampus melalui CSV atau tambahkan manual.
            </p>
          </div>
        </section>

        <div className="mt-10 flex items-end justify-between border-b border-slate-200">
          <div className="flex items-center gap-8">
            <SuperadminTabButton active={activeTab === 'daftar'} onClick={() => updateTab('daftar')}>
              Daftar Voter
            </SuperadminTabButton>
            <SuperadminTabButton active={activeTab === 'tambah'} onClick={() => updateTab('tambah')}>
              Tambah Baru
            </SuperadminTabButton>
          </div>
          {activeTab === 'daftar' && (
            <div className="hidden items-center gap-4 pb-3 sm:flex">
              <div className="h-4 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total Voter</p>
                <p className="mt-0.5 text-[16px] font-semibold text-slate-900">
                  {votersQuery.isLoading ? '...' : voters.length} Mahasiswa
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {activeTab === 'daftar' ? (
        <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-slate-900 px-6 text-[15px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" />
              Impor Data Master via CSV
            </button>
            <SuperadminToolbarButton variant="primary" onClick={() => updateTab('tambah')}>
              <UserPlus className="h-4 w-4" />
              Tambah Manual
            </SuperadminToolbarButton>
          </div>

          <ScrollReveal variant="fade-up" delay={200} duration={800}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-1 rounded-[24px] bg-slate-100 p-1.5">
                  {[
                    { key: 'semua', label: 'Semua Status' },
                    { key: 'belum-sinkron', label: 'Belum Sinkron' },
                    { key: 'tersinkronisasi', label: 'Tersinkronisasi' },
                    { key: 'terpilih', label: 'Terpilih' },
                  ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveFilter(item.key as typeof activeFilter)}
                    className={activeFilter === item.key
                      ? 'inline-flex h-10 items-center justify-center rounded-2xl bg-white px-5 text-[15px] font-semibold text-slate-900 shadow-sm'
                      : 'inline-flex h-10 items-center justify-center rounded-2xl px-5 text-[15px] text-slate-800 hover:bg-white/70'}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari voter..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-black md:w-64"
                />
              </div>
            </div>
          </ScrollReveal>

          <DataTableShell className="relative rounded-[32px] border border-slate-200 bg-slate-50 p-3">
            <DataTableViewport>
              <DataTable className="[border-spacing:0_10px]">
                <DataTableHead className="bg-transparent">
                  <DataTableHeaderRow>
                    <DataTableHeaderCell className="w-[56px]">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        aria-label="Pilih semua voter yang tampil"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <SortableTableHeader label="Profil Voter" active={sortField === 'name'} direction={sortDirection} onClick={() => handleSort('name')} />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <SortableTableHeader label="Email" active={sortField === 'email'} direction={sortDirection} onClick={() => handleSort('email')} />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <SortableTableHeader label="Program Studi" active={sortField === 'prodi'} direction={sortDirection} onClick={() => handleSort('prodi')} />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <SortableTableHeader label="Status" active={sortField === 'status'} direction={sortDirection} onClick={() => handleSort('status')} />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell className="text-center">Aksi</DataTableHeaderCell>
                  </DataTableHeaderRow>
                </DataTableHead>
                <DataTableBody className="bg-transparent">
                  {votersQuery.isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <DataTableRow key={`loading-${i}`} className="[&>td]:rounded-[20px] [&>td]:border [&>td]:border-slate-200 [&>td]:bg-white">
                        <DataTableCell colSpan={6} className="px-6 py-5">
                          <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                        </DataTableCell>
                      </DataTableRow>
                    ))
                  ) : paginatedVoters.length > 0 ? (
                    paginatedVoters.map((voter) => (
                      <DataTableRow
                        key={voter.id}
                        onClick={() => toggleSelectedVoter(voter.id)}
                        className={`cursor-pointer [&>td]:border-y [&>td]:border-slate-200 [&>td]:bg-white [&>td:first-child]:rounded-l-[20px] [&>td:first-child]:border-l [&>td:last-child]:rounded-r-[20px] [&>td:last-child]:border-r hover:[&>td]:border-slate-300 hover:[&>td]:bg-slate-50/80 ${selectedVoterIds.includes(voter.id) ? '[&>td]:border-slate-400 [&>td]:bg-slate-50' : ''}`}
                      >
                        <DataTableCell className="w-[56px]" onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedVoterIds.includes(voter.id)}
                            onChange={() => toggleSelectedVoter(voter.id)}
                            aria-label={`Pilih voter ${voter.fullName}`}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <div className="flex items-center gap-4">
                            <SuperadminAvatar initials={getInitials(voter.fullName)} />
                            <div>
                              <div className="font-semibold text-slate-900">{voter.fullName}</div>
                              <div className="mt-0.5 font-mono text-[12px] text-slate-500">{voter.nim}</div>
                            </div>
                          </div>
                        </DataTableCell>
                        <DataTableCell className="font-mono text-[13px] text-slate-600 break-all">{voter.email}</DataTableCell>
                        <DataTableCell>
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                            {voter.prodi}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${voter.walletAddress ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {voter.walletAddress ? 'Sudah ada address wallet' : 'Belum ada address wallet'}
                          </span>
                        </DataTableCell>
                        <DataTableCell className="text-center" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              aria-label={`Lihat / edit detail ${voter.fullName}`}
                              title="Lihat / edit detail"
                              onClick={(event) => {
                                event.stopPropagation()
                                router.push(`/superadmin/data-voter/${voter.id}`)
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </div>
                        </DataTableCell>
                      </DataTableRow>
                    ))
                  ) : (
                    <DataTableEmpty
                      colSpan={6}
                      title="Data Master Voter kosong"
                      description={searchTerm ? 'Tidak ada hasil pencarian yang cocok.' : 'Silakan gunakan tombol Impor Data Master via CSV di atas untuk memuat data dari database.'}
                    />
                  )}
                </DataTableBody>
              </DataTable>
            </DataTableViewport>
            {selectedVoters.length > 0 && !selectionBarDismissed ? (
              <FloatingSelectionBar>
                <SelectedCounter
                  compact
                  className="pointer-events-auto w-fit max-w-[calc(100%-32px)] overflow-x-auto border-slate-300 shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
                  title={`${selectedVoters.length} voter dipilih`}
                  hideLeadingIcon
                  hideClearButton
                  onClear={() => setSelectedVoterIds([])}
                  onDismiss={() => setSelectionBarDismissed(true)}
                  actions={(
                    <>
                      <button
                        type="button"
                        onClick={() => handleSendActivationEmails(selectedVoters)}
                        disabled={sendVoterActivationEmailsMutation.isPending}
                        className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sendVoterActivationEmailsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        {sendVoterActivationEmailsMutation.isPending ? 'Mengirim...' : 'Kirim Email Aktivasi'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSelectedDialogOpen(true)}
                        className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-200 bg-white px-3.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus Terpilih
                      </button>
                    </>
                  )}
                />
              </FloatingSelectionBar>
            ) : null}
            <DataTableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredVoters.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              label="data voter"
            />
          </DataTableShell>
        </StaggerContainer>
      ) : (
        <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 space-y-6">
          <AppSectionCard>
            <SuperadminSectionHeading
              title="Identitas Mahasiswa Baru"
              description="Tambahkan data mahasiswa secara manual ke daftar master voter platform. Data ini harus diverifikasi sesuai database kampus."
            />

            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <label className="block">
                <SuperadminFieldLabel required>NPM (Nomor Pokok Mahasiswa)</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.nim}
                  onChange={(event) => handleNpmChange(event.target.value)}
                  placeholder="Cth: 2207116630"
                  maxLength={10}
                />
              </label>

              <label className="block">
                <SuperadminFieldLabel required>Nama Lengkap</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Cth: Alexander Graham"
                  maxLength={100}
                />
              </label>

              <label className="block">
                <SuperadminFieldLabel required>Email Institusi (@students.uajy.ac.id)</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@students.uajy.ac.id"
                  maxLength={254}
                />
              </label>

              <label className="block">
                <SuperadminFieldLabel required>Program Studi</SuperadminFieldLabel>
                <SuperadminSelectInput
                  value={formData.faculty}
                  onChange={(event) => setFormData((current) => ({ ...current, faculty: event.target.value }))}
                >
                  <option value="" disabled>Pilih Program Studi</option>
                  {PRODI_OPTIONS.map(prodi => (
                    <option key={prodi} value={prodi}>{prodi}</option>
                  ))}
                </SuperadminSelectInput>
              </label>
            </div>
          </AppSectionCard>

          <section className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => updateTab('daftar')}
              className="inline-flex h-12 items-center justify-center rounded-2xl px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-100"
            >
              Batal
            </button>
            <SuperadminToolbarButton
              variant="primary"
              onClick={handleCreateManualVoter}
              disabled={addVoterMutation.isPending}
            >
              {addVoterMutation.isPending ? 'Menyimpan...' : 'Tambah ke Data Master'}
            </SuperadminToolbarButton>
          </section>
        </StaggerContainer>
      )}

      {showCsvModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <ScrollReveal variant="zoom-in" duration={400} className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-y-auto rounded-[32px] border border-slate-100 bg-white p-8">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="flex items-center gap-2 text-[20px] font-semibold text-slate-900">
                <FileText className="h-5 w-5 text-slate-600" />
                Impor Data Master Voter Platform
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6 flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[14px] font-semibold text-slate-900">Butuh format yang sesuai?</p>
                <p className="mt-1 text-[13px] leading-6 text-slate-600">Unduh template CSV agar urutan kolom sesuai validasi impor.</p>
                <p className="mt-1 text-[12px] text-slate-500">Header wajib: nim, nama, email, fakultas</p>
              </div>
              <a
                href="/template-data-master-voter.csv"
                download="template-data-master-voter.csv"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                Download Template CSV
              </a>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-[24px] border-2 border-dashed p-8 text-center transition-all ${
                isDragging ? 'border-slate-900 bg-slate-100' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Upload className="h-6 w-6" />
                </div>
                {csvFile ? (
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">{csvFile.name}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{(csvFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">Seret berkas CSV ke sini, atau klik untuk memilih</p>
                    <p className="mt-2 text-[13px] text-slate-500">Hanya berkas .csv yang didukung</p>
                  </div>
                )}
              </div>
            </div>

            {!csvFile ? (
              <div className="mt-6 rounded-[20px] border border-slate-100 bg-slate-50 p-4 text-[13px] leading-6 text-slate-600">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-800">Format Kolom CSV:</span>
                <p>Kolom 1: <strong>NIM</strong> (8-10 digit numerik)</p>
                <p>Kolom 2: <strong>Nama Lengkap</strong></p>
                <p>Kolom 3: <strong>Email Resmi</strong> (cth: name@students.uajy.ac.id)</p>
                <p>Kolom 4: <strong>Program Studi</strong> (cth: Informatika)</p>
              </div>
            ) : null}

            {csvErrors.length > 0 ? (
              <div className="mt-6 max-h-[160px] overflow-y-auto rounded-[20px] border border-red-100 bg-red-50 p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  Ditemukan beberapa kesalahan format:
                </h4>
                <ul className="list-disc space-y-1 pl-5 text-[12px] text-red-700">
                  {csvErrors.map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {parsedRows.length > 0 && csvErrors.length === 0 ? (
              <div className="mt-6">
                <h4 className="mb-3 flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Pratinjau Data ({parsedRows.length} baris tervalidasi):
                </h4>
                <div className="max-h-[160px] overflow-y-auto rounded-2xl border border-slate-100">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead className="bg-slate-50 text-[10px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">NIM</th>
                        <th className="px-3 py-2">Nama</th>
                        <th className="px-3 py-2">Prodi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 5).map((row, index) => (
                        <tr key={`${row.nim}-${index}`} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-mono">{row.nim}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{row.full_name}</td>
                          <td className="px-3 py-2 text-slate-500">{row.prodi}</td>
                        </tr>
                      ))}
                      {parsedRows.length > 5 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-center italic text-slate-400">
                            ...dan {parsedRows.length - 5} baris data lainnya
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-6 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={parsedRows.length === 0 || csvErrors.length > 0 || bulkInsertMutation.isPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-semibold text-white transition hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400"
              >
                {bulkInsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {bulkInsertMutation.isPending ? 'Mengimpor...' : 'Impor Sekarang'}
              </button>
            </div>
          </ScrollReveal>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteSelectedDialogOpen}
        title="Hapus voter terpilih?"
        description={`Tindakan ini akan menghapus ${selectedVoters.length} data voter dari database master.`}
        confirmLabel={bulkDeleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
        cancelLabel="Batal"
        tone="danger"
        onConfirm={handleBulkDeleteSelected}
        onCancel={() => setDeleteSelectedDialogOpen(false)}
      />
    </SuperadminShell>
  )
}
