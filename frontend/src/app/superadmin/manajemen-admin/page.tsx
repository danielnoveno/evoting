'use client'

import { ChevronLeft, ChevronRight, Copy, Download, EllipsisVertical, Loader2, Mail, Power, Search, Trash2, UserPlus } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast-provider'
import {
  SuperadminFieldLabel,
  SuperadminAvatar,
  SuperadminEmptyState,
  SuperadminFilterChip,
  SuperadminRadioCard,
  SuperadminSectionHeading,
  SuperadminShell,
  SuperadminStatusBadge,
  SuperadminTabButton,
  SuperadminTableRowLink,
  SuperadminTextInput,
  SuperadminToolbarButton,
} from '@/components/superadmin/superadmin-shell'
import { SuperadminOnboardingTour } from '@/components/superadmin/onboarding-tour'
import { superadminAdminStatuses, superadminAdminTabs } from '@/lib/superadmin-data'
import { useCreateAdminRegistry, useSuperadminAdminDirectory } from '@/hooks/use-profile'
import { useCreateAdminInvite } from '@/hooks/use-admin-invite'
import { AppPageHeader } from '@/components/ui/app-page-header'
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
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { resendAdminInvite } from '@/lib/repositories/adminInviteRepository'
import { deleteAdminRegistry, updateAdminRegistry } from '@/lib/repositories/profileRepository'
import { mapDirectoryAdmin } from '@/lib/superadmin-admin-mapper'
import { profileQueryKeys } from '@/hooks/use-profile'

type AdminTabKey = (typeof superadminAdminTabs)[number]['key']

type AdminScope = 'all' | 'specific'

const initialFormData = {
  name: '',
  email: '',
  organizationName: '',
  scope: 'all' as AdminScope,
  walletAddress: '',
}

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const

function SuperadminAdminManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<AdminTabKey>('daftar')
  const [activeStatus, setActiveStatus] = useState<(typeof superadminAdminStatuses)[number]>('Semua Status')
  const [searchTerm, setSearchTerm] = useState('')
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)
  const [currentPage, setCurrentPage] = useState(1)
  const adminDirectoryQuery = useSuperadminAdminDirectory()
  const createAdminMutation = useCreateAdminRegistry()
  const createAdminInviteMutation = useCreateAdminInvite()
  const [formData, setFormData] = useState(initialFormData)
  const [activationLink, setActivationLink] = useState('')
  const [selectedAdminEmails, setSelectedAdminEmails] = useState<string[]>([])
  const [selectionBarDismissed, setSelectionBarDismissed] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState<'send' | 'deactivate' | 'delete' | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeactivateDialogOpen, setBulkDeactivateDialogOpen] = useState(false)

  const admins = useMemo(() => {
    return (adminDirectoryQuery.data ?? [])
      .filter((record) => record.role === 'admin')
      .map(mapDirectoryAdmin)
  }, [adminDirectoryQuery.data])

  const filteredAdmins = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return admins.filter((admin) => {
      const matchesStatus = activeStatus === 'Semua Status' ? true : admin.status === activeStatus
      const matchesSearch = !normalizedSearch
        || admin.name.toLowerCase().includes(normalizedSearch)
        || admin.email.toLowerCase().includes(normalizedSearch)
        || admin.accessLabel.toLowerCase().includes(normalizedSearch)
        || admin.accessDetail.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [activeStatus, admins, searchTerm])

  const selectedAdmins = useMemo(
    () => admins.filter((admin) => selectedAdminEmails.includes(admin.email)),
    [admins, selectedAdminEmails],
  )

  const selectedAdminDirectoryRecords = useMemo(
    () => (adminDirectoryQuery.data ?? []).filter((record) => record.role === 'admin' && selectedAdminEmails.includes(record.email)),
    [adminDirectoryQuery.data, selectedAdminEmails],
  )

  const allFilteredSelected = filteredAdmins.length > 0 && filteredAdmins.every((admin) => selectedAdminEmails.includes(admin.email))
  const selectedFilteredCount = filteredAdmins.filter((admin) => selectedAdminEmails.includes(admin.email)).length
  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / pageSize))
  const paginatedAdmins = filteredAdmins.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    const tab = searchParams.get('tab')
    setActiveTab(tab === 'tambah' ? 'tambah' : 'daftar')
  }, [searchParams])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeStatus, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    setSelectionBarDismissed(false)
  }, [selectedAdminEmails])

  const updateTab = (tab: AdminTabKey) => {
    const params = new URLSearchParams(searchParams.toString())

    if (tab === 'tambah') {
      params.set('tab', 'tambah')
    } else {
      params.delete('tab')
    }

    const query = params.toString()
    router.replace(query ? `/superadmin/manajemen-admin?${query}` : '/superadmin/manajemen-admin')
  }

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedAdminEmails((current) => current.filter((email) => !filteredAdmins.some((admin) => admin.email === email)))
      return
    }

    setSelectedAdminEmails((current) => Array.from(new Set([...current, ...filteredAdmins.map((admin) => admin.email)])))
  }

  const toggleSelectedAdmin = (email: string) => {
    setSelectedAdminEmails((current) => current.includes(email)
      ? current.filter((item) => item !== email)
      : [...current, email])
  }

  const invalidateAdminDirectory = async () => {
    await queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
  }

  const handleBulkSendActivation = async () => {
    if (selectedAdmins.length === 0) {
      showToast({ tone: 'info', title: 'Belum ada admin dipilih', description: 'Pilih admin terlebih dahulu untuk kirim email aktivasi.' })
      return
    }

    const pendingAdmins = selectedAdmins.filter((admin) => admin.status === 'Menunggu')
    if (pendingAdmins.length === 0) {
      showToast({ tone: 'info', title: 'Tidak ada admin menunggu aktivasi', description: 'Email aktivasi hanya dikirim ke admin yang statusnya masih menunggu.' })
      return
    }

    setBulkActionLoading('send')
    const results = await Promise.allSettled(pendingAdmins.map((admin) => resendAdminInvite(admin.email)))
    const successCount = results.filter((result) => result.status === 'fulfilled' && result.value.emailStatus === 'sent').length
    const failedCount = results.length - successCount
    setBulkActionLoading(null)

    showToast({
      tone: failedCount === 0 ? 'success' : 'info',
      title: 'Bulk email aktivasi diproses',
      description: failedCount === 0
        ? `${successCount} email aktivasi admin berhasil dikirim.`
        : `${successCount} berhasil, ${failedCount} gagal. Periksa email admin atau konfigurasi SMTP.`,
    })
  }

  const handleBulkDeactivate = async () => {
    const candidates = selectedAdminDirectoryRecords.filter((record) => record.registryStatus !== 'inactive')
    if (candidates.length === 0) {
      showToast({ tone: 'info', title: 'Admin terpilih sudah nonaktif', description: 'Tidak ada admin terpilih yang perlu dinonaktifkan.' })
      setBulkDeactivateDialogOpen(false)
      return
    }

    setBulkActionLoading('deactivate')
    const results = await Promise.allSettled(candidates.map((record) => updateAdminRegistry(record.email, {
      email: record.email,
      displayName: record.displayName,
      organizationName: record.organizationName,
      accessScope: record.accessScope,
      status: 'inactive',
      description: record.description,
      walletAddress: record.walletAddress,
    })))
    const successCount = results.filter((result) => result.status === 'fulfilled').length
    const failedCount = results.length - successCount
    await invalidateAdminDirectory()
    setBulkActionLoading(null)
    setBulkDeactivateDialogOpen(false)
    setSelectedAdminEmails([])

    showToast({
      tone: failedCount === 0 ? 'success' : 'info',
      title: 'Bulk nonaktif admin diproses',
      description: failedCount === 0
        ? `${successCount} admin berhasil dinonaktifkan.`
        : `${successCount} berhasil, ${failedCount} gagal. Coba ulang pada admin yang gagal.`,
    })
  }

  const handleBulkDelete = async () => {
    if (selectedAdmins.length === 0) {
      setBulkDeleteDialogOpen(false)
      return
    }

    setBulkActionLoading('delete')
    const results = await Promise.allSettled(selectedAdmins.map((admin) => deleteAdminRegistry(admin.email)))
    const successCount = results.filter((result) => result.status === 'fulfilled').length
    const failedCount = results.length - successCount
    await invalidateAdminDirectory()
    setBulkActionLoading(null)
    setBulkDeleteDialogOpen(false)
    setSelectedAdminEmails([])

    showToast({
      tone: failedCount === 0 ? 'success' : 'info',
      title: 'Bulk hapus admin diproses',
      description: failedCount === 0
        ? `${successCount} akses admin berhasil dihapus.`
        : `${successCount} berhasil dihapus, ${failedCount} gagal.`,
    })
  }

  const handleCreateAdmin = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast({ tone: 'error', title: 'Data admin belum lengkap', description: 'Lengkapi nama dan email institusi admin terlebih dahulu.' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast({ tone: 'error', title: 'Email belum valid', description: 'Gunakan email institusi yang valid untuk admin baru.' })
      return
    }

    const hasWallet = formData.walletAddress.trim().length > 0
    if (hasWallet && !/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress)) {
      showToast({ tone: 'error', title: 'Wallet tidak valid', description: 'Gunakan alamat wallet Ethereum (0x...) yang valid jika diisi.' })
      return
    }

    // Use token activation flow with email for all admins
    createAdminInviteMutation.mutate(
      {
        displayName: formData.name,
        email: formData.email,
        walletAddress: formData.walletAddress, // this can be empty now
        organizationName: formData.organizationName,
        accessScope: formData.scope,
        role: 'admin',
      },
      {
        onSuccess: (invite) => {
          updateTab('daftar')
          setActiveStatus('Semua Status')
          if (invite.activationLink) {
            setActivationLink(invite.activationLink)
          }
          setFormData(initialFormData)

          const emailMsg = invite.emailStatus === 'sent'
            ? 'Email aktivasi sudah dikirim.'
            : invite.emailStatus === 'failed'
              ? `Email gagal: ${invite.emailError ?? ''}`
              : 'Link aktivasi tersedia untuk disalin.'

          showToast({
            tone: invite.emailStatus === 'sent' ? 'success' : 'info',
            title: 'Undangan Admin Dibuat',
            description: `${formData.name} — ${emailMsg}`,
          })
        },
        onError: (error) => {
          showToast({ tone: 'error', title: 'Gagal membuat undangan', description: getRepositoryErrorMessage(error) })
        },
      },
    )
  }

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader title="Manajemen Admin" />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={150} duration={800} className="mt-8 space-y-6">
        <div className="flex items-end justify-between border-b border-slate-200">
          <div className="flex items-center gap-8">
            {superadminAdminTabs.map((tab) => (
              <SuperadminTabButton key={tab.key} active={activeTab === tab.key} onClick={() => updateTab(tab.key)}>
                {tab.label}
              </SuperadminTabButton>
            ))}
          </div>
          {activeTab === 'daftar' && (
            <div className="hidden items-center gap-4 pb-3 sm:flex">
              <div className="h-4 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total Admin</p>
                <p className="mt-0.5 text-[16px] font-semibold text-slate-900">
                  {filteredAdmins.length} Admin
                </p>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'daftar' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <SuperadminToolbarButton onClick={() => showToast({ tone: 'info', title: 'Unduh laporan belum aktif', description: 'Fitur unduh laporan sedang disiapkan.' })}>
                  <Download className="h-4 w-4" />
                  Unduh Laporan
                </SuperadminToolbarButton>
                <SuperadminToolbarButton variant="primary" onClick={() => updateTab('tambah')}>
                  <UserPlus className="h-4 w-4" />
                  Tambah Admin
                </SuperadminToolbarButton>
              </div>
            </div>
          </div>
        )}
      </ScrollReveal>

      {activeTab === 'daftar' ? (
        <>
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1 rounded-[24px] bg-slate-100 p-1.5">
              {superadminAdminStatuses.map((status) => (
                <SuperadminFilterChip key={status} active={activeStatus === status} onClick={() => setActiveStatus(status)}>
                  {status}
                </SuperadminFilterChip>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari admin..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-black lg:w-64"
              />
            </div>
          </div>

          <StaggerContainer stagger={50} variant="fade-up" duration={600} className="mt-4">
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
                        aria-label="Pilih semua admin yang tampil"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>Profil Admin</DataTableHeaderCell>
                    <DataTableHeaderCell>Email</DataTableHeaderCell>
                    <DataTableHeaderCell>Akses Space</DataTableHeaderCell>
                    <DataTableHeaderCell>Status</DataTableHeaderCell>
                    <DataTableHeaderCell>Aktivitas Terakhir</DataTableHeaderCell>
                    <DataTableHeaderCell className="text-center">Action</DataTableHeaderCell>
                  </DataTableHeaderRow>
                </DataTableHead>
                <DataTableBody className="bg-transparent">
              {adminDirectoryQuery.isLoading && admins.length === 0 ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <DataTableRow key={`admin-loading-${index}`} className="[&>td]:rounded-[20px] [&>td]:border [&>td]:border-slate-200 [&>td]:bg-white">
                    <DataTableCell colSpan={7} className="px-6 py-5">
                      <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                    </DataTableCell>
                  </DataTableRow>
                ))
                ) : adminDirectoryQuery.error ? (
                <DataTableRow>
                  <DataTableCell colSpan={7} className="px-6 py-8 text-center text-[14px] text-slate-500">
                    Daftar admin belum dapat dimuat. Terjadi kendala saat mengambil data app_profiles atau admin_registry.
                  </DataTableCell>
                </DataTableRow>
                ) : paginatedAdmins.length > 0 ? paginatedAdmins.map((admin) => (
                <DataTableRow
                  key={admin.id}
                  className="cursor-pointer [&>td]:border-y [&>td]:border-slate-200 [&>td]:bg-white [&>td:first-child]:rounded-l-[20px] [&>td:first-child]:border-l [&>td:last-child]:rounded-r-[20px] [&>td:last-child]:border-r hover:[&>td]:border-slate-300 hover:[&>td]:bg-slate-50/80"
                  onClick={() => router.push(`/superadmin/manajemen-admin/${encodeURIComponent(admin.id)}`) as never}
                >
                  <DataTableCell className="w-[56px]" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedAdminEmails.includes(admin.email)}
                      onChange={() => toggleSelectedAdmin(admin.email)}
                      aria-label={`Pilih admin ${admin.name}`}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                  </DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center gap-4">
                    <SuperadminAvatar initials={admin.initials} />
                    <div>
                      <p className="text-[16px] font-semibold text-slate-900">{admin.name}</p>
                    </div>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <p className="mt-1 font-mono text-[13px] text-slate-500 break-all">{admin.email}</p>
                  </DataTableCell>
                  <DataTableCell>
                    <p className="text-[16px] font-medium text-slate-900">{admin.accessLabel}</p>
                    <p className="mt-1 text-[14px] text-slate-500">{admin.accessDetail}</p>
                  </DataTableCell>
                  <DataTableCell>
                    <SuperadminStatusBadge status={admin.status} />
                  </DataTableCell>
                  <DataTableCell>
                    <p className="text-[15px] text-slate-900">{admin.lastSeen}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{admin.lastLoginRelative}</p>
                  </DataTableCell>
                  <DataTableCell className="text-center" onClick={(event) => event.stopPropagation()}>
                    <RowActionMenu
                      buttonLabel={`Aksi untuk ${admin.name}`}
                      items={[
                        { label: 'Detail', onClick: () => router.push(`/superadmin/manajemen-admin/${encodeURIComponent(admin.id)}`) },
                        { label: 'Edit', onClick: () => router.push(`/superadmin/manajemen-admin/${encodeURIComponent(admin.id)}/edit?from=list`) },
                        { label: 'Pilih Admin', onClick: () => toggleSelectedAdmin(admin.email) },
                      ]}
                    />
                  </DataTableCell>
                </DataTableRow>
              )) : (
                <DataTableEmpty colSpan={7} title="Tidak ada admin yang cocok" description="Coba ganti filter status atau tambahkan admin baru untuk melihat hasil lainnya." />
              )}
                </DataTableBody>
              </DataTable>
            </DataTableViewport>
            {selectedAdmins.length > 0 && !selectionBarDismissed && (
              <div className="pointer-events-none absolute inset-x-0 bottom-12 z-20 flex justify-center px-4">
                <SelectedCounter
                  compact
                  className="pointer-events-auto w-fit max-w-[calc(100%-32px)] overflow-x-auto border-slate-300 shadow-[0_4px_12px_rgba(15,23,42,0.18)]"
                  title={`${selectedAdmins.length} admin dipilih`}
                  hideLeadingIcon
                  hideClearButton
                  onClear={() => setSelectedAdminEmails([])}
                  onDismiss={() => setSelectionBarDismissed(true)}
                  actions={(
                    <>
                      <button
                        type="button"
                        onClick={handleBulkSendActivation}
                        disabled={bulkActionLoading !== null}
                        className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50"
                      >
                        {bulkActionLoading === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Kirim Email Aktivasi
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkDeactivateDialogOpen(true)}
                        disabled={bulkActionLoading !== null}
                        className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-amber-200 bg-amber-50 px-3.5 text-[13px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                      >
                        {bulkActionLoading === 'deactivate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                        Nonaktifkan Akses
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkDeleteDialogOpen(true)}
                        disabled={bulkActionLoading !== null}
                        className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-200 bg-white px-3.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {bulkActionLoading === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Hapus Akses
                      </button>
                    </>
                  )}
                />
              </div>
            )}
            <DataTableFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAdmins.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              label="admin"
            />
            </DataTableShell>
          </StaggerContainer>
        </>
      ) : (
        <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 space-y-6">
          <AppSectionCard>
            <SuperadminSectionHeading
              title="Informasi Admin"
              description="Gunakan pola input yang sama seperti halaman pengaturan role lain agar pengalaman form tetap konsisten."
            />
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
                  placeholder="nama@institusi.edu"
                />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Nama Organisasi</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.organizationName}
                  onChange={(event) => setFormData((current) => ({ ...current, organizationName: event.target.value }))}
                  placeholder="Contoh: HIMAFORKA FTI UAJY"
                />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Wallet Address <span className="text-slate-400 font-normal">(Opsional)</span></SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.walletAddress}
                  onChange={(event) => setFormData((current) => ({ ...current, walletAddress: event.target.value }))}
                  placeholder="0x... (Kosongkan jika admin akan menyambungkan dompetnya sendiri saat aktivasi)"
                />
                <p className="mt-2 text-[12px] text-slate-500 italic">
                  Jika dikosongkan, admin harus menyambungkan dompetnya sendiri saat pertama kali login.
                </p>
              </label>
            </div>
          </AppSectionCard>

          <AppSectionCard>
            <SuperadminSectionHeading
              title="Akses Space"
              description="Tentukan ruang lingkup pemilihan yang dapat dikelola oleh admin ini."
            />
            <div className="mt-8 space-y-4">
              {[
                {
                  value: 'all' as const,
                  label: 'Semua Pemilihan',
                  description: 'Admin dapat memantau dan mengelola seluruh pemilihan yang tersedia.',
                },
                {
                  value: 'specific' as const,
                  label: 'Pemilihan Tertentu',
                  description: 'Admin hanya diberi akses untuk ruang pemilihan yang ditentukan.',
                },
              ].map((option) => (
                <SuperadminRadioCard
                  key={option.value}
                  active={formData.scope === option.value}
                  title={option.label}
                  description={option.description}
                  onClick={() => setFormData((current) => ({ ...current, scope: option.value }))}
                />
              ))}
            </div>
          </AppSectionCard>

          <AppSectionCard>
            <SuperadminSectionHeading
              title="Aktivasi Akun"
              description="Admin bisa mendapat link aktivasi (jika wallet diisi) atau login via OAuth Microsoft/Google dan bind wallet sendiri."
            />
            {activationLink && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[12px] font-semibold text-emerald-700">Link aktivasi siap</p>
                <p className="mt-1 text-[12px] leading-5 text-emerald-700">
                  Kirimkan link ini ke admin baru untuk membuat password dan menyambungkan wallet.
                </p>
                <div className="mt-3 flex gap-2">
                  <input value={activationLink} readOnly className="h-10 min-w-0 flex-1 rounded-md border border-emerald-200 bg-white px-3 font-mono text-[12px] text-slate-900" />
                  <button type="button" onClick={() => { navigator.clipboard.writeText(activationLink); showToast({ tone: 'success', title: 'Link Disalin' }) }} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-4 text-[13px] font-semibold text-emerald-700 hover:bg-emerald-50"><Copy className="h-4 w-4" /> Salin</button>
                </div>
              </div>
            )}
          </AppSectionCard>

          <section className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setFormData(initialFormData)
                updateTab('daftar')
              }}
              className="inline-flex h-12 items-center justify-center rounded-2xl px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-100"
            >
              Batal
            </button>
            <SuperadminToolbarButton variant="primary" onClick={handleCreateAdmin} disabled={createAdminInviteMutation.isPending}>
              {createAdminInviteMutation.isPending ? 'Menyimpan...' : 'Simpan Admin'}
            </SuperadminToolbarButton>
          </section>
        </StaggerContainer>
      )}

      <ConfirmDialog
        open={bulkDeactivateDialogOpen}
        title="Nonaktifkan admin terpilih?"
        description={`Akses ${selectedAdmins.length} admin terpilih akan dinonaktifkan dari registry admin.`}
        confirmLabel="Ya, Nonaktifkan"
        cancelLabel="Batal"
        tone="default"
        onConfirm={() => { void handleBulkDeactivate() }}
        onCancel={() => setBulkDeactivateDialogOpen(false)}
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        title="Hapus akses admin terpilih?"
        description={`Tindakan ini akan menghapus ${selectedAdmins.length} akses admin dari registry dan mengembalikan role mereka menjadi voter.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={() => { void handleBulkDelete() }}
        onCancel={() => setBulkDeleteDialogOpen(false)}
      />
    </SuperadminShell>
  )
}

export default function SuperadminAdminManagementPage() {
  return (
    <Suspense fallback={
      <SuperadminShell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-black" />
        </div>
      </SuperadminShell>
    }>
      <SuperadminAdminManagementContent />
    </Suspense>
  )
}
