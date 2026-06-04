'use client'

import { Mail, Pencil, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react'
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
import { Loader2 } from 'lucide-react'

function LinkExpirationTimer({ expiresAt }: { expiresAt: string }) {
  const expiration = new Date(expiresAt)
  const label = Number.isNaN(expiration.getTime())
    ? 'Masa berlaku link tidak dapat dibaca.'
    : `Berlaku sampai ${expiration.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`

  return <p className="mt-1 text-[12px] font-medium text-emerald-700">{label}</p>
}

export default function SuperadminAdminDetailPage({ params }: { params: { id: string } }) {
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

  const directoryRecord = useMemo(() => adminDirectoryQuery.data?.find((admin) => admin.email === adminId && admin.role === 'admin') ?? null, [adminDirectoryQuery.data, adminId])
  const seedRecord = useMemo(() => directoryRecord ? mapDirectoryAdmin(directoryRecord) : null, [directoryRecord])
  const { showToast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const enabled = seedRecord?.status !== 'Nonaktif'

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

  const activityRows = seedRecord.recentActivity.length > 0 ? seedRecord.recentActivity : [
    {
      id: 'empty-row',
      action: 'Belum ada aktivitas',
      meta: 'Admin ini belum melakukan perubahan apapun.',
      time: '-',
      status: 'Menunggu',
      hash: '-',
    },
  ]

  return (
    <SuperadminShell>
      <div className="mb-6">
        <SuperadminBackButton href="/superadmin/manajemen-admin" label="Kembali ke Manajemen Admin" />
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
                  <SuperadminStatusBadge status={enabled ? 'Aktif' : 'Nonaktif'} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[16px] text-slate-800">
                  <Mail className="h-4 w-4" />
                  {seedRecord.email}
                </div>
                <p className="mt-2 font-mono text-[15px] text-slate-400">Wallet: {seedRecord.blockchainIdentity}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <SuperadminToolbarButton onClick={() => router.push(`/superadmin/manajemen-admin/${encodeURIComponent(seedRecord.id)}/edit?from=detail`)}>
                <Pencil className="h-4 w-4" />
                Edit Profil
              </SuperadminToolbarButton>
              <SuperadminToolbarButton variant="primary" onClick={() => showToast({ tone: 'success', title: 'Log aktivitas dibuka', description: 'Silakan lihat tabel aktivitas terbaru di bawah.' })}>
                <ShieldCheck className="h-4 w-4" />
                Log Aktivitas
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
              Informasi Akun
            </h2>
            <div className="mt-8 space-y-7">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Nama Lengkap</p>
                <p className="mt-2 text-[16px] font-semibold text-slate-900">{seedRecord.name}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Tanggal Bergabung</p>
                <p className="mt-2 text-[16px] font-semibold text-slate-900">{seedRecord.joinedAt}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Login Terakhir</p>
                <p className="mt-2 text-[16px] font-semibold text-slate-900">{seedRecord.lastLoginText} <span className="text-emerald-500">•</span></p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">IP Address Terakhir</p>
                <p className="mt-2 font-mono text-[15px] text-slate-500">{seedRecord.lastIp}</p>
              </div>
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <h2 className="flex items-center gap-3 text-[18px] font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5" />
              Keamanan
            </h2>

            <div className="mt-8 rounded-[24px] bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[18px] font-semibold text-slate-900">Status Akun</p>
                  <p className="mt-1 text-[14px] text-slate-500">Nonaktifkan akses sementara</p>
                </div>
                <button
                  type="button"
                  aria-pressed={enabled}
                  onClick={() => {
                    updateAdminMutation.mutate(
                      {
                        currentEmail: directoryRecord.email,
                        input: {
                          email: directoryRecord.email,
                          organizationName: directoryRecord.organizationName,
                          accessScope: directoryRecord.accessScope,
                          status: enabled ? 'inactive' : 'active',
                          description: directoryRecord.description,
                        },
                      },
                      {
                        onSuccess: () => {
                          showToast({ tone: 'success', title: enabled ? 'Akun dinonaktifkan' : 'Akun diaktifkan kembali', description: 'Perubahan status akun berhasil disimpan ke registry admin.' })
                        },
                        onError: (error) => {
                          showToast({ tone: 'error', title: 'Status gagal diperbarui', description: getRepositoryErrorMessage(error) })
                        },
                      },
                    )
                  }}
                  className={`relative h-8 w-14 rounded-full transition ${enabled ? 'bg-slate-900' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {activationLink && (
              <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[12px] font-semibold text-emerald-700">Link aktivasi siap digunakan</p>
                {directoryRecord?.activationExpiresAt && (
                  <LinkExpirationTimer expiresAt={directoryRecord.activationExpiresAt} />
                )}
                <p className="mt-2 text-[12px] leading-5 text-emerald-700">
                  {lastEmailStatus === 'sent'
                    ? 'Email aktivasi sudah dikirim ke email admin organisasi.'
                    : 'Kirimkan link ini ke admin organisasi. Jika email tidak terkirim, salin link dan kirim manual.'}
                </p>
                {lastEmailStatus === 'failed' && (
                  <p className="mt-2 text-[12px] leading-5 text-red-600 font-semibold">
                    Email gagal dikirim: {lastEmailError ?? 'Periksa konfigurasi SMTP/Email di server.'}
                  </p>
                )}
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    value={activationLink}
                    readOnly
                    className="h-10 min-w-0 flex-1 rounded-md border border-emerald-200 bg-white px-3 font-mono text-[12px] text-slate-900"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activationLink)
                      showToast({ tone: 'success', title: 'Link disalin', description: 'Silakan kirimkan ke admin terkait.' })
                    }}
                    className="h-10 rounded-md bg-emerald-600 px-4 text-[12px] font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    Salin Link
                  </button>
                </div>
              </div>
            )}

            {!directoryRecord.profile && (
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
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-[15px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {resendInviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Kirim Undangan Aktivasi
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                resetPasswordMutation.mutate(seedRecord.email, {
                  onSuccess: () => showToast({ tone: 'success', title: 'Email reset dikirim', description: 'Admin akan menerima tautan untuk mengatur ulang kata sandi.' }),
                  onError: (error) => showToast({ tone: 'error', title: 'Reset password gagal', description: getRepositoryErrorMessage(error) }),
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
              className="mt-7 inline-flex items-center justify-center gap-2 text-[16px] font-semibold text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Akun Admin
            </button>
          </SuperadminSectionCard>
        </div>

        <div className="space-y-6">
          <SuperadminSectionCard>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[18px] font-semibold text-slate-900">Akses Space</h2>
              <button 
                type="button" 
                onClick={() => router.push(`/superadmin/manajemen-admin/${encodeURIComponent(adminId)}/edit`)} 
                className="text-[15px] font-semibold text-slate-800 hover:text-black transition"
              >
                Kelola Akses
              </button>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {seedRecord.spaces.map((space) => (
                <article key={space.id} className="rounded-[24px] bg-white p-5">
                  <p className="text-[18px] font-semibold text-slate-900">{space.title}</p>
                  <p className="mt-2 text-[14px] leading-6 text-slate-500">{space.subtitle}</p>
                  <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">
                    {space.role}
                  </div>
                </article>
              ))}
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[18px] font-semibold text-slate-900">Aktivitas Terbaru</h2>
              <button type="button" className="text-[15px] font-semibold text-slate-800">Lihat Semua</button>
            </div>
            <div className="mt-6 overflow-hidden rounded-[24px] bg-white">
              <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_1fr] gap-4 border-b border-slate-100 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 lg:grid">
                <span>Aktivitas</span>
                <span>Waktu</span>
                <span>Status</span>
                <span>Blockchain Hash</span>
              </div>
              {activityRows.map((row) => (
                <div key={row.id} className="grid gap-3 border-b border-slate-100 px-6 py-5 lg:grid-cols-[1.3fr_1fr_0.8fr_1fr] lg:items-center">
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">{row.action}</p>
                    <p className="mt-1 text-[14px] text-slate-400">{row.meta}</p>
                  </div>
                  <p className="text-[15px] text-slate-800">{row.time}</p>
                  <div>
                    <SuperadminStatusBadge status={row.status} />
                  </div>
                  <p className="font-mono text-[14px] text-slate-400">{row.hash}</p>
                </div>
              ))}
            </div>
          </SuperadminSectionCard>
        </div>
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-8 rounded-[32px] bg-[#161d31] p-6 text-white shadow-[0_16px_60px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/10 p-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold">Identitas Akun Tertaut</h2>
                <p className="mt-2 text-[14px] text-slate-300">Status wallet ditampilkan setelah admin organisasi menautkan dompetnya sendiri.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#11182a] px-5 py-4 font-mono text-[14px] text-white">
              identitas wallet: {seedRecord.blockchainIdentity}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Hapus akun admin ini?"
        description="Akses admin akan dicabut dari seluruh space terkait."
        confirmLabel="Ya, Hapus"
        tone="danger"
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          setDeleteDialogOpen(false)
          deleteAdminMutation.mutate(seedRecord.email, {
            onSuccess: () => {
              showToast({ tone: 'success', title: 'Akun admin dihapus', description: 'Email admin dicabut dari registry dan role profil disinkronkan.' })
              router.push('/superadmin/manajemen-admin')
            },
            onError: (error) => showToast({ tone: 'error', title: 'Gagal menghapus admin', description: getRepositoryErrorMessage(error) }),
          })
        }}
      />
    </SuperadminShell>
  )
}
