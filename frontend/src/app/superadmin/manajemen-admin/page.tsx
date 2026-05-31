'use client'

import { Copy, Download, EllipsisVertical, Loader2, Mail, UserPlus } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
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
import { superadminAdminStatuses, superadminAdminTabs } from '@/lib/superadmin-data'
import { useCreateAdminRegistry, useSuperadminAdminDirectory } from '@/hooks/use-profile'
import { useCreateAdminInvite } from '@/hooks/use-admin-invite'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { mapDirectoryAdmin } from '@/lib/superadmin-admin-mapper'

type AdminTabKey = (typeof superadminAdminTabs)[number]['key']

type AdminScope = 'all' | 'specific'

const initialFormData = {
  name: '',
  email: '',
  organizationName: '',
  scope: 'all' as AdminScope,
  walletAddress: '',
}

function SuperadminAdminManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<AdminTabKey>('daftar')
  const [activeStatus, setActiveStatus] = useState<(typeof superadminAdminStatuses)[number]>('Semua Status')
  const adminDirectoryQuery = useSuperadminAdminDirectory()
  const createAdminMutation = useCreateAdminRegistry()
  const createAdminInviteMutation = useCreateAdminInvite()
  const [formData, setFormData] = useState(initialFormData)
  const [activationLink, setActivationLink] = useState('')

  const admins = useMemo(() => {
    return (adminDirectoryQuery.data ?? [])
      .filter((record) => record.role === 'admin')
      .map(mapDirectoryAdmin)
  }, [adminDirectoryQuery.data])

  const filteredAdmins = useMemo(() => {
    if (activeStatus === 'Semua Status') return admins
    return admins.filter((admin) => admin.status === activeStatus)
  }, [activeStatus, admins])

  useEffect(() => {
    const tab = searchParams.get('tab')
    setActiveTab(tab === 'tambah' ? 'tambah' : 'daftar')
  }, [searchParams])

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
            <div className="flex flex-wrap gap-1 rounded-[24px] bg-slate-100 p-1.5">
              {superadminAdminStatuses.map((status) => (
                <SuperadminFilterChip key={status} active={activeStatus === status} onClick={() => setActiveStatus(status)}>
                  {status}
                </SuperadminFilterChip>
              ))}
            </div>
          </div>
        )}
      </ScrollReveal>

      {activeTab === 'daftar' ? (
        <>
          <StaggerContainer stagger={50} variant="fade-up" duration={600} className="mt-8 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_1fr_56px] gap-4 border-b border-slate-100 px-6 py-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
              <span>Profil Admin</span>
              <span>Akses Space</span>
              <span>Status</span>
              <span>Aktivitas Terakhir</span>
              <span />
            </div>

            <div>
              {adminDirectoryQuery.isLoading && admins.length === 0 ? (
                <div className="p-6">
                  <SuperadminEmptyState title="Memuat daftar admin" description="Sistem sedang mengambil data admin dari Supabase." />
                </div>
              ) : adminDirectoryQuery.error ? (
                <div className="p-6">
                  <SuperadminEmptyState title="Daftar admin belum dapat dimuat" description="Terjadi kendala saat mengambil data app_profiles or admin_registry. Coba muat ulang halaman." />
                </div>
              ) : filteredAdmins.length > 0 ? filteredAdmins.map((admin) => (
                <SuperadminTableRowLink
                  key={admin.id}
                  href={`/superadmin/manajemen-admin/${encodeURIComponent(admin.id)}`}
                  className="lg:grid-cols-[1.3fr_1fr_0.8fr_1fr_56px] lg:items-center"
                >
                  <div className="flex items-center gap-4">
                    <SuperadminAvatar initials={admin.initials} />
                    <div>
                      <p className="text-[16px] font-semibold text-slate-900">{admin.name}</p>
                      <p className="mt-1 font-mono text-[13px] text-slate-500">{admin.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[16px] font-medium text-slate-900">{admin.accessLabel}</p>
                    <p className="mt-1 text-[14px] text-slate-500">{admin.accessDetail}</p>
                  </div>
                  <div>
                    <SuperadminStatusBadge status={admin.status} />
                  </div>
                  <div>
                    <p className="text-[15px] text-slate-900">{admin.lastSeen}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{admin.lastLoginRelative}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500">
                    <EllipsisVertical className="h-5 w-5" />
                  </div>
                </SuperadminTableRowLink>
              )) : (
                <div className="p-6">
                  <SuperadminEmptyState title="Tidak ada admin yang cocok" description="Coba ganti filter status atau tambahkan admin baru untuk melihat hasil lainnya." />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 px-6 py-5 text-[15px] text-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Menampilkan {filteredAdmins.length > 0 ? 1 : 0} hingga {filteredAdmins.length} dari {admins.length} Admin
              </p>
              {filteredAdmins.length > 0 ? (
                <div className="flex items-center gap-3 text-slate-500">
                  <button type="button" className="h-8 w-8 rounded-xl bg-slate-100 text-slate-400">1</button>
                </div>
              ) : null}
            </div>
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
