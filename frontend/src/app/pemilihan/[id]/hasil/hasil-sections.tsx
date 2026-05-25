'use client'

import { Download, ExternalLink, RefreshCw, Trophy, ShieldCheck, LockKeyhole } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getVoterElectionDetail } from '@/lib/repositories/voterRepository'
import { useElectionContract } from '@/hooks/use-election-contract'
import { useAuditLogs } from '@/hooks/use-audit-logs'
import { useMemo } from 'react'
import { formatNumber } from '@/lib/voter-mock-store'
import { PublicElectionBackLink } from '@/components/public/site-shell'
import { ScrollReveal, ParallaxLayer, FloatingShape, StaggerContainer } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'

export function HasilSections({ id }: { id: string }) {
  const { showToast } = useToast()

  // 1. Fetch Metadata
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['voter-election-detail', id],
    queryFn: () => getVoterElectionDetail(id)
  })

  const election = detail?.election
  const candidates = detail?.candidates ?? []
  const contractAddress = detail?.spaceAddress ?? undefined

  const { getResults, currentPhase } = useElectionContract(contractAddress)
  const auditLogsQuery = useAuditLogs(id)

  // 2. Fetch On-chain Results
  const { data: onchainResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['onchain-results-public', contractAddress],
    queryFn: () => getResults(candidates.length),
    enabled: !!contractAddress && candidates.length > 0 && currentPhase === 3,
  })

  const resultsWithData = useMemo(() => {
    return candidates.map(c => {
      const candidateNum = parseInt(c.candidateLocalId.split('-').pop() || '1')
      const votes = onchainResults?.find(r => r.candidateId === candidateNum)?.votes ?? 0
      return {
        ...c,
        votes
      }
    }).sort((a, b) => b.votes - a.votes)
  }, [candidates, onchainResults])

  const totalVotes = resultsWithData.reduce((acc, curr) => acc + curr.votes, 0)
  const winner = resultsWithData[0]?.votes > 0 ? resultsWithData[0] : null

  if (detailLoading) {
    return <div className="h-[600px] flex items-center justify-center"><RefreshCw className="animate-spin h-10 w-10 text-slate-300" /></div>
  }

  if (!election) {
    return <div className="p-20 text-center text-slate-500">Pemilihan tidak ditemukan.</div>
  }

  return (
    <section className="public-section relative overflow-hidden">
      <FloatingShape
        speed={-0.03}
        className="left-[-120px] top-[100px] h-[300px] w-[300px] rounded-full bg-gradient-to-br from-indigo-100/30 to-blue-50/20 blur-3xl"
      />
      
      <div className="public-container relative">
        <ParallaxLayer speed={0.06}>
          <ScrollReveal variant="fade-up" duration={800}>
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-[860px]">
                <PublicElectionBackLink />
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Hasil On-Chain</span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">
                    {currentPhase === 3 ? 'Selesai' : 'Berlangsung'}
                  </span>
                </div>
                <h1 className="mt-6 text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[64px]">{election.title}</h1>
              </div>
              <button 
                type="button" 
                onClick={() => showToast({ tone: 'info', title: 'Laporan Audit', description: 'Fitur download PDF segera hadir.' })}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200"
              >
                <Download className="h-4 w-4" />
                Unduh Laporan
              </button>
            </div>
          </ScrollReveal>
        </ParallaxLayer>

        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.72fr)]">
          {/* Main Winner Card */}
          <ScrollReveal variant="fade-right" delay={150} duration={800}>
            <article className="public-card h-full p-6 md:p-8">
              {winner ? (
                <div className="grid gap-8 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                  <div className="mx-auto h-44 w-44 rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#064e3b)] flex items-center justify-center shadow-inner">
                     <Trophy className="h-20 w-20 text-emerald-200/40" />
                  </div>
                  <div>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] uppercase tracking-[0.06em] text-slate-500">
                       Pemenang Berdasarkan Suara Blockchain
                    </span>
                    <h2 className="mt-5 text-[28px] font-semibold leading-tight text-slate-900 md:text-[36px]">{winner.fullName}</h2>
                    <p className="mt-3 text-[18px] text-slate-800">{winner.faculty}</p>
                    <div className="mt-8 flex flex-wrap items-end gap-4">
                      <p className="text-[56px] font-semibold leading-none tracking-[-0.04em] text-emerald-600 md:text-[72px]">
                         {totalVotes > 0 ? ((winner.votes / totalVotes) * 100).toFixed(1) : 0}%
                      </p>
                      <p className="pb-2 text-[18px] text-slate-800">perolehan suara</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-10">
                   <LockKeyhole className="h-16 w-16 text-slate-200 mb-6" />
                   <h2 className="text-[20px] font-semibold text-slate-900">Hasil Belum Tersedia</h2>
                   <p className="mt-2 text-slate-500">Hasil pemilihan akan muncul setelah fase Reveal selesai.</p>
                </div>
              )}
            </article>
          </ScrollReveal>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <ScrollReveal variant="fade-left" delay={250} duration={700}>
              <article className="public-flat-card p-6">
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total Suara Terverifikasi</p>
                <p className="mt-3 text-[48px] font-semibold leading-none tracking-[-0.04em] text-slate-900">{formatNumber(totalVotes)}</p>
                <div className="mt-6 h-2 rounded-full bg-slate-200">
                  <div className="h-2 w-full rounded-full bg-black opacity-10" />
                </div>
              </article>
            </ScrollReveal>

            <ScrollReveal variant="fade-left" delay={350} duration={700}>
              <article className="public-card p-6">
                <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Distribusi Suara</p>
                <div className="mt-6 space-y-5 text-[16px] text-slate-900">
                  {resultsWithData.map((res, index) => (
                    <div key={res.id}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">#{res.candidateLocalId.split('-').pop()} {res.fullName}</span>
                        <span className="font-bold">{totalVotes > 0 ? ((res.votes / totalVotes) * 100).toFixed(0) : 0}%</span>
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-slate-100">
                        <div 
                          className={`h-3 rounded-full transition-all duration-1000 ${index === 0 && res.votes > 0 ? 'bg-black' : 'bg-slate-400'}`} 
                          style={{ width: `${totalVotes > 0 ? (res.votes / totalVotes) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
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
                <p className="mt-3 text-[16px] leading-8 text-slate-800">Semua aktivitas dicatat secara publik pada jaringan Base Sepolia.</p>
              </div>
            </div>

            <StaggerContainer stagger={120} variant="fade-up" duration={700} className="mt-8 space-y-4">
              {(auditLogsQuery.data ?? []).slice(0, 10).map((log) => (
                <article key={log.id} className="public-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                      {log.actionType === 'reveal_vote' ? <ShieldCheck className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-[18px] font-semibold text-slate-900">
                          {log.actionType === 'reveal_vote' ? 'Vote Confirmed' : 'Vote Committed'}
                        </p>
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Terverifikasi</span>
                      </div>
                      <p className="mt-1 font-mono text-[13px] text-slate-500">Wallet: {log.walletAddress.slice(0, 8)}...{log.walletAddress.slice(-6)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 md:justify-end">
                    <span className="text-[14px] text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <a href={`https://sepolia.basescan.org/tx/${log.txHash}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-slate-900">
                      Lihat Tx
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
            </StaggerContainer>
          </section>
        </ScrollReveal>
      </div>
    </section>
  )
}
