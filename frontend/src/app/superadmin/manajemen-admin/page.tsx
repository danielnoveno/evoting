'use client'

import { Download, EllipsisVertical, UserPlus } from 'lucide-react'
import Link from 'next/link'
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
import { superadminAdminStatuses, superadminAdminTabs, type SuperadminAdminRecord } from '@/lib/superadmin-data'
import { useSuperadminAdminsStore } from '@/lib/superadmin-store'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

type AdminTabKey = (typeof superadminAdminTabs)[number]['key']

type AdminScope = 'all' | 'specific'

const initialFormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  scope: 'all' as AdminScope,
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function SuperadminAdminManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<AdminTabKey>('daftar')
  const [activeStatus, setActiveStatus] = useState<(typeof superadminAdminStatuses)[number]>('Semua Status')
  const { admins, setAdmins } = useSuperadminAdminsStore()
  const [formData, setFormData] = useState(initialFormData)

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
    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      showToast({ tone: 'error', title: 'Data admin belum lengkap', description: 'Lengkapi nama, email, dan password admin terlebih dahulu.' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast({ tone: 'error', title: 'Email belum valid', description: 'Gunakan email institusi yang valid untuk admin baru.' })
      return
    }

    if (formData.password.length < 8) {
      showToast({ tone: 'error', title: 'Password terlalu singkat', description: 'Gunakan minimal 8 karakter untuk keamanan akun admin.' })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      showToast({ tone: 'error', title: 'Konfirmasi password tidak cocok', description: 'Pastikan password dan konfirmasi password sama.' })
      return
    }

    const newAdmin: SuperadminAdminRecord = {
      id: `draft-${Date.now()}`,
      initials: getInitials(formData.name),
      name: formData.name,
      email: formData.email,
      accessLabel: formData.scope === 'all' ? 'Global Access' : 'Editor',
      accessDetail: formData.scope === 'all' ? 'Semua Pemilihan' : 'Pemilihan Tertentu',
      status: 'Menunggu',
      lastSeen: '-',
      lastIp: '-',
      joinedAt: 'Hari ini',
      lastLoginText: 'Belum login',
      lastLoginRelative: 'Undangan baru dibuat',
      blockchainIdentity: `vtn_adm_invite_${Date.now()}`,
      spaces: [],
      recentActivity: [],
    }

    setAdmins((current) => [newAdmin, ...current])
    updateTab('daftar')
    setActiveStatus('Semua Status')
    setFormData(initialFormData)
    showToast({ tone: 'success', title: 'Undangan admin dibuat', description: 'Admin baru berhasil ditambahkan ke daftar.' })
  }

  return (
    <SuperadminShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader
          title="Manajemen Admin"
          bottomContent={
            <div className="flex items-center gap-8 border-b border-slate-200">
              {superadminAdminTabs.map((tab) => (
                <SuperadminTabButton key={tab.key} active={activeTab === tab.key} onClick={() => updateTab(tab.key)}>
                  {tab.label}
                </SuperadminTabButton>
              ))}
            </div>
          }
          rightContent={
            activeTab === 'daftar' ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <SuperadminToolbarButton onClick={() => showToast({ tone: 'info', title: 'Unduh laporan belum aktif', description: 'Fitur unduh laporan sedang disiapkan.' })}>
                  <Download className="h-4 w-4" />
                  Unduh Laporan
                </SuperadminToolbarButton>
                <SuperadminToolbarButton variant="primary" onClick={() => updateTab('tambah')}>
                  <UserPlus className="h-4 w-4" />
                  Tambah Admin
                </SuperadminToolbarButton>
              </div>
            ) : null
          }
        />
      </ScrollReveal>

      {activeTab === 'daftar' ? (
        <>
          <ScrollReveal variant="fade-up" delay={150} duration={800}>
            <AppSectionCard className="mt-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  {superadminAdminStatuses.map((status) => (
                    <SuperadminFilterChip key={status} active={activeStatus === status} onClick={() => setActiveStatus(status)}>
                      {status}
                    </SuperadminFilterChip>
                  ))}
                </div>
                <p className="text-[15px] text-slate-800">Total: {filteredAdmins.length} admin</p>
              </div>
            </AppSectionCard>
          </ScrollReveal>

          <StaggerContainer stagger={50} variant="fade-up" duration={600} className="mt-8 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_1fr_56px] gap-4 border-b border-slate-100 px-6 py-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
              <span>Profil Admin</span>
              <span>Akses Space</span>
              <span>Status</span>
              <span>Aktivitas Terakhir</span>
              <span />
            </div>

            <div>
              {filteredAdmins.length > 0 ? filteredAdmins.map((admin) => (
                <SuperadminTableRowLink
                  key={admin.id}
                  href={`/superadmin/manajemen-admin/${admin.id}`}
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
                    <p className="mt-1 font-mono text-[13px] text-slate-500">IP: {admin.lastIp}</p>
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
                Menampilkan 1 hingga {filteredAdmins.length} dari {admins.length} admin
              </p>
              <div className="flex items-center gap-3 text-slate-500">
                <button type="button" className="h-8 w-8 rounded-xl bg-slate-100 text-slate-400">1</button>
                <button type="button">2</button>
                <button type="button">3</button>
              </div>
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
              title="Keamanan"
              description="Siapkan kata sandi awal admin. Nanti admin bisa menggantinya setelah login pertama."
            />
            <div className="mt-8 grid gap-5 xl:grid-cols-2">
              <label className="block">
                <SuperadminFieldLabel>Password</SuperadminFieldLabel>
                <SuperadminTextInput
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  placeholder="••••••••"
                />
              </label>

              <label className="block">
                <SuperadminFieldLabel>Konfirmasi Password</SuperadminFieldLabel>
                <SuperadminTextInput
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
                  placeholder="••••••••"
                />
              </label>
            </div>
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
            <SuperadminToolbarButton variant="primary" onClick={handleCreateAdmin}>
              Simpan Admin
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
