'use client'

import { ChevronLeft, ChevronRight, Copy, Loader2, Mail, Power, Search, UserPlus, ShieldAlert, CheckCircle2, Clock3, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import {
  SuperadminFieldLabel,
  SuperadminAvatar,
  SuperadminEmptyState,
  SuperadminShell,
  SuperadminStatusBadge,
  SuperadminTabButton,
  SuperadminTableRowLink,
  SuperadminTextInput,
  SuperadminToolbarButton,
  SuperadminSectionHeading,
} from '@/components/superadmin/superadmin-shell'
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
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listAdminDirectory, updateDirectoryRegistryStatus } from '@/lib/repositories/profileRepository'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { useCreateAdminInvite, useResendAdminInvite } from '@/hooks/use-admin-invite'
import { useCurrentProfile } from '@/hooks/use-profile'

type TabKey = 'daftar' | 'tambah'

type SortField = 'name' | 'email' | 'wallet' | 'status'
type SortDirection = 'asc' | 'desc' | null

const initialFormData = {
  name: '',
  email: '',
  walletAddress: '',
}

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SA'
}

function SuperadminManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('daftar')
  const [searchTerm, setSearchTerm] = useState('')
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState(initialFormData)
  const [activationLink, setActivationLink] = useState('')
  const [lastEmailStatus, setLastEmailStatus] = useState<'sent' | 'skipped' | 'failed' | null>(null)
  const [lastEmailError, setLastEmailError] = useState<string | null>(null)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState<'send' | 'deactivate' | null>(null)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [bulkDeactivateDialogOpen, setBulkDeactivateDialogOpen] = useState(false)
  const createAdminInviteMutation = useCreateAdminInvite()
  const resendInviteMutation = useResendAdminInvite()
  const currentProfileQuery = useCurrentProfile()

  const { data: superadmins = [], isLoading, error } = useQuery({
    queryKey: ['superadmins'],
    queryFn: async () => {
      const directory = await listAdminDirectory()
      return directory.filter((admin) => admin.role === 'super_admin')
    },
  })

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
    router.replace(`/superadmin/manajemen-superadmin?${params.toString()}`)
  }

  const selectedSuperadmins = useMemo(
    () => superadmins.filter((admin) => selectedEmails.includes(admin.email)),
    [selectedEmails, superadmins],
  )

  const filteredSuperadmins = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const filtered = superadmins.filter((admin) => {
      if (!normalizedSearch) return true
      return (admin.displayName ?? 'super admin').toLowerCase().includes(normalizedSearch)
        || admin.email.toLowerCase().includes(normalizedSearch)
        || (admin.walletAddress ?? admin.profile?.walletAddress ?? 'belum ditautkan').toLowerCase().includes(normalizedSearch)
    })

    if (!sortField || !sortDirection) return filtered

    return [...filtered].sort((a, b) => {
      let aVal = ''
      let bVal = ''
      if (sortField === 'name') {
        aVal = (a.displayName ?? 'super admin').toLowerCase()
        bVal = (b.displayName ?? 'super admin').toLowerCase()
      } else if (sortField === 'email') {
        aVal = a.email.toLowerCase()
        bVal = b.email.toLowerCase()
      } else if (sortField === 'wallet') {
        aVal = (a.walletAddress ?? a.profile?.walletAddress ?? '').toLowerCase()
        bVal = (b.walletAddress ?? b.profile?.walletAddress ?? '').toLowerCase()
      } else if (sortField === 'status') {
        const aActive = Boolean(a.profile) || a.registryStatus === 'active'
        const bActive = Boolean(b.profile) || b.registryStatus === 'active'
        aVal = aActive ? 'aktif' : 'menunggu'
        bVal = bActive ? 'aktif' : 'menunggu'
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [searchTerm, superadmins, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field)
      setSortDirection('asc')
    } else if (sortDirection === 'asc') {
      setSortDirection('desc')
    } else if (sortDirection === 'desc') {
      setSortField(null)
      setSortDirection(null)
    } else {
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field || !sortDirection) return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
    if (sortDirection === 'asc') return <ChevronUp className="h-3.5 w-3.5 text-slate-700" />
    return <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
  }

  const selectedFilteredCount = filteredSuperadmins.filter((admin) => selectedEmails.includes(admin.email)).length
  const totalPages = Math.max(1, Math.ceil(filteredSuperadmins.length / pageSize))
  const paginatedSuperadmins = filteredSuperadmins.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const allSelected = filteredSuperadmins.length > 0 && filteredSuperadmins.every((admin) => selectedEmails.includes(admin.email))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedEmails((current) => current.filter((email) => !filteredSuperadmins.some((admin) => admin.email === email)))
      return
    }

    setSelectedEmails((current) => Array.from(new Set([...current, ...filteredSuperadmins.map((admin) => admin.email)])))
  }

  const toggleSelected = (email: string) => {
    setSelectedEmails((current) => current.includes(email)
      ? current.filter((item) => item !== email)
      : [...current, email])
  }

  const handleBulkSendActivation = async () => {
    if (selectedSuperadmins.length === 0) {
      showToast({ tone: 'info', title: 'Belum ada superadmin dipilih', description: 'Pilih superadmin yang ingin dikirimi email aktivasi.' })
      return
    }

    const pendingItems = selectedSuperadmins.filter((admin) => !(Boolean(admin.profile) || admin.registryStatus === 'active'))
    if (pendingItems.length === 0) {
      showToast({ tone: 'info', title: 'Tidak ada superadmin menunggu aktivasi', description: 'Email aktivasi hanya dikirim ke akun yang masih menunggu aktivasi.' })
      return
    }

    setBulkActionLoading('send')
    const results = await Promise.allSettled(pendingItems.map((admin) => resendInviteMutation.mutateAsync(admin.email)))
    const successCount = results.filter((result) => result.status === 'fulfilled' && result.value.emailStatus === 'sent').length
    const failedCount = results.length - successCount
    setBulkActionLoading(null)

    showToast({
      tone: failedCount === 0 ? 'success' : 'info',
      title: 'Bulk email superadmin diproses',
      description: failedCount === 0
        ? `${successCount} email aktivasi superadmin berhasil dikirim.`
        : `${successCount} berhasil, ${failedCount} gagal. Periksa email tujuan atau SMTP.`,
    })
  }

  const handleBulkDeactivate = async () => {
    const currentEmail = currentProfileQuery.data?.email?.trim().toLowerCase() ?? ''
    const candidates = selectedSuperadmins.filter((admin) => admin.email.toLowerCase() !== currentEmail && (Boolean(admin.profile) || admin.registryStatus !== 'inactive'))

    if (candidates.length === 0) {
      showToast({ tone: 'info', title: 'Tidak ada superadmin yang bisa dinonaktifkan', description: 'Akun milik Anda sendiri tidak akan ikut dinonaktifkan.' })
      setBulkDeactivateDialogOpen(false)
      return
    }

    setBulkActionLoading('deactivate')
    const results = await Promise.allSettled(candidates.map((admin) => updateDirectoryRegistryStatus(admin.email, 'inactive')))
    const successCount = results.filter((result) => result.status === 'fulfilled').length
    const failedCount = results.length - successCount
    await queryClient.invalidateQueries({ queryKey: ['superadmins'] })
    await currentProfileQuery.refetch()
    setBulkActionLoading(null)
    setBulkDeactivateDialogOpen(false)
    setSelectedEmails([])

    showToast({
      tone: failedCount === 0 ? 'success' : 'info',
      title: 'Bulk nonaktif superadmin diproses',
      description: failedCount === 0
        ? `${successCount} superadmin berhasil dinonaktifkan.`
        : `${successCount} berhasil, ${failedCount} gagal. Coba ulang untuk sisanya.`,
    })
  }

  const handleCreateSuperAdmin = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.walletAddress.trim()) {
      showToast({ tone: 'error', title: 'Data belum lengkap', description: 'Lengkapi nama, email, dan wallet address.' })
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress)) {
      showToast({ tone: 'error', title: 'Wallet tidak valid', description: 'Gunakan alamat wallet Ethereum (0x...) yang valid.' })
      return
    }

    createAdminInviteMutation.mutate(
      {
        displayName: formData.name,
        email: formData.email,
        walletAddress: formData.walletAddress,
        role: 'super_admin',
      },
      {
        onSuccess: (invite) => {
          if (invite.activationLink) setActivationLink(invite.activationLink)
          setLastEmailStatus(invite.emailStatus ?? 'skipped')
          setLastEmailError(invite.emailError ?? null)

          const emailMsg = invite.emailStatus === 'sent'
            ? 'Email aktivasi sudah dikirim.'
            : invite.emailStatus === 'failed'
              ? `Email gagal dikirim: ${invite.emailError ?? ''}`
              : 'Link tersedia untuk disalin (email belum dikirim).'

          showToast({
            tone: invite.emailStatus === 'sent' ? 'success' : 'info',
            title: 'Undangan Aktivasi Dibuat',
            description: `${formData.name} — ${emailMsg}`,
          })
          setFormData(initialFormData)
        },
        onError: (err) => {
          showToast({ tone: 'error', title: 'Undangan Gagal Dibuat', description: getRepositoryErrorMessage(err) })
        },
      },
    )
  }

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[44px]">Manajemen Superadmin</h1>
            <p className="mt-3 text-[16px] leading-8 text-slate-800 max-w-[760px]">
              Kelola otoritas tertinggi platform. Superadmin memiliki akses penuh untuk menyetujui proposal dan melakukan tindakan darurat pada blockchain.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {activeTab === 'daftar' && (
              <SuperadminToolbarButton variant="primary" onClick={() => updateTab('tambah')}>
                <UserPlus className="h-4 w-4" />
                Tambah Superadmin
              </SuperadminToolbarButton>
            )}
          </div>
        </section>

        <div className="mt-10 flex items-end justify-between border-b border-slate-200">
          <div className="flex items-center gap-8">
            <SuperadminTabButton active={activeTab === 'daftar'} onClick={() => updateTab('daftar')}>
              Daftar Otoritas
            </SuperadminTabButton>
            <SuperadminTabButton active={activeTab === 'tambah'} onClick={() => updateTab('tambah')}>
              Tambah Baru
            </SuperadminTabButton>
          </div>
          {activeTab === 'daftar' && (
            <div className="hidden items-center gap-4 pb-3 sm:flex">
              <div className="h-4 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total Otoritas</p>
                <p className="mt-0.5 text-[16px] font-semibold text-slate-900">
                  {filteredSuperadmins.length} Akun
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {activeTab === 'daftar' ? (
        <>
          {error && (
            <div className="mt-8 rounded-2xl bg-red-50 p-4 text-red-600 text-[14px]">
              {getRepositoryErrorMessage(error)}
            </div>
          )}

          {selectedSuperadmins.length > 0 && (
            <SelectedCounter
              title={`${selectedSuperadmins.length} superadmin dipilih`}
              description={`${selectedFilteredCount} dari ${filteredSuperadmins.length} hasil pencarian sedang dipilih. Total superadmin: ${superadmins.length}.`}
              onClear={() => setSelectedEmails([])}
              actions={(
                <>
                <button
                  type="button"
                  onClick={() => { void handleBulkSendActivation() }}
                  disabled={bulkActionLoading !== null}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50"
                >
                  {bulkActionLoading === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Kirim Email Aktivasi
                </button>
                <button
                  type="button"
                  onClick={() => setBulkDeactivateDialogOpen(true)}
                  disabled={bulkActionLoading !== null}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 text-[13px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                >
                  {bulkActionLoading === 'deactivate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                  Nonaktifkan Akses
                </button>
                </>
              )}
            />
          )}

          <StaggerContainer stagger={50} variant="fade-up" duration={600} className="mt-8">
            <DataTableShell className="shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <DataTableToolbar className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <DataTableCount
                title="Daftar Otoritas Superadmin"
                description={`Menampilkan ${filteredSuperadmins.length} dari ${superadmins.length} akun.`}
              />
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari superadmin..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-black lg:w-64"
                  />
                </div>
                
                <div className="h-8 w-px bg-slate-100 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-500">Baris:</span>
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-2 text-[13px] font-semibold text-slate-900 focus:outline-none"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="h-8 w-px bg-slate-100 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col items-center min-w-[48px]">
                    <span className="text-[11px] font-bold text-slate-900 leading-none">{currentPage}</span>
                    <span className="mt-1 text-[10px] text-slate-400 leading-none">dari {totalPages}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </DataTableToolbar>
            <DataTableViewport>
              <DataTable>
                <DataTableHead>
                  <DataTableHeaderRow>
                    <DataTableHeaderCell className="w-[56px]">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Pilih semua superadmin"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <button
                        type="button"
                        onClick={() => handleSort('name')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-700 transition-colors"
                      >
                        Profil Superadmin
                        <SortIcon field="name" />
                      </button>
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <button
                        type="button"
                        onClick={() => handleSort('wallet')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-700 transition-colors"
                      >
                        Wallet Address
                        <SortIcon field="wallet" />
                      </button>
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="inline-flex items-center gap-1.5 hover:text-slate-700 transition-colors"
                      >
                        Status Otoritas
                        <SortIcon field="status" />
                      </button>
                    </DataTableHeaderCell>
                    <DataTableHeaderCell className="text-center">Aksi</DataTableHeaderCell>
                  </DataTableHeaderRow>
                </DataTableHead>
                <DataTableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <DataTableRow key={i}>
                    <DataTableCell colSpan={5}>
                      <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                    </DataTableCell>
                  </DataTableRow>
                ))
              ) : paginatedSuperadmins.length > 0 ? paginatedSuperadmins.map((admin) => {
                const isActive = Boolean(admin.profile) || admin.registryStatus === 'active'

                return (
                <DataTableRow
                  key={admin.email}
                  className="cursor-pointer"
                  onClick={() => router.push(`/superadmin/manajemen-superadmin/${encodeURIComponent(admin.email)}`)}
                >
                  <DataTableCell className="w-[56px]" onClick={(event) => { event.preventDefault(); event.stopPropagation() }}>
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(admin.email)}
                      onChange={() => toggleSelected(admin.email)}
                      aria-label={`Pilih superadmin ${admin.displayName || admin.email}`}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center gap-4">
                    <SuperadminAvatar initials={getInitials(admin.displayName || 'SA')} />
                    <div>
                      <p className="text-[16px] font-semibold text-slate-900">{admin.displayName || 'Super Admin'}</p>
                      <p className="mt-1 font-mono text-[13px] text-slate-500">{admin.email}</p>
                    </div>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <p className="font-mono text-[13px] text-slate-600 truncate">{admin.walletAddress || admin.profile?.walletAddress || 'Belum ditautkan'}</p>
                  </DataTableCell>
                  <DataTableCell>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {isActive ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                      {isActive ? 'Super Admin Aktif' : 'Menunggu Aktivasi'}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="text-center" onClick={(event) => { event.preventDefault(); event.stopPropagation() }}>
                    <RowActionMenu
                      buttonLabel={`Aksi untuk ${admin.displayName || admin.email}`}
                      items={[
                        { label: 'Lihat Detail', onClick: () => router.push(`/superadmin/manajemen-superadmin/${encodeURIComponent(admin.email)}`) },
                        ...(!isActive ? [{
                          label: 'Kirim Ulang Email Aktivasi',
                          onClick: () => {
                            resendInviteMutation.mutate(admin.email, {
                              onSuccess: (result) => {
                                showToast({
                                  tone: result.emailStatus === 'sent' ? 'success' : 'info',
                                  title: result.emailStatus === 'sent' ? 'Email Terkirim' : 'Email Gagal',
                                  description: result.emailStatus === 'sent' ? 'Link aktivasi sudah dikirim ulang.' : result.emailError ?? 'Coba lagi nanti.',
                                })
                              },
                              onError: (err) => {
                                showToast({ tone: 'error', title: 'Kirim Ulang Gagal', description: getRepositoryErrorMessage(err) })
                              },
                            })
                          },
                          disabled: resendInviteMutation.isPending,
                        }] : []),
                        { label: 'Pilih Superadmin', onClick: () => toggleSelected(admin.email) },
                      ]}
                    />
                  </DataTableCell>
                </DataTableRow>
                )
              }) : (
                <DataTableEmpty colSpan={5} title="Belum ada superadmin lain" description="Hanya akun Anda yang terdaftar sebagai otoritas tertinggi saat ini." />
              )}
                </DataTableBody>
              </DataTable>
            </DataTableViewport>
            <DataTableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSuperadmins.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              label="superadmin"
            />
            </DataTableShell>
          </StaggerContainer>
        </>
      ) : (
        <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 space-y-6">
          <AppSectionCard>
            <SuperadminSectionHeading
              title="Identitas Superadmin Baru"
              description="Superadmin baru akan membuat password sendiri melalui link aktivasi. Wallet harus sama saat validasi akses pertama."
            />

            {activationLink && (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[12px] font-semibold text-emerald-700">Link aktivasi siap digunakan</p>
                <p className="mt-2 text-[12px] leading-5 text-emerald-700">
                  {lastEmailStatus === 'sent'
                    ? 'Email aktivasi sudah dikirim ke email superadmin baru.'
                    : 'Kirimkan link ini ke email superadmin baru. Jika email tidak terkirim, salin link dan kirim manual.'}
                </p>
                {lastEmailStatus === 'failed' && (
                  <p className="mt-2 text-[12px] leading-5 text-red-600 font-semibold">
                    Email gagal dikirim: {lastEmailError ?? 'Periksa konfigurasi SMTP/Email di server.'}
                  </p>
                )}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={activationLink}
                    readOnly
                    className="h-10 min-w-0 flex-1 rounded-md border border-emerald-200 bg-white px-3 font-mono text-[12px] text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activationLink)
                      showToast({ tone: 'success', title: 'Link Disalin', description: 'Link aktivasi sudah disalin ke clipboard.' })
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                  >
                    <Copy className="h-4 w-4" />
                    Salin Link
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <label className="block">
                <SuperadminFieldLabel>Nama Lengkap</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Masukkan nama lengkap"
                />
              </label>

              <label className="block">
                <SuperadminFieldLabel>Email Institusi</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="admin.tu@uajy.ac.id"
                />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Wallet Address (On-Chain Identity)</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.walletAddress}
                  onChange={(event) => setFormData((current) => ({ ...current, walletAddress: event.target.value }))}
                  placeholder="0x..."
                />
                <p className="mt-2 text-[12px] text-slate-500 italic">
                  * Alamat ini akan digunakan untuk menandatangani transaksi blockchain penting.
                </p>
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
            <SuperadminToolbarButton variant="primary" onClick={handleCreateSuperAdmin} disabled={createAdminInviteMutation.isPending}>
              {createAdminInviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {createAdminInviteMutation.isPending ? 'Menyiapkan Undangan' : 'Kirim Undangan Otoritas'}
            </SuperadminToolbarButton>
          </section>
        </StaggerContainer>
      )}

      <ConfirmDialog
        open={bulkDeactivateDialogOpen}
        title="Nonaktifkan superadmin terpilih?"
        description="Akses superadmin terpilih akan dinonaktifkan dari registry. Akun Anda sendiri tidak akan ikut diproses."
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        tone="default"
        onConfirm={() => { void handleBulkDeactivate() }}
        onCancel={() => setBulkDeactivateDialogOpen(false)}
      />
    </SuperadminShell>
  )
}

export default function SuperadminManagementPage() {
  return (
    <Suspense fallback={
      <SuperadminShell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-black" />
        </div>
      </SuperadminShell>
    }>
      <SuperadminManagementContent />
    </Suspense>
  )
}
