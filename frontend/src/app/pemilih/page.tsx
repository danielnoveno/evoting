'use client'

import { Archive, ArrowRight, CalendarDays, CircleCheck, ExternalLink, Hourglass, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { VoterPageSkeleton, VoterShell } from '@/components/voter/voter-shell'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import type { VoterElection } from '@/lib/voter-store'
import {
  getElectionViewState,
  formatNumber,
  getRecentLogs,
  resolveElectionAction,
  sortDashboardElections,
  useVoterStore,
} from '@/lib/voter-store'

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

function formatDashboardDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getCountdownParts(value: string) {
  const diff = Math.max(0, new Date(value).getTime() - Date.now())
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

function CountdownTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-[82px] rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-center text-white backdrop-blur-sm md:min-w-[96px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-200">{label}</p>
      <p className="mt-1 text-[38px] font-semibold leading-none tracking-[-0.04em] md:text-[52px]">{String(value).padStart(2, '0')}</p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-200">{label}</p>
    </div>
  )
}

function useLiveCountdown(targetIso: string, onReachedZero?: () => void) {
  const [countdown, setCountdown] = useState(() => getCountdownParts(targetIso))

  useEffect(() => {
    setCountdown(getCountdownParts(targetIso))
    let calledZero = false
    const interval = window.setInterval(() => {
      const parts = getCountdownParts(targetIso)
      setCountdown(parts)
      // Trigger refresh once when countdown first reaches zero
      if (parts.days === 0 && parts.hours === 0 && parts.minutes === 0 && parts.seconds === 0 && !calledZero) {
        calledZero = true
        onReachedZero?.()
      }
    }, 1000)

    return () => window.clearInterval(interval)
  }, [targetIso, onReachedZero])

  return countdown
}

function FeaturedHeroCard({ election, onCountdownZero }: { election: VoterElection; onCountdownZero?: () => void }) {
  const countdown = useLiveCountdown(election.deadlineIso, onCountdownZero)
  const action = resolveElectionAction(election)
  const viewState = getElectionViewState(election)
  const isUpcoming = viewState.nextAction === 'wait'
  const alreadyVoted = viewState.hasCommitted
  const label = alreadyVoted
    ? 'Suara Sudah Tercatat'
    : isUpcoming
      ? 'Acara Pemilihan Mendatang'
      : election.phase === 'reveal'
        ? 'Fase Penghitungan Suara'
        : election.phase === 'ended'
          ? 'Pemilihan Selesai'
          : 'Pemilihan Sedang Berlangsung'
  const countdownLabel = alreadyVoted
    ? 'Menunggu pembukaan fase berikutnya:'
    : isUpcoming
      ? 'Hitung mundur ke pembukaan suara:'
      : election.phase === 'reveal'
        ? 'Batas penghitungan suara:'
        : election.phase === 'ended'
          ? 'Pemilihan telah selesai:'
          : 'Sisa waktu memilih:'
  const dateLabel = isUpcoming ? 'Waktu Mulai' : election.phase === 'ended' ? 'Selesai Pada' : 'Batas Waktu'

  return (
    <article id={`pemilihan-${election.id}`} className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800 p-5 text-white md:p-6">
      {election.bannerPath && (
        <div className="absolute inset-0 z-0">
          <img
            src={election.bannerPath}
            alt=""
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>
      )}
      
      <div className="relative z-10 flex min-h-[220px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold uppercase tracking-[0.04em] text-white md:text-[18px]">{label}</p>
          <h2 className="mt-3 text-[44px] font-semibold leading-none tracking-[-0.05em] text-white md:text-[60px]">{election.title}</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-200">{alreadyVoted ? 'Pilihanmu sudah dikunci di blockchain. Menunggu waktu penghitungan dibuka oleh sistem.' : election.summary}</p>

          <div className="mt-6 grid gap-2 text-[14px] leading-7 text-slate-100">
            <p>
              {dateLabel}: <span className="font-semibold text-white">{formatDashboardDateTime(election.deadlineIso)} WIB</span>
            </p>
            <p>
              Total Partisipan Terdaftar: <span className="font-semibold text-white">{formatNumber(election.totalParticipants)}</span>
            </p>
          </div>
        </div>

        <div className="w-full lg:max-w-[560px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-100">{countdownLabel}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CountdownTile label="Hari" value={countdown.days} />
            <CountdownTile label="Jam" value={countdown.hours} />
            <CountdownTile label="Menit" value={countdown.minutes} />
            <CountdownTile label="Detik" value={countdown.seconds} />
          </div>
          {alreadyVoted ? (
            <div className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-emerald-300/40 bg-emerald-500/10 px-5 text-[13px] font-semibold text-emerald-200">
              ✓ Suara Sudah Dicoblos
            </div>
          ) : isUpcoming ? (
            <button type="button" disabled className="mt-5 inline-flex h-10 w-full cursor-not-allowed items-center justify-center rounded-md border border-amber-300/60 bg-white/5 px-5 text-[13px] font-semibold text-amber-100">
              Belum Dibuka
            </button>
          ) : (
            <Link href={action.href} className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-white px-5 text-[13px] font-semibold text-slate-900 hover:bg-slate-100">
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

function OtherElectionCard({ election }: { election: VoterElection }) {
  const action = resolveElectionAction(election)
  const viewState = getElectionViewState(election)
  const isUpcoming = viewState.nextAction === 'wait'
  const statusLabel = isUpcoming ? 'Mendatang' : election.phase === 'ended' ? 'Selesai' : 'Aktif'
  
  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-md">
      {election.bannerPath && (
        <div className="h-32 w-full overflow-hidden border-b border-slate-100">
          <img
            src={election.bannerPath}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${isUpcoming ? 'bg-amber-50 text-amber-700' : election.phase === 'ended' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>
            {statusLabel}
          </span>
          <span className="text-[12px] text-slate-400 font-mono">ID: {election.id.slice(0, 4).toUpperCase()}</span>
        </div>
        <h3 className="mt-4 text-[18px] font-semibold leading-tight text-slate-900 group-hover:text-blue-600">{election.title}</h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-slate-500">{election.summary}</p>
        
        <div className="mt-5 space-y-2 text-[12px] text-slate-600">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatDashboardDateTime(election.deadlineIso)}</span>
          </div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatNumber(election.totalParticipants)} Peserta</span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="border-t border-slate-100 pt-4">
          {isUpcoming ? (
            <button type="button" disabled className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-slate-50 py-2 text-[12px] font-semibold text-slate-400">
              Belum Dibuka
            </button>
          ) : (
            <Link href={action.href} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800">
              {action.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

function ScheduleStateBanner({ hasUpcoming, onlyPast, upcomingCount }: { hasUpcoming: boolean; onlyPast: boolean; upcomingCount: number }) {
  if (hasUpcoming) {
    if (upcomingCount <= 1) return null
    return <p className="mt-3 text-[12px] font-semibold text-slate-500">+{upcomingCount - 1} pemilihan mendatang lain tersedia di daftar bawah.</p>
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            {onlyPast ? <Archive className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-slate-900">{onlyPast ? 'Belum ada pemilihan mendatang' : 'Tidak ada jadwal pemilihan baru'}</p>
            <p className="mt-1 max-w-3xl text-[13px] leading-6 text-slate-600">
              {onlyPast
                ? 'Saat ini hanya ada riwayat pemilihan yang sudah selesai. Anda tetap dapat membuka hasil dan bukti transaksi dari arsip.'
                : 'Jika seharusnya ada pemilihan pada periode ini, hubungi admin organisasi untuk memastikan wallet Anda sudah masuk whitelist.'}
            </p>
          </div>
        </div>
        <Link href="/pemilih/bukti-saya" className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-900 hover:bg-slate-50">
          Lihat Bukti Saya
        </Link>
      </div>
    </section>
  )
}

export default function VoterDashboardPage() {
  const { store, loading, refresh } = useVoterStore()

  if (loading || !store) {
    return (
      <VoterShell>
        <VoterPageSkeleton />
      </VoterShell>
    )
  }

  const elections = sortDashboardElections(store.elections)
  if (elections.length === 0) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h1 className="text-[24px] font-semibold text-slate-900">Belum ada pemilihan untuk akun ini</h1>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-7 text-slate-600">
            Wallet Anda belum terhubung ke pemilihan pada periode ini. Jika seharusnya terdaftar, hubungi admin organisasi untuk memastikan alamat wallet sudah masuk whitelist.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/pemilihan" className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">
              Lihat Daftar Publik
            </Link>
            <Link href="/pemilih/bantuan" className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 hover:bg-slate-50">
              Buka Bantuan
            </Link>
          </div>
        </section>
      </VoterShell>
    )
  }
  const upcomingElections = elections.filter((election) => election.phase === 'registration')
  const pastElections = elections.filter((election) => election.phase === 'ended')
  const onlyPastElections = pastElections.length === elections.length
  const featuredElection = upcomingElections[0]
    ?? elections.find((election) => election.phase === 'commit' && !election.commitProof)
    ?? elections.find((election) => election.phase === 'reveal' && !election.revealProof)
    ?? elections[0]
  const otherElections = elections.filter(e => e.id !== featuredElection.id)
  const logs = getRecentLogs(store)

  const participated = store.elections.filter((election) => election.commitProof || election.revealProof).length
  const pendingReveal = store.elections.filter((election) => getElectionViewState(election).canReveal).length
  const completed = store.elections.filter((election) => election.phase === 'ended').length
  const participationRate = Math.round((participated / store.elections.length) * 100)

  return (
    <VoterShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <section>
          <h1 id="tour-voter-home-title" className="text-[22px] font-semibold text-slate-900 md:text-[24px]">Ruang Voting Saya</h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-6 text-slate-600">
            Pantau ruang voting yang sedang aktif, pilihan yang sudah disimpan, dan langkah berikutnya sampai suaramu selesai dihitung.
          </p>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
        <section className="mt-6">
          <FeaturedHeroCard election={featuredElection} onCountdownZero={refresh} />
        </section>
      </ScrollReveal>

      {upcomingElections.length > 1 || onlyPastElections ? (
        <ScrollReveal variant="fade-up" delay={125} duration={800}>
          <ScheduleStateBanner hasUpcoming={upcomingElections.length > 0} onlyPast={onlyPastElections} upcomingCount={upcomingElections.length} />
        </ScrollReveal>
      ) : null}

      <ScrollReveal variant="fade-up" delay={150} duration={800}>
        <section className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-slate-900">Aktivitas Voting Terkini</h2>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">Pantau komitmen suara, pembukaan fase konfirmasi, dan bukti transaksi yang sudah tersimpan.</p>
            </div>
            <Link href="/pemilih/bukti-saya" className="text-[12px] font-semibold text-slate-700 hover:text-slate-900 sm:text-right">
              Lihat Bukti Digital
            </Link>
          </div>

          <div className="mt-3 grid gap-x-6 gap-y-2 md:grid-cols-2">
          {logs.map((log) => {
            const Icon = logToneIcon[log.tone]

            return (
               <article key={log.id} className="flex min-w-0 items-center justify-between gap-3 text-[12px] text-slate-700">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${logToneClassName[log.tone]}`}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="truncate font-semibold text-slate-900">{log.title}</span>
                  <span className="truncate text-slate-500">- {log.detail}</span>
                </div>
                <Link href="/pemilih/bukti-saya" className="shrink-0 text-slate-600 hover:text-slate-900">Detail</Link>
              </article>
            )
          })}
          {logs.length === 0 && (
            <p className="py-2 text-[13px] italic text-slate-400">Belum ada aktivitas transaksi terekam.</p>
          )}
          </div>
        </section>
      </ScrollReveal>

      {otherElections.length > 0 && (
        <ScrollReveal variant="fade-up" delay={175} duration={800}>
          <section id="daftar-pemilihan-saya" className="mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[20px] font-semibold text-slate-900">Daftar Pemilihan Saya</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-600">{otherElections.length} Pemilihan Lain</span>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherElections.map((election) => (
                <OtherElectionCard key={election.id} election={election} />
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      <StaggerContainer stagger={120} variant="fade-up" className="mt-10 grid gap-6 xl:grid-cols-2">
        <article id="tour-voter-participation-stats" className="rounded-xl border border-slate-100 bg-slate-50 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">Partisipasi Anda</p>

          <div className="mt-5 flex items-end gap-3">
            <p className="text-[40px] font-semibold leading-none tracking-[-0.04em] text-slate-900 sm:text-[48px]">{participationRate}%</p>
          </div>
          <p className="mt-3 max-w-[24ch] text-[14px] leading-6 text-slate-600">Dari total ruang voting yang Anda ikuti tahun ini.</p>
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

        <article className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-[20px] font-semibold text-slate-900 md:text-[24px]">Butuh Bantuan?</h3>
          <p className="mt-3 text-[14px] leading-7 text-slate-800">
            Panduan langkah demi langkah untuk memilih kandidat, menyimpan pilihan, mengonfirmasi suara, hingga melihat hasil dapat dibuka kapan saja.
          </p>
          <Link href="/pemilih/bantuan" className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-slate-900 hover:text-slate-800">
            Buka Pusat Bantuan
            <ExternalLink className="h-4 w-4" />
          </Link>
        </article>
      </StaggerContainer>

      <StaggerContainer stagger={100} variant="fade-up" className="mt-6 grid gap-6 md:grid-cols-3">
         {[
           ['Space diikuti', store.elections.length],
           ['Menunggu konfirmasi', pendingReveal],
           ['Bukti final', completed],
         ].map(([label, value]) => (
           <article key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
             <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">{label}</p>
             <p className="mt-3 text-[24px] font-semibold leading-none text-slate-900">{value}</p>
           </article>
         ))}
       </StaggerContainer>
    </VoterShell>
  )
}
