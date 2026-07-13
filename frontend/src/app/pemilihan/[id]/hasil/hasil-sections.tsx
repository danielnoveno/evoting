'use client'

import { useState, useEffect } from 'react'
import { Download, ExternalLink, GraduationCap, LockKeyhole, Play, ShieldCheck, Trophy, Youtube, Clock, CheckCircle2, Vote } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PublicElectionBackLink } from '@/components/public/site-shell'
import { ScrollReveal, ParallaxLayer, FloatingShape, StaggerContainer } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'
import { getPublicElectionById, getPublicElectionResults, listLatestAuditLogs } from '@/lib/repositories/electionRepository'
import { shortenHash } from '@/lib/voter-helpers'
import type { PublicElectionPhase } from '@/lib/repositories/types'

function actionLabel(actionType: string) {
  if (actionType === 'reveal_vote') return 'Reveal Suara'
  if (actionType === 'commit_vote') return 'Commit Suara'
  if (actionType === 'deploy_space') return 'Deploy Space'
  if (actionType === 'phase_transition') return 'Perubahan Fase'
  if (actionType === 'whitelist_updated') return 'Update Whitelist'
  if (actionType === 'proposal_submitted') return 'Pengajuan Pemilihan'
  if (actionType === 'proposal_reviewed') return 'Review Pemilihan'
  if (actionType === 'election_status_changed') return 'Status Pemilihan'
  return 'Transaksi'
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) return '0%'
  return `${Math.round(value)}%`
}

function fileSlug(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'pemilihan'
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function reportLink(href: string, label = href) {
  return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
}

function progressWidthClass(value: number) {
  if (value >= 100) return 'w-full'
  if (value >= 90) return 'w-[90%]'
  if (value >= 80) return 'w-[80%]'
  if (value >= 70) return 'w-[70%]'
  if (value >= 60) return 'w-[60%]'
  if (value >= 50) return 'w-[50%]'
  if (value >= 40) return 'w-[40%]'
  if (value >= 30) return 'w-[30%]'
  if (value >= 20) return 'w-[20%]'
  if (value >= 10) return 'w-[10%]'
  if (value > 0) return 'w-[5%]'
  return 'w-[0%]'
}

function resolveCandidateId(candidateLocalId: string, fallbackIndex: number) {
  const match = candidateLocalId.match(/(\d+)$/)
  if (!match) return fallbackIndex + 1
  const parsed = Number(match[1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackIndex + 1
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/* ── Phase Timeline ────────────────────────────────────────────────── */

type PhaseStep = {
  key: string
  label: string
  icon: 'vote' | 'clock' | 'check'
  timestamp: string | null
}

function formatDateTimeShort(iso: string | null): string {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function useCountdown(targetIso: string | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!targetIso) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [targetIso])
  if (!targetIso) return null
  const target = new Date(targetIso).getTime()
  if (!Number.isFinite(target)) return null
  const diff = target - now
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true }
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    expired: false,
  }
}

function PhaseTimeline({
  phase,
  commitStartAt,
  revealStartAt,
  endedAt,
}: {
  phase: PublicElectionPhase
  commitStartAt: string | null
  revealStartAt: string | null
  endedAt: string | null
}) {
  const steps: PhaseStep[] = [
    { key: 'commit', label: 'Pencoblosan', icon: 'vote', timestamp: commitStartAt },
    { key: 'reveal', label: 'Konfirmasi', icon: 'clock', timestamp: revealStartAt },
    { key: 'ended', label: 'Selesai', icon: 'check', timestamp: endedAt },
  ]

  const phaseOrder: PublicElectionPhase[] = ['registration', 'commit', 'reveal', 'ended']
  const activeIndex = phaseOrder.indexOf(phase)
  const commitIndex = 0
  const revealIndex = 1
  const endedIndex = 2

  const nextPhase = phase === 'commit' ? 'reveal' : phase === 'reveal' ? 'ended' : null
  const nextDeadline = nextPhase === 'reveal' ? revealStartAt : nextPhase === 'ended' ? endedAt : null
  const countdown = useCountdown(nextDeadline)

  const isActive = (index: number) => {
    if (phase === 'commit') return index === commitIndex
    if (phase === 'reveal') return index === revealIndex
    if (phase === 'ended') return index === endedIndex
    return index === commitIndex
  }
  const isDone = (index: number) => {
    if (phase === 'ended') return true
    if (phase === 'reveal') return index <= commitIndex
    return false
  }
  const isPending = (index: number) => !isActive(index) && !isDone(index)

  return (
    <article className="public-card p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold uppercase tracking-[0.06em] text-slate-500">Jadwal Fase</h3>
        {countdown && !countdown.expired && (
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-[13px] font-semibold text-blue-700">
              {countdown.hours > 0 ? `${countdown.hours}j ` : ''}{countdown.minutes}m {countdown.seconds}s
            </span>
            <span className="text-[12px] text-blue-500">lagi</span>
          </div>
        )}
      </div>

      {/* Timeline steps */}
      <div className="mt-6 flex items-start gap-0">
        {steps.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-start">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                isActive(i)
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200'
                  : isDone(i)
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 bg-white text-slate-400'
              }`}>
                {isDone(i) ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : step.icon === 'vote' ? (
                  <Vote className="h-5 w-5" />
                ) : step.icon === 'clock' ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={`mt-0.5 h-1 w-full min-w-[40px] rounded-full ${
                  isDone(i) ? 'bg-emerald-400' : isActive(i) ? 'bg-gradient-to-r from-blue-400 to-slate-200' : 'bg-slate-200'
                }`} />
              )}
            </div>

            {/* Label + timestamp */}
            <div className="ml-3 min-w-0 pb-6">
              <div className="flex items-center gap-2">
                <p className={`text-[14px] font-semibold ${isActive(i) ? 'text-blue-700' : isDone(i) ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                {isActive(i) && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-slate-400">{formatDateTimeShort(step.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}

export function HasilSections({ id }: { id: string }) {
  const { showToast } = useToast()
  const electionQuery = useQuery({
    queryKey: ['public', 'election-detail', id],
    queryFn: () => getPublicElectionById(id),
    retry: false,
    staleTime: 0,
  })
  const election = electionQuery.data
  const auditQuery = useQuery({
    queryKey: ['public', 'election-audit', id, election?.deployedSpaceAddress],
    queryFn: () => listLatestAuditLogs(id, 8, election?.deployedSpaceAddress),
    enabled: !electionQuery.isLoading,
    retry: false,
  })
  const resultQuery = useQuery({
    queryKey: ['public', 'election-results', election?.deployedSpaceAddress],
    queryFn: () => getPublicElectionResults(election?.deployedSpaceAddress),
    enabled: Boolean(election?.deployedSpaceAddress),
    retry: false,
  })
  const logs = auditQuery.data ?? []
  const indexerResult = resultQuery.data
  const candidateResults = new Map((indexerResult?.candidateResults ?? []).map((result) => [result.candidateId, result]))
  const totalRevealed = indexerResult?.totalRevealed ?? 0
  const hasIndexerResult = Boolean(indexerResult)
  const winner = hasIndexerResult
    ? (election?.candidates ?? []).reduce<{
        name: string
        voteCount: number
        percentage: number
        avatarPath: string | null
      } | null>((currentWinner, candidate, index) => {
        const candidateId = resolveCandidateId(candidate.candidateLocalId, index)
        const voteCount = candidateResults.get(candidateId)?.voteCount ?? 0
        const percentage = totalRevealed > 0 ? (voteCount / totalRevealed) * 100 : 0
        if (voteCount > 0 && (!currentWinner || voteCount > currentWinner.voteCount)) {
          return { name: candidate.fullName, voteCount, percentage, avatarPath: candidate.avatarPath }
        }
        return currentWinner
      }, null)
    : null
  const participation = election?.participantCount && election.participantCount > 0
    ? Math.min(100, (totalRevealed / election.participantCount) * 100)
    : 0

  const downloadReport = () => {
    if (!election) {
      showToast({ tone: 'error', title: 'Laporan belum siap', description: 'Data pemilihan belum berhasil dimuat.' })
      return
    }

    const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })
    const contractUrl = election.deployedSpaceAddress ? `https://sepolia.basescan.org/address/${election.deployedSpaceAddress}` : null
    const deployUrl = election.deploymentTxHash ? `https://sepolia.basescan.org/tx/${election.deploymentTxHash}` : null
    const summaryRows = [
      ['ID Pemilihan', election.id],
      ['Organisasi', election.organizationName ?? '-'],
      ['Fase Saat Ini', election.phaseLabel],
      ['Total Pemilih Terdaftar', election.participantCount],
      ['Total Commit Terindeks', hasIndexerResult ? (indexerResult?.totalCommitted ?? 0) : 'Belum tersedia'],
      ['Total Reveal Terindeks', hasIndexerResult ? totalRevealed : 'Belum tersedia'],
      ['Partisipasi Reveal', hasIndexerResult ? formatPercentage(participation) : 'Menunggu indexer'],
      ['Alamat Kontrak', election.deployedSpaceAddress ?? 'Belum tersedia'],
    ]
    const candidateRows = election.candidates.map((candidate, index) => {
      const candidateId = resolveCandidateId(candidate.candidateLocalId, index)
      const result = candidateResults.get(candidateId)
      const voteCount = result?.voteCount ?? 0
      const percentage = totalRevealed > 0 ? (voteCount / totalRevealed) * 100 : 0
      return [
        candidateId,
        candidate.fullName,
        hasIndexerResult ? voteCount : 'Belum tersedia',
        hasIndexerResult ? `${percentage.toFixed(1)}%` : 'Menunggu indexer',
        result?.lastRevealTx ?? '-',
        result?.lastUpdatedBlock ?? '-',
      ]
    })

    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) {
      showToast({ tone: 'error', title: 'Gagal membuka laporan', description: 'Izinkan pop-up browser untuk menyimpan laporan sebagai PDF.' })
      return
    }

    popup.document.write(`<!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>laporan-${escapeHtml(fileSlug(election.title))}</title>
          <style>
            @page { size: A4; margin: 18mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #0f172a; font-family: Arial, sans-serif; line-height: 1.5; }
            header { border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 22px; }
            h1 { margin: 0; font-size: 28px; line-height: 1.15; letter-spacing: -0.02em; }
            h2 { margin: 24px 0 10px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.06em; }
            p { margin: 8px 0; color: #334155; }
            .badge { display: inline-block; margin-bottom: 10px; border: 1px solid #cbd5e1; border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 700; color: #334155; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
            .metric { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
            .metric b { display: block; font-size: 22px; }
            .metric span { color: #64748b; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; word-break: break-word; }
            th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
            a { color: #1d4ed8; text-decoration: none; }
            .note { border: 1px solid #fde68a; background: #fffbeb; border-radius: 12px; padding: 12px; color: #713f12; }
            .muted { color: #64748b; font-size: 12px; }
            .print { margin-top: 24px; }
            @media print { .print { display: none; } }
          </style>
        </head>
        <body>
          <header>
            <span class="badge">Laporan Hasil Pemilihan</span>
            <h1>${escapeHtml(election.title)}</h1>
            <p>Laporan ini merangkum data pemilihan, perolehan suara terindeks, dan bukti transaksi yang tersedia pada halaman publik VoteChain.</p>
            <p class="muted">Dicetak pada ${escapeHtml(printedAt)} · Base Sepolia Testnet</p>
          </header>

          <section class="grid">
            <div class="metric"><b>${escapeHtml(election.participantCount)}</b><span>Pemilih terdaftar</span></div>
            <div class="metric"><b>${escapeHtml(hasIndexerResult ? totalRevealed : '—')}</b><span>Reveal terindeks</span></div>
            <div class="metric"><b>${escapeHtml(hasIndexerResult ? formatPercentage(participation) : '—')}</b><span>Partisipasi reveal</span></div>
          </section>

          <section>
            <h2>Ringkasan Pemilihan</h2>
            <table><tbody>${summaryRows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
              ${contractUrl ? `<tr><th>Basescan Kontrak</th><td>${reportLink(contractUrl)}</td></tr>` : ''}
              ${deployUrl ? `<tr><th>Basescan Deploy</th><td>${reportLink(deployUrl)}</td></tr>` : ''}
            </tbody></table>
          </section>

          <section>
            <h2>Perolehan Suara Kandidat</h2>
            <table>
              <thead><tr><th>No.</th><th>Nama Kandidat</th><th>Suara</th><th>Persentase</th><th>Tx Reveal Terakhir</th><th>Block</th></tr></thead>
              <tbody>${candidateRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="6">Belum ada kandidat.</td></tr>'}</tbody>
            </table>
          </section>

          <section>
            <h2>Bukti Transaksi Terbaru</h2>
            <table>
              <thead><tr><th>Waktu</th><th>Aksi</th><th>Tx Hash</th><th>Block</th><th>Sumber</th><th>Basescan</th></tr></thead>
              <tbody>${logs.map((log) => `<tr><td>${escapeHtml(formatTime(log.createdAt))}</td><td>${escapeHtml(actionLabel(log.actionType))}</td><td>${escapeHtml(log.txHash)}</td><td>${escapeHtml(log.blockNumber ?? '-')}</td><td>${escapeHtml(log.source)}</td><td>${reportLink(`https://sepolia.basescan.org/tx/${log.txHash}`, 'Lihat transaksi')}</td></tr>`).join('') || '<tr><td colspan="6">Belum ada transaksi commit/reveal yang tersedia.</td></tr>'}</tbody>
            </table>
          </section>

          <section>
            <h2>Catatan Audit</h2>
            <p class="note">${escapeHtml(hasIndexerResult ? 'Angka suara pada laporan ini berasal dari event reveal yang berhasil terindeks. Verifikasi publik dapat dilakukan melalui tautan Basescan yang tersedia.' : 'Hasil suara belum tersedia karena indexer belum mengembalikan data. Laporan ini tidak mengisi angka palsu dan hanya menampilkan bukti yang tersedia.')}</p>
          </section>

          <button class="print" onclick="window.print()">Simpan / Cetak PDF</button>
          <script>window.addEventListener('load', () => setTimeout(() => window.print(), 300))</script>
        </body>
      </html>`)
    popup.document.close()
    showToast({ tone: 'success', title: 'Laporan PDF dibuka', description: 'Pilih “Save as PDF” atau “Simpan sebagai PDF” pada dialog cetak browser.' })
  }

  return (
    <section className="public-section relative overflow-hidden">
      {/* Decorative floating shapes */}
      <FloatingShape
        speed={-0.03}
        className="left-[-120px] top-[100px] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-indigo-100/30 to-blue-50/20 blur-3xl"
      />
      <FloatingShape
        speed={0.05}
        className="right-[-80px] top-[500px] h-[250px] w-[250px] rounded-full bg-gradient-to-tl from-purple-50/30 to-slate-100/20 blur-3xl"
      />
      
      <div className="public-container relative max-w-none">
        {/* Header Section */}
        <ParallaxLayer speed={0.06}>
          <ScrollReveal variant="fade-up" duration={800}>
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-[860px]">
                <PublicElectionBackLink />
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Ringkasan Audit</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">{election?.phaseLabel ?? 'Memuat'}</span>
                </div>
                <h1 className="mt-6 text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[64px]">{election?.title ?? 'Data pemilihan tidak tersedia'}</h1>
                <p className="mt-5 max-w-[760px] text-[18px] leading-9 text-slate-800">
                  {election ? 'Halaman ini menampilkan data pemilihan dari Supabase, hasil reveal dari indexer Ponder jika tersedia, dan bukti transaksi Base Sepolia.' : 'Belum ada data Supabase untuk ID pemilihan ini.'}
                </p>
              </div>
              <button type="button" onClick={downloadReport} disabled={electionQuery.isLoading} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60">
                <Download className="h-4 w-4" />
                Unduh Laporan
              </button>
            </div>
          </ScrollReveal>
        </ParallaxLayer>

        {/* Phase Timeline */}
        {election && (
          <ScrollReveal variant="fade-up" delay={100} duration={700}>
            <div className="mt-8">
              <PhaseTimeline
                phase={election.phase}
                commitStartAt={election.commitStartAt}
                revealStartAt={election.revealStartAt}
                endedAt={election.endedAt}
              />
            </div>
          </ScrollReveal>
        )}

        {/* Dashboard Cards Section */}
        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.72fr)]">
          {/* Main Winner Card */}
          <ScrollReveal variant="fade-right" delay={150} duration={800}>
            <article className="public-card h-full p-6 md:p-8">
              <div className="grid gap-8 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                <div className="mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[48px] font-semibold text-slate-400">
                  {winner?.avatarPath ? (
                    <img src={winner.avatarPath} alt={winner.name} className="h-full w-full object-cover" />
                  ) : (
                    '?'
                  )}
                </div>
                <div>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-slate-500">{hasIndexerResult && totalRevealed > 0 ? 'Hasil akhir' : 'Hasil belum tersedia'}</span>
                  <h2 className="mt-5 text-[28px] font-semibold leading-tight text-slate-900 md:text-[36px]">
                    {winner && winner.voteCount > 0 ? winner.name : 'Belum ada data reveal terindeks'}
                  </h2>
                  <p className="mt-3 text-[18px] text-slate-800">
                    {hasIndexerResult ? 'Perolehan suara dihitung dari event Reveal yang berhasil terindeks.' : 'Kandidat dan transaksi diambil dari tabel Supabase. Perolehan suara tidak akan diisi dengan angka palsu.'}
                  </p>
                  <div className="mt-8 flex flex-wrap items-end gap-4">
                    <p className="text-[56px] font-semibold leading-none tracking-[-0.04em] text-slate-900 md:text-[72px]">{formatPercentage(winner?.percentage ?? 0)}</p>
                    <p className="pb-2 text-[18px] text-slate-800">{hasIndexerResult ? 'dari suara reveal terverifikasi' : 'menunggu data reveal terindeks'}</p>
                  </div>
                  <div className="mt-8 flex gap-10">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total Suara</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">{hasIndexerResult ? totalRevealed : 'Belum tersedia'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Kandidat</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">{election?.candidates.length ?? 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </ScrollReveal>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <ScrollReveal variant="fade-left" delay={250} duration={700}>
              <article className="public-flat-card p-6">
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Suara Reveal Terindeks</p>
                <p className="mt-3 text-[48px] font-semibold leading-none tracking-[-0.04em] text-slate-900">{hasIndexerResult ? totalRevealed : 0}</p>
                <div className="mt-6 h-2 rounded-full bg-slate-200">
                  <div className={`h-2 rounded-full bg-black ${progressWidthClass(participation)}`} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[14px] text-slate-800">
                  <span>{hasIndexerResult ? `Partisipasi ${formatPercentage(participation)}` : 'Partisipasi menunggu indexer'}</span>
                  <span>Whitelist: {election?.participantCount ?? 0}</span>
                </div>
              </article>
            </ScrollReveal>

            <ScrollReveal variant="fade-left" delay={350} duration={700}>
              <article className="public-card p-6">
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Distribusi Suara</p>
                <div className="mt-6 space-y-5 text-[16px] text-slate-900">
                  {(election?.candidates ?? []).map((candidate, index) => {
                    const candidateId = resolveCandidateId(candidate.candidateLocalId, index)
                    const voteCount = candidateResults.get(candidateId)?.voteCount ?? 0
                    const percentage = totalRevealed > 0 ? (voteCount / totalRevealed) * 100 : 0
                    return (
                    <div key={candidate.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           {candidate.avatarPath && (
                            <img src={candidate.avatarPath} alt="" className="h-6 w-6 rounded-full object-cover" />
                           )}
                           <span>{candidate.fullName}</span>
                        </div>
                        <span>{hasIndexerResult ? `${voteCount} suara · ${formatPercentage(percentage)}` : 'Menunggu indexer'}</span>
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-slate-200">
                        <div className={`h-3 rounded-full ${progressWidthClass(percentage)} ${index === 0 ? 'bg-black' : index === 1 ? 'bg-slate-500' : 'bg-slate-400'}`} />
                      </div>
                    </div>
                    )
                  })}
                  {!electionQuery.isLoading && (!election || election.candidates.length === 0) ? (
                    <p className="text-[14px] leading-7 text-slate-500">Belum ada kandidat dari Supabase untuk pemilihan ini.</p>
                  ) : null}
                </div>
              </article>
            </ScrollReveal>
          </div>
        </div>

        {/* Candidate Detail Profiles */}
        {election && election.candidates.length > 0 ? (
          <ScrollReveal variant="fade-up" delay={100} duration={800}>
            <section className="mt-10">
              <h2 className="text-[32px] font-semibold text-slate-900">Profil Kandidat</h2>
              <p className="mt-3 text-[16px] leading-8 text-slate-800">Informasi lengkap setiap kandidat yang berpartisipasi dalam pemilihan ini.</p>

              <StaggerContainer stagger={200} variant="fade-up" duration={700} className="mt-8 space-y-6">
                {election.candidates
                  .slice()
                  .sort((a, b) => {
                    const aId = resolveCandidateId(a.candidateLocalId, election.candidates.indexOf(a))
                    const bId = resolveCandidateId(b.candidateLocalId, election.candidates.indexOf(b))
                    const aVotes = candidateResults.get(aId)?.voteCount ?? 0
                    const bVotes = candidateResults.get(bId)?.voteCount ?? 0
                    return bVotes - aVotes
                  })
                  .map((candidate, displayIndex) => {
                    const candidateId = resolveCandidateId(candidate.candidateLocalId, displayIndex)
                    const voteCount = candidateResults.get(candidateId)?.voteCount ?? 0
                    const percentage = totalRevealed > 0 ? (voteCount / totalRevealed) * 100 : 0
                    const isWinner = winner?.name === candidate.fullName && voteCount > 0
                    const youtubeId = candidate.youtubeUrl ? extractYouTubeId(candidate.youtubeUrl) : null

                    return (
                      <article key={candidate.id} className={`public-card overflow-hidden ${isWinner ? 'border-amber-200 ring-1 ring-amber-100' : ''}`}>
                        {/* Top: Photo + Identity + Vote summary */}
                        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:p-8">
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                              {candidate.avatarPath ? (
                                <img src={candidate.avatarPath} alt={candidate.fullName} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-[32px] font-bold text-slate-400">
                                  {candidate.fullName.split(' ').slice(0, 2).map((part) => part[0]).join('')}
                                </span>
                              )}
                            </div>
                            {isWinner && (
                              <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm">
                                <Trophy className="h-4 w-4" />
                              </div>
                            )}
                            <div className="mt-3 text-center text-[13px] font-semibold text-slate-500">No. Urut {candidateId}</div>
                          </div>

                          {/* Info + Vote */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h3 className="text-[24px] font-semibold text-slate-900">{candidate.fullName}</h3>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-slate-500">
                                  {candidate.studentId && (
                                    <span className="inline-flex items-center gap-1">
                                      <GraduationCap className="h-3.5 w-3.5" />
                                      NPM {candidate.studentId}
                                    </span>
                                  )}
                                  {candidate.faculty && (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-600">
                                      {candidate.faculty}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[36px] font-semibold leading-none tracking-[-0.03em] text-slate-900">{formatPercentage(percentage)}</p>
                                <p className="mt-1 text-[14px] text-slate-500">{hasIndexerResult ? `${voteCount} suara` : 'Menunggu data'}</p>
                              </div>
                            </div>

                            {/* Bio */}
                            {candidate.bio ? (
                              <p className="mt-5 text-[15px] leading-8 text-slate-700">{candidate.bio}</p>
                            ) : null}
                          </div>
                        </div>

                        {/* YouTube Embed */}
                        {youtubeId && (
                          <div className="border-t border-slate-100 px-6 py-5 md:px-8">
                            <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                              <Youtube className="h-4 w-4" />
                              Video Profil
                            </div>
                            <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
                              <iframe
                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                title={`Video profil ${candidate.fullName}`}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}

                        {/* Vision + Mission */}
                        {(candidate.vision || candidate.mission.length > 0) ? (
                          <div className="border-t border-slate-100 px-6 py-5 md:px-8">
                            <div className="grid gap-6 md:grid-cols-2">
                              {/* Vision */}
                              {candidate.vision ? (
                                <div>
                                  <h4 className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-800">Visi</h4>
                                  <p className="mt-3 text-[15px] leading-8 text-slate-700">{candidate.vision}</p>
                                </div>
                              ) : null}

                              {/* Mission */}
                              {candidate.mission.length > 0 ? (
                                <div>
                                  <h4 className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-800">Misi</h4>
                                  <ul className="mt-3 space-y-2">
                                    {candidate.mission.map((item, mi) => (
                                      <li key={mi} className="flex gap-3 text-[15px] leading-7 text-slate-700">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        {/* Vote bar footer */}
                        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 md:px-8">
                          <div className="flex items-center justify-between text-[13px] text-slate-500">
                            <span>{hasIndexerResult ? `${voteCount} suara terverifikasi` : 'Menunggu data reveal'}</span>
                            <span className="font-semibold text-slate-900">{formatPercentage(percentage)}</span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-slate-200">
                            <div
                              className={`h-2 rounded-full transition-all duration-1000 ${isWinner ? 'bg-amber-400' : 'bg-slate-400'}`}
                              style={{ width: `${Math.max(percentage, 0)}%` }}
                            />
                          </div>
                        </div>
                      </article>
                    )
                  })}
              </StaggerContainer>
            </section>
          </ScrollReveal>
        ) : null}

        {/* Audit Trail Section */}
        <ScrollReveal variant="fade-up" delay={200} duration={800}>
          <section className="mt-10 public-flat-card p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[32px] font-semibold text-slate-900">Bukti Transaksi</h2>
                <p className="mt-3 text-[16px] leading-8 text-slate-800">Transaksi ditampilkan dari indexer Ponder jika tersedia; jika endpoint belum aktif, sistem memakai tabel audit Supabase sebagai cadangan.</p>
              </div>
              <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="hidden items-center gap-2 text-[14px] font-medium text-slate-900 md:inline-flex">
                Lihat Semua
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <StaggerContainer stagger={120} variant="fade-up" duration={700} className="mt-8 space-y-4">
              {logs.map((log) => (
                <article key={log.id} className="public-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                      {log.actionType === 'reveal_vote' ? <ShieldCheck className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-[18px] font-semibold text-slate-900">{actionLabel(log.actionType)}</p>
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Sukses</span>
                      </div>
                      <p className="mt-1 font-mono text-[13px] text-slate-800">Tx : {shortenHash(log.txHash)} · {log.source === 'ponder' ? 'Ponder' : 'Supabase'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 md:justify-end">
                    <span className="text-[14px] text-slate-500">{formatTime(log.createdAt)}</span>
                    <a href={`https://sepolia.basescan.org/tx/${log.txHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-slate-900">
                      Lihat di Basescan
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
              {!auditQuery.isLoading && logs.length === 0 ? (
                <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-[14px] leading-7 text-slate-500">
                  Belum ada transaksi commit/reveal untuk pemilihan ini. Deployment mungkin tersedia di audit sistem, tetapi hasil belum dapat diverifikasi tanpa bukti reveal.
                </article>
              ) : null}
            </StaggerContainer>

            <div className="mt-8 flex justify-center">
              <button type="button" className="inline-flex h-11 items-center justify-center px-5 text-[14px] font-semibold uppercase tracking-[0.04em] text-slate-700 hover:text-slate-900">
                Muat Lebih Banyak Transaksi
              </button>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </section>
  )
}
