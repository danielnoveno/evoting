'use client'

import { Download, ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PublicElectionBackLink } from '@/components/public/site-shell'
import { ScrollReveal, ParallaxLayer, FloatingShape, StaggerContainer } from '@/components/public/parallax'
import { getPublicElectionById, getPublicElectionResults, listLatestAuditLogs } from '@/lib/repositories/electionRepository'
import { shortenHash } from '@/lib/voter-helpers'

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

export function HasilSections({ id }: { id: string }) {
  const electionQuery = useQuery({
    queryKey: ['public', 'election-detail', id],
    queryFn: () => getPublicElectionById(id),
    retry: false,
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
      
      <div className="public-container relative">
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
              <button type="button" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
                <Download className="h-4 w-4" />
                Unduh Laporan
              </button>
            </div>
          </ScrollReveal>
        </ParallaxLayer>

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
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-slate-500">Hasil akhir</span>
                  <h2 className="mt-5 text-[28px] font-semibold leading-tight text-slate-900 md:text-[36px]">
                    {winner && winner.voteCount > 0 ? winner.name : 'Belum ada data hasil dari indexer'}
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
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total Suara Terverifikasi</p>
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

        {/* Audit Trail Section */}
        <ScrollReveal variant="fade-up" delay={200} duration={800}>
          <section className="mt-10 public-flat-card p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[32px] font-semibold text-slate-900">Jejak Audit Blockchain</h2>
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
                  Belum ada transaksi audit untuk pemilihan ini. Data akan tampil setelah transaksi nyata tercatat dari frontend/on-chain.
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
