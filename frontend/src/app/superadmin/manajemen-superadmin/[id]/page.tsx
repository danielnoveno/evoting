'use client'

import { Mail, Pencil, RefreshCcw, ShieldCheck, Trash2, Loader2, ShieldAlert, Clock3 } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import {
  SuperadminAvatar,
  SuperadminBackButton,
  SuperadminSectionCard,
  SuperadminShell,
  SuperadminStatusBadge,
  SuperadminToolbarButton,
} from '@/components/superadmin/superadmin-shell'
import { useDeleteAdminRegistry, useSuperadminAdminDirectory, useUpdateAdminRegistry } from '@/hooks/use-profile'
import { useResetPassword } from '@/hooks/use-auth-session'
import { useResendAdminInvite } from '@/hooks/use-admin-invite'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { mapDirectoryAdmin } from '@/lib/superadmin-admin-mapper'
import { Copy } from 'lucide-react'

export default function SuperadminSuperadminDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const adminId = decodeURIComponent(params.id)
  const adminDirectoryQuery = useSuperadminAdminDirectory()
  const updateAdminMutation = useUpdateAdminRegistry()
  const deleteAdminMutation = useDeleteAdminRegistry()
  const resetPasswordMutation = useResetPassword()
  const resendInviteMutation = useResendAdminInvite()

  const [activationLink, setActivationLink] = useState('')
  const [lastEmailStatus, setLastEmailStatus] = useState<'sent' | 'failed' | null>(null)
  const [lastEmailError, setLastEmailError] = useState<string | null>(null)

  const directoryRecord = useMemo(() => 
    adminDirectoryQuery.data?.find((admin) => admin.email === adminId && admin.role === 'super_admin') ?? null, 
    [adminDirectoryQuery.data, adminId]
  )
  const seedRecord = useMemo(() => directoryRecord ? mapDirectoryAdmin(directoryRecord) : null, [directoryRecord])
  const { showToast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const enabled = seedRecord?.status !== 'Nonaktif'
  const isActive = directoryRecord?.profile || directoryRecord?.registryStatus === 'active'

  if (adminDirectoryQuery.isLoading) {
    return (
      <SuperadminShell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-black" />
        </div>
      </SuperadminShell>
    )
  }

  if (!seedRecord || !directoryRecord) {
    notFound()
  }

  return (
    <SuperadminShell>
      <div className="mb-6">
        <SuperadminBackButton href="/superadmin/manajemen-superadmin" label="Kembali ke Manajemen Superadmin" />
      </div>

      <ScrollReveal variant="fade-up" duration={800}>
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="flex h-[124px] w-[124px] items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                  <SuperadminAvatar initials={seedRecord.initials} />
                </div>
                <span className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900">{seedRecord.name}</h1>
                  <SuperadminStatusBadge status={isActive ? 'Aktif' : 'Menunggu'} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[16px] text-slate-800">
                  <Mail className="h-4 w-4" />
                  {seedRecord.email}
                </div>
                <p className="mt-2 font-mono text-[15px] text-slate-400">Wallet: {seedRecord.blockchainIdentity}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <SuperadminToolbarButton variant="primary" onClick={() => showToast({ tone: 'success', title: 'Fitur log segera hadir', description: 'Log aktivitas on-chain sedang dalam pengembangan.' })}>
                <ShieldCheck className="h-4 w-4" />
                Audit Log
              </SuperadminToolbarButton>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <SuperadminSectionCard>
            <h2 className="flex items-center gap-3 text-[18px] font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5" />
              Informasi Otoritas
            </h2>
            <div className="mt-8 space-y-7">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Nama Lengkap</p>
                <p className="mt-2 text-[16px] font-semibold text-slate-900">{seedRecord.name}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Role Platform</p>
                <p className="mt-2 text-[16px] font-semibold text-slate-900">Super Admin</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Tanggal Terdaftar</p>
                <p className="mt-2 text-[16px] font-semibold text-slate-900">{seedRecord.joinedAt}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Status Aktivasi</p>
                <p className="mt-2 text-[16px] font-semibold text-slate-900">
                  {isActive ? (
                    <span className="text-emerald-600 flex items-center gap-1.5 font-semibold">
                      <ShieldAlert className="h-4 w-4" /> Aktif & Terverifikasi
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1.5 font-semibold">
                      <Clock3 className="h-4 w-4" /> Menunggu Aktivasi Wallet
                    </span>
                  )}
                </p>
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <h2 className="flex items-center gap-3 text-[18px] font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5" />
              Keamanan & Otoritas
            </h2>

            {!isActive && (
              <div className="mt-8">
                <button
                  type="button"
                  disabled={resendInviteMutation.isPending}
                  onClick={() => {
                    resendInviteMutation.mutate(seedRecord.email, {
                      onSuccess: (data) => {
                        setActivationLink(data.activationLink)
                        setLastEmailStatus(data.emailStatus)
                        setLastEmailError(data.emailError ?? null)
                        showToast({ tone: 'success', title: 'Undangan dikirim', description: 'Link aktivasi baru telah dibuat.' })
                      },
                      onError: (error) => showToast({ tone: 'error', title: 'Gagal mengirim undangan', description: getRepositoryErrorMessage(error) }),
                    })
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-[15px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {resendInviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Kirim Ulang Undangan
                </button>
              </div>
            )}

            {activationLink && (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[12px] font-semibold text-emerald-700">Link Aktivasi Manual</p>
                {lastEmailStatus === 'failed' && (
                  <p className="mt-2 text-[11px] text-red-600">
                    Email otomatis gagal: {lastEmailError ?? 'Periksa SMTP.'}
                  </p>
                )}
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    value={activationLink}
                    readOnly
                    className="h-10 rounded-md border border-emerald-200 bg-white px-3 font-mono text-[11px]"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activationLink)
                      showToast({ tone: 'success', title: 'Link disalin' })
                    }}
                    className="h-10 rounded-md bg-emerald-600 px-4 text-[12px] font-semibold text-white"
                  >
                    Salin Link
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                resetPasswordMutation.mutate(seedRecord.email, {
                  onSuccess: () => showToast({ tone: 'success', title: 'Email reset dikirim', description: 'Superadmin akan menerima tautan reset password.' }),
                  onError: (error) => showToast({ tone: 'error', title: 'Gagal', description: getRepositoryErrorMessage(error) }),
                })
              }}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-200 text-[15px] font-medium text-slate-900 hover:bg-slate-300"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset Password
            </button>

            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              className="mt-7 inline-flex items-center justify-center gap-2 text-[16px] font-semibold text-red-600 w-full"
            >
              <Trash2 className="h-4 w-4" />
              Cabut Otoritas Superadmin
            </button>
          </SuperadminSectionCard>
        </div>

        <div className="space-y-6">
          <SuperadminSectionCard>
            <h2 className="text-[18px] font-semibold text-slate-900">Hak Akses On-Chain</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-[24px] bg-emerald-50 border border-emerald-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[18px] font-semibold text-emerald-900">Admin Registry Controller</p>
                    <p className="mt-1 text-[14px] text-emerald-700 leading-relaxed">Superadmin memiliki hak untuk menambah, mengubah, or menghapus akses admin organisasi lainnya pada blockchain.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-slate-50 border border-slate-100 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[18px] font-semibold text-slate-900">System Guardian</p>
                    <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">Otoritas untuk melakukan validasi proposal pemilihan dan memantau kesehatan sinkronisasi data on-chain.</p>
                  </div>
                </div>
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <h2 className="text-[18px] font-semibold text-slate-900">Blockchain Identity</h2>
            <div className="mt-6 rounded-[24px] bg-slate-900 p-6 text-white overflow-hidden">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Verified Wallet Address</p>
              <p className="mt-3 font-mono text-[16px] break-all leading-relaxed">
                {seedRecord.blockchainIdentity}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(seedRecord.blockchainIdentity)
                    showToast({ tone: 'success', title: 'Alamat disalin' })
                  }}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 text-[13px] font-medium hover:bg-white/20 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Salin Alamat
                </button>
              </div>
            </div>
          </SuperadminSectionCard>
        </div>
      </StaggerContainer>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Cabut Otoritas?"
        description="Akun ini tidak akan bisa lagi mengakses portal superadmin and melakukan tindakan on-chain."
        confirmLabel="Ya, Cabut Otoritas"
        tone="danger"
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          setDeleteDialogOpen(false)
          deleteAdminMutation.mutate(seedRecord.email, {
            onSuccess: () => {
              showToast({ tone: 'success', title: 'Otoritas dicabut' })
              router.push('/superadmin/manajemen-superadmin')
            },
            onError: (error) => showToast({ tone: 'error', title: 'Gagal', description: getRepositoryErrorMessage(error) }),
          })
        }}
      />
    </SuperadminShell>
  )
}
