'use client'

import { AlertTriangle, ArrowRight, BadgeCheck, Clock3, ExternalLink, FileSearch, ListChecks, Radar, ShieldAlert, ShieldCheck } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { SuperadminDetailIntro, SuperadminSectionCard, SuperadminShell, SuperadminStatusBadge, SuperadminToolbarButton } from '@/components/superadmin/superadmin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { useSuperadminElectionsStore } from '@/lib/superadmin-mock-store'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

type InvestigationDetail = {
  codeLabel: string
  networkLabel: string
  contractUrl: string
  summary: string
  alerts: Array<{ id: string; title: string; description: string; severity: 'high' | 'medium' }>
  checks: Array<{ id: string; title: string; note: string; status: string }>
  incidents: Array<{ id: string; title: string; time: string; detail: string }>
}

const investigationMap: Record<string, InvestigationDetail> = {
  e3: {
    codeLabel: 'ID: ORG-9921-ASO',
    networkLabel: 'Base Mainnet Halted',
    contractUrl: 'https://sepolia.basescan.org/address/0x77dd0000000000000000000000000000009921',
    summary: 'Halaman investigasi ini menampilkan ringkasan anomali, checklist verifikasi, dan jejak insiden untuk pemilihan yang sedang ditangguhkan.',
    alerts: [
      { id: 'a1', title: 'Lonjakan commitment tidak normal', description: 'Batch commit meningkat tajam dalam waktu kurang dari 2 menit.', severity: 'high' },
      { id: 'a2', title: 'Partisipasi tertahan di 12%', description: 'Turnout jauh di bawah baseline historis untuk ruang serupa.', severity: 'medium' },
    ],
    checks: [
      { id: 'c1', title: 'Whitelist divergence check', note: 'Cocokkan batch wallet yang masuk dengan daftar awal.', status: 'Perlu review' },
      { id: 'c2', title: 'Contract pause validation', note: 'Pastikan kontrak benar-benar berhenti menerima input baru.', status: 'Selesai' },
      { id: 'c3', title: 'Feed anomaly correlation', note: 'Bandingkan lonjakan hash dengan waktu publikasi whitelist.', status: 'Dalam proses' },
    ],
    incidents: [
      { id: 'i1', title: 'Anomali pertama terdeteksi', time: 'Kemarin, 16:40', detail: 'Radar transaksi mendeteksi pola commitment serupa dari batch beruntun.' },
      { id: 'i2', title: 'Tim moderasi melakukan isolasi', time: 'Kemarin, 17:15', detail: 'Mode halt diterapkan untuk menahan transaksi baru selama pengecekan manual.' },
      { id: 'i3', title: 'Pemilihan ditandai suspended', time: 'Kemarin, 18:05', detail: 'Superadmin menerima rekomendasi penghentian sementara pada dashboard demo.' },
    ],
  },
}

export default function SuperadminElectionInvestigationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { elections, setElections } = useSuperadminElectionsStore()
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false)

  const election = useMemo(() => elections.find((item) => item.id === params.id), [elections, params.id])
  if (!election) notFound()
  if (election.status !== 'Ditangguhkan') notFound()

  const detail = investigationMap[election.id]
  if (!detail) notFound()

  return (
    <SuperadminShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <SuperadminDetailIntro
          backHref="/superadmin/manajemen-pemilihan"
        backLabel="Kembali ke Daftar"
        chips={(
          <>
            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[14px] font-medium text-blue-700">
              <BadgeCheck className="h-4 w-4" />
              {detail.networkLabel}
            </span>
            <span className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-[13px] text-slate-500">{detail.codeLabel}</span>
          </>
        )}
        title={`Investigasi ${election.title}`}
        meta={(
          <>
            <SuperadminStatusBadge status={election.status} />
            <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> {election.phaseLabel}</span>
          </>
        )}
        description={detail.summary}
        actions={(
          <>
            <a href={detail.contractUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-50">
              <ExternalLink className="h-4 w-4" />
              Lihat Smart Contract
            </a>
            <SuperadminToolbarButton variant="primary" onClick={() => setResumeDialogOpen(true)}>
              Lanjutkan Pemilihan
            </SuperadminToolbarButton>
          </>
        )}
      />
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-6 lg:grid-cols-2">
        {detail.alerts.map((item) => (
          <article key={item.id} className={`rounded-[24px] border p-6 ${item.severity === 'high' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-full ${item.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-3 text-[15px] leading-7 text-slate-700">{item.description}</p>
              </div>
            </div>
          </article>
        ))}
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)]">
        <SuperadminSectionCard className="border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <ListChecks className="h-5 w-5 text-slate-700" />
            <h2 className="text-[20px] font-semibold text-slate-900">Checklist Investigasi</h2>
          </div>
          <div className="mt-8 space-y-4">
            {detail.checks.map((item) => (
              <article key={item.id} className="rounded-[20px] border border-slate-200 px-5 py-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-[15px] leading-7 text-slate-600">{item.note}</p>
                  </div>
                  <span className="inline-flex self-start rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-600">{item.status}</span>
                </div>
              </article>
            ))}
          </div>
        </SuperadminSectionCard>

        <div className="space-y-6">
          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <Radar className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Jejak Insiden</h2>
            </div>
            <div className="mt-8 space-y-4">
              {detail.incidents.map((item) => (
                <article key={item.id} className="rounded-[20px] bg-slate-100 px-5 py-5">
                  <p className="text-[16px] font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-[14px] text-slate-400">{item.time}</p>
                  <p className="mt-3 text-[15px] leading-7 text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <FileSearch className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Aksi Investigasi</h2>
            </div>
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => showToast({ tone: 'info', title: 'Log anomali dibuka', description: 'Panel log rinci masih berupa simulasi frontend.' })}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-200"
              >
                <ShieldAlert className="h-4 w-4" />
                Buka Log Anomali
              </button>
              <button
                type="button"
                onClick={() => showToast({ tone: 'info', title: 'Checklist audit dibuka', description: 'Checklist audit lanjutan masih berupa simulasi frontend.' })}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-200"
              >
                <ShieldCheck className="h-4 w-4" />
                Audit Lanjutan
              </button>
              <button
                type="button"
                onClick={() => setResumeDialogOpen(true)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-5 text-[15px] font-medium text-white hover:bg-slate-800"
              >
                Resume ke Pemilihan Aktif
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </SuperadminSectionCard>
        </div>
        </section>
      </ScrollReveal>

      <ConfirmDialog
        open={resumeDialogOpen}
        title="Lanjutkan kembali pemilihan ini?"
        description="Mode demo akan mengubah status pemilihan menjadi aktif lalu mengarahkan Anda ke halaman moderasi. Tidak ada perubahan backend nyata."
        confirmLabel="Ya, Lanjutkan"
        onCancel={() => setResumeDialogOpen(false)}
        onConfirm={() => {
          setResumeDialogOpen(false)
          setElections((current) => current.map((item) => item.id === election.id ? { ...item, status: 'Aktif', note: 'Online' } : item))
          showToast({ tone: 'success', title: 'Pemilihan dilanjutkan kembali', description: 'Status dummy berhasil diubah ke mode aktif.' })
          window.setTimeout(() => {
            router.push(`/superadmin/manajemen-pemilihan/${election.id}/moderasi`)
          }, 500)
        }}
      />
    </SuperadminShell>
  )
}
