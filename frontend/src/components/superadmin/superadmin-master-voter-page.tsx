'use client'

import { AlertTriangle, Check, ChevronLeft, ChevronRight, Database, Download, FileText, Loader2, Mail, Search, Trash2, Upload, Users, X, ChevronsUpDown, UserPlus } from 'lucide-react'
import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { SuperadminSectionCard, SuperadminShell, SuperadminAvatar, SuperadminTabButton, SuperadminSectionHeading, SuperadminTextInput, SuperadminFieldLabel, SuperadminToolbarButton } from '@/components/superadmin/superadmin-shell'
import { SuperadminOnboardingTour } from '@/components/superadmin/onboarding-tour'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableCount,
  DataTableEmpty,
  DataTableFooter,
  DataTableHead,
  DataTableHeaderCell,
  DataTableHeaderRow,
  DataTableRow,
  DataTableShell,
  DataTableToolbar,
  DataTableViewport,
  RowActionMenu,
  SelectedCounter,
} from '@/components/ui/data-table'
import { useToast } from '@/components/ui/toast-provider'
import { useSendVoterActivationEmails } from '@/hooks/use-voter-activation'
import { type SuperadminMasterVoter, useSuperadminMasterVotersStore } from '@/lib/superadmin-store'

const MASTER_VOTER_CSV_HEADERS = ['nim', 'nama', 'email', 'fakultas'] as const
const PAGE_SIZE_OPTIONS = [5, 10, 20] as const

type TabKey = 'daftar' | 'tambah'

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

export function SuperadminMasterVoterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { voters, setVoters } = useSuperadminMasterVotersStore()
  const sendVoterActivationEmailsMutation = useSendVoterActivationEmails()

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
  const [parsedVoters, setParsedVoters] = useState<SuperadminMasterVoter[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedVoterNims, setSelectedVoterNims] = useState<string[]>([])
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

  const filteredVoters = voters.filter((voter) => {
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch = (
      voter.nim.includes(term) ||
      voter.name.toLowerCase().includes(term) ||
      voter.email.toLowerCase().includes(term) ||
      voter.faculty.toLowerCase().includes(term)
    )

    const matchesFilter = activeFilter === 'semua'
      ? true
      : activeFilter === 'belum-sinkron'
        ? voter.syncStatus === 'Belum Sinkron'
        : activeFilter === 'tersinkronisasi'
          ? voter.syncStatus === 'Tersinkronisasi'
          : selectedVoterNims.includes(voter.nim)

    return matchesSearch && matchesFilter
  })

  const selectedVoters = useMemo(
    () => voters.filter((voter) => selectedVoterNims.includes(voter.nim)),
    [selectedVoterNims, voters],
  )

  const selectedFilteredCount = filteredVoters.filter((voter) => selectedVoterNims.includes(voter.nim)).length
  const totalPages = Math.max(1, Math.ceil(filteredVoters.length / pageSize))
  const paginatedVoters = filteredVoters.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const allFilteredSelected = filteredVoters.length > 0 && filteredVoters.every((voter) => selectedVoterNims.includes(voter.nim))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeFilter, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedVoterNims((current) => current.filter((nim) => !filteredVoters.some((voter) => voter.nim === nim)))
      return
    }

    setSelectedVoterNims((current) => Array.from(new Set([...current, ...filteredVoters.map((voter) => voter.nim)])))
  }

  const toggleSelectedVoter = (nim: string) => {
    setSelectedVoterNims((current) => current.includes(nim)
      ? current.filter((item) => item !== nim)
      : [...current, nim])
  }

  const handleSyncToContract = () => {
    const unsyncedCount = voters.filter((voter) => voter.syncStatus === 'Belum Sinkron').length

    if (unsyncedCount === 0) {
      showToast({
        tone: 'info',
        title: 'Semua data sinkron',
        description: 'Seluruh data master voter sudah tersinkronisasi ke smart contract.',
      })
      return
    }

    setIsSyncing(true)
    setTimeout(() => {
      setVoters(voters.map((voter) => ({ ...voter, syncStatus: 'Tersinkronisasi' })))
      setIsSyncing(false)
      showToast({
        tone: 'success',
        title: 'Sinkronisasi berhasil',
        description: `Merkle root baru di-anchor pada Base Sepolia Testnet untuk ${unsyncedCount} data voter baru.`,
      })
    }, 1500)
  }

  const handleTemplateDownload = () => {
    showToast({
      tone: 'success',
      title: 'Template CSV diunduh',
      description: 'Gunakan template ini agar format impor sesuai dengan kolom yang diterima sistem.',
    })
  }

  const handleBulkSyncSelected = () => {
    if (selectedVoters.length === 0) {
      showToast({ tone: 'info', title: 'Belum ada voter dipilih', description: 'Pilih voter terlebih dahulu untuk sinkronisasi massal.' })
      return
    }

    const unsyncedSelected = selectedVoters.filter((voter) => voter.syncStatus === 'Belum Sinkron')
    if (unsyncedSelected.length === 0) {
      showToast({ tone: 'info', title: 'Data terpilih sudah sinkron', description: 'Tidak ada voter terpilih yang perlu disinkronkan.' })
      return
    }

    setIsSyncing(true)
    setTimeout(() => {
      const selectedSet = new Set(unsyncedSelected.map((voter) => voter.nim))
      setVoters((current) => current.map((voter) => selectedSet.has(voter.nim)
        ? { ...voter, syncStatus: 'Tersinkronisasi' }
        : voter))
      setIsSyncing(false)
      showToast({
        tone: 'success',
        title: 'Sinkronisasi voter terpilih berhasil',
        description: `${unsyncedSelected.length} voter terpilih telah ditandai tersinkronisasi ke smart contract.`,
      })
    }, 1200)
  }

  const handleBulkSendActivationEmails = () => {
    if (selectedVoters.length === 0) {
      showToast({ tone: 'info', title: 'Belum ada voter dipilih', description: 'Pilih voter terlebih dahulu untuk mengirim email aktivasi.' })
      return
    }

    sendVoterActivationEmailsMutation.mutate(
      {
        recipients: selectedVoters.map((voter) => ({
          email: voter.email,
          name: voter.name,
          nim: voter.nim,
        })),
      },
      {
        onSuccess: (result) => {
          showToast({
            tone: result.failedCount === 0 ? 'success' : 'info',
            title: 'Email aktivasi voter diproses',
            description: result.failedCount === 0
              ? `${result.sentCount} email aktivasi voter berhasil dikirim.`
              : `${result.sentCount} berhasil, ${result.failedCount} gagal. Periksa email voter yang belum valid atau konfigurasi SMTP.`,
          })
        },
        onError: (error) => {
          showToast({ tone: 'error', title: 'Gagal mengirim email aktivasi voter', description: error.message })
        },
      },
    )
  }

  const handleBulkDeleteSelected = () => {
    if (selectedVoters.length === 0) {
      showToast({ tone: 'info', title: 'Belum ada voter dipilih', description: 'Pilih voter yang ingin dihapus dari data master.' })
      return
    }

    const selectedSet = new Set(selectedVoterNims)
    setVoters((current) => current.filter((voter) => !selectedSet.has(voter.nim)))
    setSelectedVoterNims([])
    setDeleteSelectedDialogOpen(false)
    showToast({ tone: 'success', title: 'Voter terpilih dihapus', description: `${selectedSet.size} data voter berhasil dihapus dari daftar master.` })
  }

  const handleRowSendActivationEmail = (voter: SuperadminMasterVoter) => {
    sendVoterActivationEmailsMutation.mutate(
      { recipients: [{ email: voter.email, name: voter.name, nim: voter.nim }] },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Email aktivasi dikirim', description: `Link aktivasi voter berhasil dikirim ke ${voter.email}.` })
        },
        onError: (error) => {
          showToast({ tone: 'error', title: 'Gagal mengirim email', description: error.message })
        },
      },
    )
  }

  const handleRowSync = (nim: string) => {
    setVoters((current) => current.map((voter) => voter.nim === nim ? { ...voter, syncStatus: 'Tersinkronisasi' } : voter))
    showToast({ tone: 'success', title: 'Voter disinkronkan', description: `Data voter ${nim} ditandai sudah tersinkronisasi.` })
  }

  const handleCreateManualVoter = () => {
    const { nim, name, email, faculty } = formData

    if (!nim.trim() || !name.trim() || !email.trim() || !faculty.trim()) {
      showToast({ tone: 'error', title: 'Data belum lengkap', description: 'Lengkapi semua kolom formulir.' })
      return
    }

    if (!/^\d{10}$/.test(nim)) {
      showToast({ tone: 'error', title: 'NIM tidak valid', description: 'NIM harus berupa 10 digit angka.' })
      return
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      showToast({ tone: 'error', title: 'Nama tidak valid', description: 'Nama hanya boleh berisi huruf dan spasi.' })
      return
    }

    if (!/^[a-zA-Z0-9._%+-]+@(students\.uajy\.ac\.id|uajy\.ac\.id)$/.test(email)) {
      showToast({ tone: 'error', title: 'Email tidak valid', description: 'Gunakan email resmi institusi UAJY.' })
      return
    }

    if (voters.some((v) => v.nim === nim)) {
      showToast({ tone: 'error', title: 'NIM sudah ada', description: 'Mahasiswa dengan NIM ini sudah terdaftar.' })
      return
    }

    const newVoter: SuperadminMasterVoter = {
      nim,
      name,
      email,
      faculty,
      syncStatus: 'Belum Sinkron',
    }

    setVoters([newVoter, ...voters])
    setFormData(initialFormData)
    showToast({ tone: 'success', title: 'Mahasiswa ditambahkan', description: `${name} berhasil ditambahkan ke data master.` })
    updateTab('daftar')
  }

  const handleCSVParsing = (text: string) => {
    const lines = text.split(/\r?\n/)
    const tempVoters: SuperadminMasterVoter[] = []
    const tempErrors: string[] = []

    const firstNonEmptyLine = lines.find((line) => line.trim())
    if (firstNonEmptyLine) {
      const headerColumns = firstNonEmptyLine.split(',').map((col) => col.trim().replace(/^["']|["']$/g, '').toLowerCase())
      const hasHeader = MASTER_VOTER_CSV_HEADERS.some((header, index) => headerColumns[index] === header)

      if (hasHeader) {
        const isHeaderValid = MASTER_VOTER_CSV_HEADERS.every((header, index) => headerColumns[index] === header)
        if (!isHeaderValid) {
          setCsvErrors([
            `Header CSV tidak sesuai template. Gunakan urutan kolom: ${MASTER_VOTER_CSV_HEADERS.join(', ')}.`,
          ])
          setParsedVoters([])
          return
        }
      }
    }

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim()
      if (!line) continue

      const cols = line.split(',').map((col) => col.trim().replace(/^["']|["']$/g, ''))

      if (cols.length < 4) {
        if (i === 0 && (cols[0].toLowerCase().includes('nim') || cols[0].toLowerCase().includes('nama'))) {
          continue
        }

        tempErrors.push(`Baris ${i + 1}: Data kolom tidak lengkap (harus NIM, Nama, Email, Fakultas).`)
        continue
      }

      const [nim, name, email, faculty] = cols

      if (i === 0 && (nim.toLowerCase() === 'nim' || name.toLowerCase() === 'nama' || email.toLowerCase() === 'email')) {
        continue
      }

      if (!/^\d{10}$/.test(nim)) {
        tempErrors.push(`Baris ${i + 1}: NIM "${nim}" tidak valid (harus tepat 10 digit angka numerik).`)
        continue
      }

      if (!/^[a-zA-Z\s]+$/.test(name)) {
        tempErrors.push(`Baris ${i + 1}: Nama "${name}" tidak valid (hanya boleh berisi huruf alfabet dan spasi).`)
        continue
      }

      if (!/^[a-zA-Z0-9._%+-]+@(students\.uajy\.ac\.id|uajy\.ac\.id)$/.test(email)) {
        tempErrors.push(`Baris ${i + 1}: Email "${email}" tidak valid (harus email resmi kampus @students.uajy.ac.id atau @uajy.ac.id).`)
        continue
      }

      if (!faculty) {
        tempErrors.push(`Baris ${i + 1}: Fakultas wajib diisi.`)
        continue
      }

      const isNimDuplicate = voters.some((voter) => voter.nim === nim) || tempVoters.some((voter) => voter.nim === nim)
      if (isNimDuplicate) {
        tempErrors.push(`Baris ${i + 1}: NIM "${nim}" sudah terdaftar dalam sistem.`)
        continue
      }

      tempVoters.push({
        nim,
        name,
        email,
        faculty,
        syncStatus: 'Belum Sinkron',
      })
    }

    setCsvErrors(tempErrors)
    setParsedVoters(tempVoters)
  }

  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext !== 'csv') {
      setCsvErrors(['Format file tidak didukung. Harap unggah berkas berekstensi .csv'])
      setCsvFile(null)
      setParsedVoters([])
      return
    }

    setCsvFile(file)
    setCsvErrors([])

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      handleCSVParsing(text)
    }
    reader.onerror = () => {
      setCsvErrors(['Gagal membaca file. Silakan coba lagi.'])
    }
    reader.readAsText(file)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    processFile(files[0])
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const closeModal = () => {
    setShowCsvModal(false)
    setCsvFile(null)
    setCsvErrors([])
    setParsedVoters([])
  }

  const handleImportSubmit = () => {
    if (parsedVoters.length === 0) return

    setVoters((current) => [...parsedVoters, ...current])
    showToast({
      tone: 'success',
      title: 'Data berhasil diimpor',
      description: `${parsedVoters.length} mahasiswa berhasil ditambahkan ke Data Master Voter Platform.`,
    })
    closeModal()
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
              Kelola daftar induk voter platform, impor data kampus melalui CSV, dan sinkronisasikan pembaruan ke smart contract.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {activeTab === 'daftar' && (
              <SuperadminToolbarButton variant="primary" onClick={() => updateTab('tambah')}>
                <UserPlus className="h-4 w-4" />
                Tambah Manual
              </SuperadminToolbarButton>
            )}
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
                  {voters.length} Mahasiswa
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {activeTab === 'daftar' ? (
        <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-slate-900 px-6 text-[15px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" />
              Impor Data Master via CSV
            </button>
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncToContract}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-emerald-600 px-6 text-[15px] font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-300"
            >
              <Database className="h-4 w-4" />
              {isSyncing ? 'Sinkronisasi...' : 'Sinkronisasikan ke Smart Contract'}
            </button>
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

          {selectedVoters.length > 0 ? (
            <SelectedCounter
              title={`${selectedVoters.length} voter dipilih`}
              description={`${selectedFilteredCount} dari ${filteredVoters.length} voter hasil filter sedang dipilih. Total data master: ${voters.length}.`}
              onClear={() => setSelectedVoterNims([])}
              actions={(
                <>
                <button
                  type="button"
                  onClick={handleBulkSendActivationEmails}
                  disabled={sendVoterActivationEmailsMutation.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50"
                >
                  {sendVoterActivationEmailsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Kirim Email Aktivasi
                </button>
                <button
                  type="button"
                  onClick={handleBulkSyncSelected}
                  disabled={isSyncing}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-[13px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                  Sinkronkan Terpilih
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteSelectedDialogOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus Terpilih
                </button>
                </>
              )}
            />
          ) : null}

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
                      <div className="flex items-center gap-1.5 uppercase tracking-[0.08em] text-slate-400">
                        NIM / Identitas
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                      </div>
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <div className="flex items-center gap-1.5 uppercase tracking-[0.08em] text-slate-400">
                        Nama Lengkap
                        <ChevronsUpDown className="h-3.5 w-3.5" />
                      </div>
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <div className="flex items-center gap-1.5 uppercase tracking-[0.08em] text-slate-400">
                        Email Institusi
                      </div>
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <div className="flex items-center gap-1.5 uppercase tracking-[0.08em] text-slate-400">
                        Status Sinkronisasi
                      </div>
                    </DataTableHeaderCell>
                    <DataTableHeaderCell className="text-center uppercase tracking-[0.08em] text-slate-400">Aksi</DataTableHeaderCell>
                  </DataTableHeaderRow>
                </DataTableHead>
                <DataTableBody className="bg-transparent">
                  {paginatedVoters.length > 0 ? (
                    paginatedVoters.map((voter) => (
                      <DataTableRow 
                        key={voter.nim}
                        className="[&>td]:border-y [&>td]:border-slate-200 [&>td]:bg-white [&>td:first-child]:rounded-l-[20px] [&>td:first-child]:border-l [&>td:last-child]:rounded-r-[20px] [&>td:last-child]:border-r hover:[&>td]:border-slate-300 hover:[&>td]:bg-slate-50/80"
                      >
                        <DataTableCell className="w-[56px]">
                          <input
                            type="checkbox"
                            checked={selectedVoterNims.includes(voter.nim)}
                            onChange={() => toggleSelectedVoter(voter.nim)}
                            aria-label={`Pilih voter ${voter.name}`}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <div className="font-mono text-[14px] font-medium text-slate-900">{voter.nim}</div>
                          <div className="mt-0.5 text-[12px] text-slate-500">{voter.faculty}</div>
                        </DataTableCell>
                        <DataTableCell>
                          <div className="flex items-center gap-4">
                            <SuperadminAvatar initials={getInitials(voter.name)} />
                            <div>
                              <div className="font-semibold text-slate-900">{voter.name}</div>
                              <div className="mt-0.5 text-[12px] text-slate-500">Mahasiswa Aktif</div>
                            </div>
                          </div>
                        </DataTableCell>
                        <DataTableCell className="font-mono text-[13px] text-slate-600">{voter.email}</DataTableCell>
                        <DataTableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                              voter.syncStatus === 'Tersinkronisasi'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {voter.syncStatus === 'Tersinkronisasi' ? (
                              <>
                                <Check className="h-3 w-3" />
                                Tersinkronisasi
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-3 w-3" />
                                Belum Sinkron
                              </>
                            )}
                          </span>
                        </DataTableCell>
                        <DataTableCell className="text-center">
                          <RowActionMenu
                            buttonLabel={`Aksi untuk ${voter.name}`}
                            items={[
                              { label: 'Kirim Email Aktivasi', onClick: () => handleRowSendActivationEmail(voter) },
                              { label: 'Sinkronkan Voter', onClick: () => handleRowSync(voter.nim) },
                              { label: 'Pilih Data Ini', onClick: () => toggleSelectedVoter(voter.nim) },
                            ]}
                          />
                        </DataTableCell>
                      </DataTableRow>
                    ))
                  ) : (
                    <DataTableEmpty
                      colSpan={6}
                      title="Data Master Voter kosong"
                      description={searchTerm ? 'Tidak ada hasil pencarian yang cocok.' : 'Silakan gunakan tombol Impor Data Master via CSV di atas untuk memuat data.'}
                    />
                  )}
                </DataTableBody>
              </DataTable>
            </DataTableViewport>
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
                <SuperadminFieldLabel>NIM (Nomor Induk Mahasiswa)</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.nim}
                  onChange={(event) => setFormData((current) => ({ ...current, nim: event.target.value }))}
                  placeholder="Cth: 2207116630"
                />
              </label>

              <label className="block">
                <SuperadminFieldLabel>Nama Lengkap</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Cth: Alexander Graham"
                />
              </label>

              <label className="block">
                <SuperadminFieldLabel>Email Institusi (@students.uajy.ac.id)</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="name@students.uajy.ac.id"
                />
              </label>

              <label className="block">
                <SuperadminFieldLabel>Fakultas / Program Studi</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.faculty}
                  onChange={(event) => setFormData((current) => ({ ...current, faculty: event.target.value }))}
                  placeholder="Cth: Informatika"
                />
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
              <SuperadminToolbarButton variant="primary" onClick={handleCreateManualVoter}>
                Tambah ke Data Master
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
                <p className="mt-1 text-[13px] leading-6 text-slate-600">Unduh template CSV agar urutan kolom dan contoh isinya sesuai dengan validasi impor sistem.</p>
                <p className="mt-1 text-[12px] text-slate-500">Header wajib: nim, nama, email, fakultas</p>
              </div>
              <a
                href="/template-data-master-voter.csv"
                download="template-data-master-voter.csv"
                onClick={handleTemplateDownload}
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
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
                <p>Kolom 1: <strong>NIM</strong> (10 digit numerik, cth: 2207116630)</p>
                <p>Kolom 2: <strong>Nama Lengkap</strong> (hanya huruf alfabet & spasi)</p>
                <p>Kolom 3: <strong>Email Resmi</strong> (cth: name@students.uajy.ac.id)</p>
                <p>Kolom 4: <strong>Fakultas / Prodi</strong> (cth: Informatika)</p>
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

            {parsedVoters.length > 0 && csvErrors.length === 0 ? (
              <div className="mt-6">
                <h4 className="mb-3 flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Pratinjau Data ({parsedVoters.length} baris tervalidasi):
                </h4>
                <div className="max-h-[160px] overflow-y-auto rounded-2xl border border-slate-100">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead className="bg-slate-50 text-[10px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">NIM</th>
                        <th className="px-3 py-2">Nama</th>
                        <th className="px-3 py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedVoters.slice(0, 5).map((voter, index) => (
                        <tr key={`${voter.nim}-${index}`} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-mono">{voter.nim}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{voter.name}</td>
                          <td className="px-3 py-2 font-mono text-slate-500">{voter.email}</td>
                        </tr>
                      ))}
                      {parsedVoters.length > 5 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-center italic text-slate-400">
                            ...dan {parsedVoters.length - 5} baris data lainnya
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
                disabled={parsedVoters.length === 0 || csvErrors.length > 0}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-semibold text-white transition hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Check className="h-4 w-4" />
                Impor Sekarang
              </button>
            </div>
          </ScrollReveal>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteSelectedDialogOpen}
        title="Hapus voter terpilih?"
        description={`Tindakan ini akan menghapus ${selectedVoters.length} data voter dari daftar master platform.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={handleBulkDeleteSelected}
        onCancel={() => setDeleteSelectedDialogOpen(false)}
      />
    </SuperadminShell>
  )
}
