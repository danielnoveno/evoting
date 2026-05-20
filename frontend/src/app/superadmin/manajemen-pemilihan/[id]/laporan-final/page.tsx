'use client'

import { Award, BadgeCheck, BarChart3, CalendarDays, CheckCircle2, Download, ExternalLink, FileSpreadsheet, ShieldCheck, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { useMemo } from 'react'
import { SuperadminDetailIntro, SuperadminSectionCard, SuperadminShell, SuperadminStatusBadge } from '@/components/superadmin/superadmin-shell'
import { useToast } from '@/components/ui/toast-provider'
import { useSuperadminElectionsStore } from '@/lib/superadmin-mock-store'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

type FinalReportDetail = {
  codeLabel: string
  networkLabel: string
  contractUrl: string
  summary: string
  metrics: Array<{ id: string; label: string; value: string; note: string }>
  winners: Array<{ id: string; name: string; percentage: string; votes: string; tone: 'winner' | 'runner' }>
  auditChecks: Array<{ id: string; title: string; description: string }>
  timeline: Array<{ id: string; title: string; time: string; note: string }>
}

const finalReportMap: Record<string, FinalReportDetail> = {
  'koordinator-psdm-himaforka-2025': {
    codeLabel: 'ID: ORG-7744-FTI',
    networkLabel: 'Base Sepolia Finalized',
    contractUrl: 'https://sepolia.basescan.org/address/0xaa440000000000000000000000000000007744',
    summary: 'Laporan final ini merangkum hasil pemilihan yang telah selesai dan teraudit untuk kebutuhan peninjauan dan dokumentasi.',
    metrics: [
      { id: 'm1', label: 'Total Suara Valid', value: '1,165', note: 'Setelah verifikasi reveal dan tally' },
      { id: 'm2', label: 'Partisipasi Final', value: '91%', note: 'Turnout tertinggi pada batch ini' },
      { id: 'm3', label: 'Commitment Valid', value: '100%', note: 'Tidak ada mismatch pada verifikasi akhir' },
      { id: 'm4', label: 'Status Audit', value: 'Final', note: 'Rekap siap dipresentasikan' },
    ],
    winners: [
      { id: 'w1', name: 'Paslon 02 · Nanda Pratama & Siska Lestari', percentage: '47%', votes: '548 suara', tone: 'winner' },
      { id: 'w2', name: 'Paslon 01 · Arya Mahendra & Vania Putri', percentage: '31%', votes: '361 suara', tone: 'runner' },
      { id: 'w3', name: 'Paslon 03 · Dito Satrio & Celine Ayu', percentage: '22%', votes: '256 suara', tone: 'runner' },
    ],
    auditChecks: [
      { id: 'a1', title: 'Reveal lengkap', description: 'Seluruh commitment yang diterima berhasil direveal dan masuk tally akhir.' },
      { id: 'a2', title: 'Whitelist konsisten', description: 'Tidak ada wallet di luar daftar yang tercatat pada ringkasan final.' },
      { id: 'a3', title: 'Bukti on-chain siap', description: 'Smart contract dan rekap dapat dibuka melalui tautan explorer yang tersedia.' },
    ],
    timeline: [
      { id: 't1', title: 'Fase reveal ditutup', time: '2 hari lalu, 17:00', note: 'Sistem menghentikan penerimaan reveal baru.' },
      { id: 't2', title: 'Tally final disimpan', time: '2 hari lalu, 18:20', note: 'Rekap suara dikunci untuk kebutuhan audit dan presentasi.' },
      { id: 't3', title: 'Review superadmin selesai', time: 'Kemarin, 09:30', note: 'Tidak ditemukan konflik data pada review final.' },
    ],
  },
}

export default function SuperadminElectionFinalReportPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast()
  const { elections } = useSuperadminElectionsStore()
  const election = useMemo(() => elections.find((item) => item.id === params.id), [elections, params.id])

  if (!election) notFound()
  if (election.status !== 'Selesai') notFound()

  const detail = finalReportMap[election.id]
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
        title={`Laporan Final ${election.title}`}
        meta={(
          <>
            <SuperadminStatusBadge status={election.status} />
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {election.phaseLabel}</span>
          </>
        )}
        description={detail.summary}
        actions={(
          <>
            <a href={detail.contractUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-50">
              <ExternalLink className="h-4 w-4" />
              Lihat Smart Contract
            </a>
            <button
              type="button"
              onClick={() => showToast({ tone: 'success', title: 'Rekap siap diunduh', description: 'File laporan final sedang disiapkan.' })}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-5 text-[15px] font-medium text-white hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Unduh Rekap Final
            </button>
          </>
        )}
      />
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-6 lg:grid-cols-4">
        {detail.metrics.map((metric) => (
          <article key={metric.id} className="rounded-[24px] border border-slate-200 bg-white p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{metric.label}</p>
            <p className="mt-5 text-[30px] font-semibold tracking-[-0.04em] text-slate-900">{metric.value}</p>
            <p className="mt-3 text-[15px] leading-7 text-slate-800">{metric.note}</p>
          </article>
        ))}
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <SuperadminSectionCard className="border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <Award className="h-5 w-5 text-slate-700" />
            <h2 className="text-[20px] font-semibold text-slate-900">Hasil Akhir Kandidat</h2>
          </div>
          <div className="mt-8 space-y-4">
            {detail.winners.map((item) => (
              <article key={item.id} className={`rounded-[22px] border px-5 py-5 ${item.tone === 'winner' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[17px] font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-2 text-[15px] text-slate-800">{item.votes}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className={`text-[28px] font-semibold tracking-[-0.04em] ${item.tone === 'winner' ? 'text-emerald-700' : 'text-slate-900'}`}>{item.percentage}</p>
                    <p className="mt-1 text-[14px] text-slate-500">persentase suara</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SuperadminSectionCard>

        <div className="space-y-6">
          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Audit & Verifikasi</h2>
            </div>
            <div className="mt-8 space-y-4">
              {detail.auditChecks.map((item) => (
                <article key={item.id} className="rounded-[20px] bg-slate-100 px-5 py-5">
                  <h3 className="text-[16px] font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-slate-800">{item.description}</p>
                </article>
              ))}
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Jejak Proses Final</h2>
            </div>
            <div className="mt-8 space-y-4">
              {detail.timeline.map((item) => (
                <article key={item.id} className="rounded-[20px] border border-slate-200 px-5 py-5">
                  <p className="text-[16px] font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-[14px] text-slate-400">{item.time}</p>
                  <p className="mt-3 text-[15px] leading-7 text-slate-800">{item.note}</p>
                </article>
              ))}
            </div>
          </SuperadminSectionCard>
        </div>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={300} duration={800}>
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <SuperadminSectionCard className="border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-slate-700" />
            <h2 className="text-[20px] font-semibold text-slate-900">Ringkasan Presentasi</h2>
          </div>
          <p className="mt-5 text-[15px] leading-7 text-slate-800">Gunakan halaman ini sebagai ringkasan akhir untuk peninjauan hasil, audit, dan dokumentasi pemilihan.</p>
        </SuperadminSectionCard>

        <SuperadminSectionCard className="border border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-slate-700" />
            <h2 className="text-[20px] font-semibold text-slate-900">Dokumen Rekap</h2>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => showToast({ tone: 'info', title: 'CSV disiapkan', description: 'File CSV sedang disiapkan.' })} className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-200">Unduh CSV</button>
            <button type="button" onClick={() => showToast({ tone: 'info', title: 'PDF disiapkan', description: 'File PDF sedang disiapkan.' })} className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-200">Unduh PDF</button>
          </div>
        </SuperadminSectionCard>
        </section>
      </ScrollReveal>
    </SuperadminShell>
  )
}
