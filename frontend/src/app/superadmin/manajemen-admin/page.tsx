'use client'

import { ChevronLeft, ChevronRight, Copy, Download, EllipsisVertical, Eye, Loader2, Mail, Pencil, Power, Search, Trash2, UserPlus } from 'lucide-react'
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
  FloatingSelectionBar,
  DataTableRow,
  DataTableShell,
  DataTableToolbar,
  DataTableViewport,
  SelectedCounter,
  SortableTableHeader,
  type TableSortDirection,
} from '@/components/ui/data-table'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { resendAdminInvite } from '@/lib/repositories/adminInviteRepository'
import { deleteAdminRegistry, updateAdminRegistry } from '@/lib/repositories/profileRepository'
import { mapDirectoryAdmin } from '@/lib/superadmin-admin-mapper'
import { profileQueryKeys } from '@/hooks/use-profile'
import { syncAdminSpaces } from '@/lib/repositories/adminAccessRepository'
import { useAdminProposalList } from '@/hooks/use-admin-proposal-list'
import { useFormDraft } from '@/hooks/use-form-draft'
import { Checkbox } from '@/components/ui/checkbox'
import type { ProposalDraftRecord } from '@/lib/repositories/types'

type AdminTabKey = (typeof superadminAdminTabs)[number]['key']
type SortField = 'name' | 'email' | 'access' | 'status' | 'activity'

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
  const { clearDraft: clearAdminDraft } = useFormDraft('admin-create', formData, setFormData)
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([])
  const proposalDraftsQuery = useAdminProposalList()
  const [activationLink, setActivationLink] = useState('')
  const [selectedAdminEmails, setSelectedAdminEmails] = useState<string[]>([])
  const [selectionBarDismissed, setSelectionBarDismissed] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState<'send' | 'deactivate' | 'delete' | null>(null)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<TableSortDirection>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeactivateDialogOpen, setBulkDeactivateDialogOpen] = useState(false)
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<{ email: string; name: string } | null>(null)

  const admins = useMemo(() => {
    return (adminDirectoryQuery.data ?? [])
      .filter((record) => record.role === 'admin')
      .map(mapDirectoryAdmin)
  }, [adminDirectoryQuery.data])

  const filteredAdmins = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const filtered = admins.filter((admin) => {
      const matchesStatus = activeStatus === 'Semua Status' ? true : admin.status === activeStatus
      const matchesSearch = !normalizedSearch
        || admin.name.toLowerCase().includes(normalizedSearch)
        || admin.email.toLowerCase().includes(normalizedSearch)
        || admin.accessLabel.toLowerCase().includes(normalizedSearch)
        || admin.accessDetail.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })

    if (!sortField || !sortDirection) return filtered

    return [...filtered].sort((left, right) => {
      const leftValue = sortField === 'name' ? left.name
        : sortField === 'email' ? left.email
          : sortField === 'access' ? `${left.accessLabel} ${left.accessDetail}`
            : sortField === 'status' ? left.status
              : `${left.lastSeen} ${left.lastLoginRelative}`
      const rightValue = sortField === 'name' ? right.name
        : sortField === 'email' ? right.email
          : sortField === 'access' ? `${right.accessLabel} ${right.accessDetail}`
            : sortField === 'status' ? right.status
              : `${right.lastSeen} ${right.lastLoginRelative}`

      return leftValue.toLowerCase().localeCompare(rightValue.toLowerCase()) * (sortDirection === 'asc' ? 1 : -1)
    })
  }, [activeStatus, admins, searchTerm, sortField, sortDirection])

  const selectedAdmins = useMemo(
    () => admins.filter((admin) => selectedAdminEmails.includes(admin.email)),
    [admins, selectedAdminEmails],
  )

  const selectedAdminDirectoryRecords = useMemo(
    () => (adminDirectoryQuery.data ?? []).filter((record) => record.role === 'admin' && selectedAdminEmails.includes(record.email)),
    [adminDirectoryQuery.data, selectedAdminEmails],
  )

  const selectedStatusAction = useMemo(() => {
    if (selectedAdmins.length === 0) return null
    const allInactive = selectedAdmins.every((admin) => admin.status === 'Nonaktif')
    const allNotInactive = selectedAdmins.every((admin) => admin.status !== 'Nonaktif')
    if (allInactive) return 'activate' as const
    if (allNotInactive) return 'deactivate' as const
    return null
  }, [selectedAdmins])

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

  const handleBulkUpdateStatus = async (status: 'active' | 'inactive') => {
    const candidates = selectedAdminDirectoryRecords.filter((record) => record.registryStatus !== status)
    if (candidates.length === 0) {
      showToast({ tone: 'info', title: 'Tidak ada perubahan status', description: 'Status admin terpilih sudah sesuai.' })
      setBulkDeactivateDialogOpen(false)
      return
    }

    setBulkActionLoading('deactivate')
    const results = await Promise.allSettled(candidates.map((record) => updateAdminRegistry(record.email, {
      email: record.email,
      displayName: record.displayName,
      organizationName: record.organizationName,
      accessScope: record.accessScope,
      status,
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
      title: status === 'inactive' ? 'Bulk nonaktif admin diproses' : 'Bulk aktif admin diproses',
      description: failedCount === 0
        ? `${successCount} admin berhasil ${status === 'inactive' ? 'dinonaktifkan' : 'diaktifkan kembali'}.`
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

  const handleSingleDelete = async () => {
    if (!singleDeleteTarget) return
    setBulkActionLoading('delete')
    try {
      await deleteAdminRegistry(singleDeleteTarget.email)
      await invalidateAdminDirectory()
      showToast({ tone: 'success', title: 'Akses admin dihapus', description: `${singleDeleteTarget.name} sudah dihapus dari registry admin.` })
    } catch (error) {
      showToast({ tone: 'error', title: 'Gagal menghapus admin', description: getRepositoryErrorMessage(error) })
    } finally {
      setBulkActionLoading(null)
      setSingleDeleteTarget(null)
    }
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

    if (formData.scope === 'specific' && selectedSpaceIds.length === 0) {
      showToast({ tone: 'error', title: 'Akses pemilihan belum dipilih', description: 'Pilih minimal satu pemilihan untuk admin dengan akses terbatas.' })
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
        onSuccess: async (invite) => {
          // Sync specific space access if needed
          if (formData.scope === 'specific' && selectedSpaceIds.length > 0) {
            try {
              await syncAdminSpaces(invite.email, selectedSpaceIds)
            } catch (error) {
              console.error('Failed to sync spaces:', error)
              showToast({ tone: 'info', title: 'Akses pemilihan gagal disimpan', description: 'Admin dibuat, tetapi daftar akses pemilihan gagal dikonfigurasi.' })
            }
          }

          updateTab('daftar')
          setActiveStatus('Semua Status')
          if (invite.activationLink) {
            setActivationLink(invite.activationLink)
          }
          setFormData(initialFormData)
          setSelectedSpaceIds([])
          clearAdminDraft()

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
          <ScrollReveal variant="fade-up" delay={200} duration={800}>
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                    <DataTableHeaderCell className="w-[56px]">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        aria-label="Pilih semua admin yang tampil"
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <SortableTableHeader label="Profil Admin" active={sortField === 'name'} direction={sortDirection} onClick={() => handleSort('name')} />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <SortableTableHeader label="Email" active={sortField === 'email'} direction={sortDirection} onClick={() => handleSort('email')} />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <SortableTableHeader label="Akses Space" active={sortField === 'access'} direction={sortDirection} onClick={() => handleSort('access')} />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <SortableTableHeader label="Status" active={sortField === 'status'} direction={sortDirection} onClick={() => handleSort('status')} />
                    </DataTableHeaderCell>
                    <DataTableHeaderCell>
                      <SortableTableHeader label="Aktivitas Terakhir" active={sortField === 'activity'} direction={sortDirection} onClick={() => handleSort('activity')} />
                    </DataTableHeaderCell>
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
                    <div className="inline-flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Detail ${admin.name}`}
                        onClick={() => router.push(`/superadmin/manajemen-admin/${encodeURIComponent(admin.id)}`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Edit ${admin.name}`}
                        onClick={() => router.push(`/superadmin/manajemen-admin/${encodeURIComponent(admin.id)}/edit?from=list`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus ${admin.name}`}
                        onClick={() => setSingleDeleteTarget({ email: admin.email, name: admin.name })}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              )) : (
                <DataTableEmpty colSpan={7} title="Tidak ada admin yang cocok" description="Coba ganti filter status atau tambahkan admin baru untuk melihat hasil lainnya." />
              )}
                </DataTableBody>
              </DataTable>
            </DataTableViewport>
            {selectedAdmins.length > 0 && !selectionBarDismissed && (
              <FloatingSelectionBar>
                <SelectedCounter
                  compact
                  className="pointer-events-auto w-fit max-w-[calc(100%-32px)] overflow-x-auto border-slate-300 shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
                  title={`${selectedAdmins.length} Admin dipilih`}
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
                      {selectedStatusAction && (
                        <button
                          type="button"
                          onClick={() => setBulkDeactivateDialogOpen(true)}
                          disabled={bulkActionLoading !== null}
                          className="inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-amber-200 bg-amber-50 px-3.5 text-[13px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                        >
                          {bulkActionLoading === 'deactivate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                          {selectedStatusAction === 'activate' ? 'Aktifkan Admin' : 'Nonaktifkan Akses'}
                        </button>
                      )}
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
              </FloatingSelectionBar>
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
                <SuperadminFieldLabel required>Nama Organisasi Admin</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.organizationName}
                  onChange={(event) => setFormData((current) => ({ ...current, organizationName: event.target.value }))}
                  placeholder="Contoh: HIMAFORKA FTI UAJY"
                  maxLength={100}
                />
              </label>

              <label className="block">
                <SuperadminFieldLabel required>Email Institusi</SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="nama@institusi.edu"
                  maxLength={254}
                />
              </label>

              <label className="block xl:col-span-2">
                <SuperadminFieldLabel>Wallet Address <span className="text-slate-400 font-normal">(Opsional)</span></SuperadminFieldLabel>
                <SuperadminTextInput
                  value={formData.walletAddress}
                  onChange={(event) => setFormData((current) => ({ ...current, walletAddress: event.target.value }))}
                  placeholder="0x... (Kosongkan jika admin akan menyambungkan dompetnya sendiri saat aktivasi)"
                  maxLength={42}
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

            {formData.scope === 'specific' && (
              <div className="mt-8 border-t border-slate-100 pt-8">
                <SuperadminFieldLabel>Daftar Pemilihan Tersedia</SuperadminFieldLabel>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {proposalDraftsQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-50" />
                    ))
                  ) : (proposalDraftsQuery.data as ProposalDraftRecord[] | undefined)?.length === 0 ? (
                    <p className="col-span-full text-[14px] text-slate-500 italic">Belum ada pemilihan yang dibuat di sistem.</p>
                  ) : (
                    (proposalDraftsQuery.data as ProposalDraftRecord[] | undefined)?.map((proposal) => (
                      <label
                        key={proposal.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition ${
                          selectedSpaceIds.includes(proposal.id)
                            ? 'border-black bg-slate-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Checkbox
                          checked={selectedSpaceIds.includes(proposal.id)}
                          onCheckedChange={(checked) => {
                            setSelectedSpaceIds(current =>
                              checked
                                ? [...current, proposal.id]
                                : current.filter(id => id !== proposal.id)
                            )
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-slate-900">{proposal.title}</p>
                          <p className="truncate text-[12px] text-slate-500">{proposal.organizationName || 'Tanpa Organisasi'}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
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
        title={selectedStatusAction === 'activate' ? 'Aktifkan admin terpilih?' : 'Nonaktifkan admin terpilih?'}
        description={selectedStatusAction === 'activate'
          ? `Akses ${selectedAdmins.length} admin terpilih akan diaktifkan kembali.`
          : `Akses ${selectedAdmins.length} admin terpilih akan dinonaktifkan dari registry admin.`}
        confirmLabel={selectedStatusAction === 'activate' ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan'}
        cancelLabel="Batal"
        tone="default"
        onConfirm={() => { void handleBulkUpdateStatus(selectedStatusAction === 'activate' ? 'active' : 'inactive') }}
        onCancel={() => setBulkDeactivateDialogOpen(false)}
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        title="Hapus akses admin terpilih?"
        description={`Tindakan ini akan menghapus ${selectedAdmins.length} akses admin dari registry.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={() => { void handleBulkDelete() }}
        onCancel={() => setBulkDeleteDialogOpen(false)}
      />

      <ConfirmDialog
        open={singleDeleteTarget !== null}
        title="Hapus akses admin ini?"
        description={singleDeleteTarget ? `Akses admin ${singleDeleteTarget.name} akan dihapus dari registry.` : ''}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        tone="danger"
        disabled={bulkActionLoading === 'delete'}
        onConfirm={() => { void handleSingleDelete() }}
        onCancel={() => setSingleDeleteTarget(null)}
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
