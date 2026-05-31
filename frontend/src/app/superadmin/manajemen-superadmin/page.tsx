'use client'

import { Copy, Loader2, Mail, RefreshCw, UserPlus, ShieldAlert, CheckCircle2, Clock3 } from 'lucide-react'
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
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useQuery } from '@tanstack/react-query'
import { listAdminDirectory } from '@/lib/repositories/profileRepository'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { useCreateAdminInvite, useResendAdminInvite } from '@/hooks/use-admin-invite'

type TabKey = 'daftar' | 'tambah'

const initialFormData = {
  name: '',
  email: '',
  walletAddress: '',
}

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
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>('daftar')
  const [formData, setFormData] = useState(initialFormData)
  const [activationLink, setActivationLink] = useState('')
  const [lastEmailStatus, setLastEmailStatus] = useState<'sent' | 'skipped' | 'failed' | null>(null)
  const [lastEmailError, setLastEmailError] = useState<string | null>(null)
  const createAdminInviteMutation = useCreateAdminInvite()
  const resendInviteMutation = useResendAdminInvite()

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

        <div className="mt-10 flex items-end gap-8 border-b border-slate-200">
          <SuperadminTabButton active={activeTab === 'daftar'} onClick={() => updateTab('daftar')}>
            Daftar Otoritas
          </SuperadminTabButton>
          <SuperadminTabButton active={activeTab === 'tambah'} onClick={() => updateTab('tambah')}>
            Tambah Baru
          </SuperadminTabButton>
        </div>
      </ScrollReveal>

      {activeTab === 'daftar' ? (
        <>
          {error && (
            <div className="mt-8 rounded-2xl bg-red-50 p-4 text-red-600 text-[14px]">
              {getRepositoryErrorMessage(error)}
            </div>
          )}

          <StaggerContainer stagger={50} variant="fade-up" duration={600} className="mt-8 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <div className="hidden grid-cols-[1.5fr_1.5fr_1fr_56px] gap-4 border-b border-slate-100 px-6 py-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 lg:grid">
              <span>Profil Superadmin</span>
              <span>Wallet Address</span>
              <span>Status Otoritas</span>
              <span />
            </div>

            <div>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 w-full animate-pulse border-b border-slate-50" />
                ))
              ) : superadmins.length > 0 ? superadmins.map((admin) => {
                const isActive = Boolean(admin.profile) || admin.registryStatus === 'active'

                return (
                <SuperadminTableRowLink
                  key={admin.email}
                  href={`/superadmin/manajemen-superadmin/${encodeURIComponent(admin.email)}`}
                  className="lg:grid-cols-[1.5fr_1.5fr_1fr_56px]"
                >
                  <div className="flex items-center gap-4">
                    <SuperadminAvatar initials={getInitials(admin.displayName || 'SA')} />
                    <div>
                      <p className="text-[16px] font-semibold text-slate-900">{admin.displayName || 'Super Admin'}</p>
                      <p className="mt-1 font-mono text-[13px] text-slate-500">{admin.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[13px] text-slate-600 truncate">{admin.walletAddress || admin.profile?.walletAddress || 'Belum ditautkan'}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {isActive ? <ShieldAlert className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                      {isActive ? 'Super Admin Aktif' : 'Menunggu Aktivasi'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          resendInviteMutation.mutate(admin.email, {
                            onSuccess: (result) => {
                              showToast({
                                tone: result.emailStatus === 'sent' ? 'success' : 'info',
                                title: result.emailStatus === 'sent' ? 'Email Terkirim' : 'Email Gagal',
                                description: result.emailStatus === 'sent'
                                  ? 'Link aktivasi sudah dikirim ulang.'
                                  : result.emailError ?? 'Coba lagi nanti.',
                              })
                            },
                            onError: (err) => {
                              showToast({ tone: 'error', title: 'Kirim Ulang Gagal', description: getRepositoryErrorMessage(err) })
                            },
                          })
                        }}
                        disabled={resendInviteMutation.isPending}
                        title="Kirim ulang email aktivasi"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
                      >
                        {resendInviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      </button>
                    )}
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {isActive ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
                    </div>
                  </div>
                </SuperadminTableRowLink>
                )
              }) : (
                <div className="p-10">
                  <SuperadminEmptyState title="Belum ada superadmin lain" description="Hanya akun Anda yang terdaftar sebagai otoritas tertinggi saat ini." />
                </div>
              )}
            </div>
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
