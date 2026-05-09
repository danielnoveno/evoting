'use client'

import { ArrowRight, CircleCheck, ExternalLink, Hourglass } from 'lucide-react'
import Link from 'next/link'
import { VoterPageSkeleton, VoterShell } from '@/components/voter/voter-shell'
import {
  formatNumber,
  getElectionProgress,
  getPhaseLabel,
  getRecentLogs,
  resolveElectionAction,
  sortDashboardElections,
  useVoterStore,
} from '@/lib/voter-mock-store'

const logToneClassName = {
  success: 'bg-emerald-50 text-emerald-700',
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
} as const

const logToneIcon = {
  success: CircleCheck,
  info: ExternalLink,
  warning: Hourglass,
} as const

export default function VoterDashboardPage() {
  const { store, loading } = useVoterStore()

  if (loading || !store) {
    return (
      <VoterShell>
        <VoterPageSkeleton />
      </VoterShell>
    )
  }

  const elections = sortDashboardElections(store.elections)
  const featuredElection = elections[0]
  const secondaryElection = elections[1]
  const logs = getRecentLogs(store)
  const action = resolveElectionAction(featuredElection)
  const secondaryAction = resolveElectionAction(secondaryElection)

  const participated = store.elections.filter((election) => election.commitProof || election.revealProof).length
  const pendingReveal = store.elections.filter((election) => election.phase === 'reveal' && !election.revealProof).length
  const completed = store.elections.filter((election) => election.phase === 'ended').length
  const participationRate = Math.round((participated / store.elections.length) * 100)

  return (
    <VoterShell>
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Dashboard pemilih</p>
        <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[42px] md:text-[56px]">Selamat Datang, {store.profile.name.split(' ')[0]}.</h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-8 text-slate-600 md:text-[18px] md:leading-9">
          Sistem pemilihan berbasis blockchain yang menjaga integritas commit-reveal, transparansi hasil, dan bukti audit untuk setiap partisipasi Anda.
        </p>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.72fr)]">
        <article className="rounded-[32px] border border-slate-100 bg-white p-7 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Deadline terdekat</p>
              <h2 className="mt-5 text-[28px] font-semibold tracking-[-0.03em] text-slate-900 sm:text-[36px] md:text-[52px]">{featuredElection.title}</h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-slate-600 md:text-[17px] md:leading-8">{featuredElection.summary}</p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
              {getPhaseLabel(featuredElection.phase)}
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Waktu tersisa</p>
              <p className="mt-2 text-[18px] font-semibold text-slate-900">{new Date(featuredElection.deadlineIso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total partisipan</p>
              <p className="mt-2 text-[18px] font-semibold text-slate-900">{formatNumber(featuredElection.totalParticipants)}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={action.href} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900 sm:w-auto">
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pemilih/bukti-saya" className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-100 px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-200 sm:w-auto">
              Lihat Bukti Saya
            </Link>
          </div>
        </article>

        <article className="rounded-[32px] bg-[#161f35] p-7 text-white md:p-8">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
              {getPhaseLabel(secondaryElection.phase)}
            </span>
            <span className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Status jaringan · aktif</span>
          </div>
          <h3 className="mt-8 text-[24px] font-semibold leading-tight text-white md:text-[36px]">{secondaryElection.title}</h3>
          <p className="mt-4 text-[16px] leading-8 text-slate-300">{secondaryElection.summary}</p>

          <div className="mt-8">
            <div className="flex items-center justify-between text-[12px] uppercase tracking-[0.06em] text-slate-400">
              <span>Progress</span>
              <span>{getElectionProgress(secondaryElection)}% quorum</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${getElectionProgress(secondaryElection)}%` }} />
            </div>
          </div>

          <Link href={secondaryAction.href} className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-white px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-100">
            {secondaryAction.label}
          </Link>
        </article>
      </section>

      <section className="mt-6 rounded-[32px] bg-slate-100 p-7 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900 md:text-[24px]">Log Transaksi Blockchain Terkini</h2>
              <p className="mt-2 text-[14px] leading-7 text-slate-600">Verifikasi aktivitas commit dan reveal dari ruang voting yang sedang Anda ikuti.</p>
            </div>
            <Link href="/pemilih/bukti-saya" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 hover:text-slate-900 sm:text-right">
              Eksplorasi semua
            </Link>
          </div>

        <div className="mt-8 space-y-4">
          {logs.map((log) => {
            const Icon = logToneIcon[log.tone]

            return (
              <article key={log.id} className="rounded-[24px] border border-slate-100 bg-white px-5 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${logToneClassName[log.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-slate-900 md:text-[18px]">{log.title}</p>
                      <p className="mt-1 break-words text-[13px] text-slate-500">{log.detail}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${logToneClassName[log.tone]}`}>
                      {log.tone === 'success' ? 'Selesai' : log.tone === 'info' ? 'Berlangsung' : 'Menunggu'}
                    </span>
                    <span className="text-[13px] text-slate-500">{log.timeLabel}</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,0.8fr)_minmax(0,0.82fr)]">
        <article className="rounded-[32px] border border-slate-100 bg-white p-7 md:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Hourglass className="h-5 w-5" />
          </div>
          <span className="mt-6 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">Menunggu</span>
          <h3 className="mt-5 text-[24px] font-semibold text-slate-900">{elections.find((election) => election.phase === 'registration')?.title ?? 'Belum ada pemilihan lain'}</h3>
          <p className="mt-4 text-[16px] leading-8 text-slate-600">
            Pendaftaran kandidat masih dibuka. Voting akan dimulai setelah admin mengaktifkan fase commit sesuai urutan resmi.
          </p>
          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-5 text-[14px]">
            <span className="text-slate-400">Status</span>
            <span className="font-semibold text-slate-900">Pra-registrasi</span>
          </div>
        </article>

        <article className="rounded-[32px] bg-slate-100 p-7 md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Partisipasi Anda</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-[52px] font-semibold leading-none tracking-[-0.05em] text-slate-900 sm:text-[64px]">{participationRate}%</p>
            <p className="pb-2 text-[16px] font-semibold text-emerald-600 sm:text-[18px]">+12%</p>
          </div>
          <p className="mt-4 max-w-[24ch] text-[15px] leading-7 text-slate-600">Dari total ruang voting yang Anda ikuti tahun ini.</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {store.elections.slice(0, 3).map((election, index) => (
                <div key={election.id} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-100 text-[12px] font-semibold text-white ${index === 0 ? 'bg-slate-900' : index === 1 ? 'bg-slate-700' : 'bg-slate-500'}`}>
                  {index + 1}
                </div>
              ))}
            </div>
            <span className="rounded-full bg-black px-3 py-1 text-[12px] font-semibold text-white">+{Math.max(store.elections.length - 3, 0)}</span>
          </div>
        </article>

        <article className="rounded-[32px] bg-[#161f35] p-7 text-white md:p-8">
          <h3 className="text-[24px] font-semibold text-white md:text-[36px]">Butuh Bantuan Teknis?</h3>
          <p className="mt-4 text-[16px] leading-8 text-slate-300">
            Panduan langkah demi langkah untuk commit, konfirmasi, reveal, hingga verifikasi hasil dapat diakses kapan saja.
          </p>
          <Link href="/pemilih/bantuan" className="mt-10 inline-flex items-center gap-2 text-[15px] font-semibold text-white hover:text-slate-200">
            Buka Pusat Bantuan
            <ExternalLink className="h-4 w-4" />
          </Link>
        </article>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        {[
          ['Space diikuti', store.elections.length],
          ['Menunggu reveal', pendingReveal],
          ['Bukti final', completed],
        ].map(([label, value]) => (
          <article key={label} className="rounded-[28px] border border-slate-100 bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <p className="mt-4 text-[48px] font-semibold leading-none tracking-[-0.04em] text-slate-900">{value}</p>
          </article>
        ))}
      </section>
    </VoterShell>
  )
}
