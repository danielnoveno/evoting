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
import { useSuperadminAdminsStore } from '@/lib/superadmin-mock-store'

export default function SuperadminAdminDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { admins, setAdmins } = useSuperadminAdminsStore()
  const seedRecord = useMemo(() => admins.find((admin) => admin.id === params.id), [admins, params.id])
  const { showToast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [enabled, setEnabled] = useState(seedRecord?.status !== 'Nonaktif')

  if (!seedRecord) {
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
              <div className="mt-3 flex items-center gap-2 text-[16px] text-slate-600">
                <Mail className="h-4 w-4" />
                {seedRecord.email}
              </div>
              <p className="mt-2 font-mono text-[15px] text-slate-400">ID Admin: {seedRecord.blockchainIdentity}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <SuperadminToolbarButton onClick={() => router.push(`/superadmin/manajemen-admin/${seedRecord.id}/edit`)}>
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

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
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
                    setEnabled((current) => !current)
                    setAdmins((current) => current.map((admin) => admin.id === seedRecord.id ? { ...admin, status: enabled ? 'Nonaktif' : 'Aktif' } : admin))
                    showToast({ tone: 'success', title: enabled ? 'Akun dinonaktifkan' : 'Akun diaktifkan kembali', description: 'Perubahan ini hanya berlaku pada data dummy lokal.' })
                  }}
                  className={`relative h-8 w-14 rounded-full transition ${enabled ? 'bg-slate-900' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => showToast({ tone: 'info', title: 'Reset password dikirim', description: 'Email reset password dummy telah dikirim ke admin ini.' })}
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
              <button type="button" onClick={() => showToast({ tone: 'info', title: 'Kelola akses belum final', description: 'Gunakan halaman dummy ini untuk presentasi alur.' })} className="text-[15px] font-semibold text-slate-600">
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
              <button type="button" className="text-[15px] font-semibold text-slate-600">Lihat Semua</button>
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
                  <p className="text-[15px] text-slate-600">{row.time}</p>
                  <div>
                    <SuperadminStatusBadge status={row.status} />
                  </div>
                  <p className="font-mono text-[14px] text-slate-400">{row.hash}</p>
                </div>
              ))}
            </div>
          </SuperadminSectionCard>
        </div>
      </section>

      <section className="mt-8 rounded-[32px] bg-[#161d31] p-6 text-white shadow-[0_16px_60px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/10 p-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold">Identitas Terverifikasi Blockchain</h2>
              <p className="mt-2 text-[14px] text-slate-300">Seluruh aktivitas profil ini dicatat secara permanen di ledger publik.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#11182a] px-5 py-4 font-mono text-[14px] text-white">
            verification hash: {seedRecord.blockchainIdentity}
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Hapus akun admin ini?"
        description="Aksi ini hanya simulasi, tetapi pada sistem nyata akses admin akan dicabut dari seluruh space terkait."
        confirmLabel="Ya, Hapus"
        tone="danger"
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          setDeleteDialogOpen(false)
          showToast({ tone: 'success', title: 'Akun admin dihapus', description: 'Perubahan dummy berhasil disimulasikan.' })
        }}
      />
    </SuperadminShell>
  )
}
