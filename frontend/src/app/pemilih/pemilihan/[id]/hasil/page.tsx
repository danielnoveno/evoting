'use client'

import { Download, ExternalLink, Trophy, ShieldCheck, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast-provider'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { useQuery } from '@tanstack/react-query'
import { getVoterElectionDetail } from '@/lib/repositories/voterRepository'
import { useElectionContract } from '@/hooks/use-election-contract'
import { useState, useEffect, useMemo } from 'react'
import { basescanTxUrl, formatNumber } from '@/lib/voter-mock-store'

function MetricCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-slate-300 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">{label}</p>
      <p className="mt-3 text-[28px] font-bold leading-none text-slate-950 tracking-tight">{value}</p>
      {subValue ? <p className="mt-2 text-[12px] font-medium text-slate-600 leading-relaxed">{subValue}</p> : null}
    </article>
  )
}

export default function VoterResultPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast()
  
  // 1. Fetch Election Metadata
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['voter-election-detail', params.id],
    queryFn: () => getVoterElectionDetail(params.id)
  })

  const election = detail?.election
  const candidates = detail?.candidates ?? []
  const contractAddress = detail?.spaceAddress ?? undefined

  const { getResults, currentPhase } = useElectionContract(contractAddress)

  // 2. Fetch On-chain Vote Counts
  const { data: onchainResults, isLoading: resultsLoading, refetch: refetchResults } = useQuery({
    queryKey: ['onchain-results', contractAddress],
    queryFn: () => getResults(candidates.length),
    enabled: !!contractAddress && candidates.length > 0 && currentPhase === 3, // Ended phase
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
    return <VoterShell><div className="h-[420px] animate-pulse rounded-xl bg-slate-200" /></VoterShell>
  }

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-[14px] text-slate-800 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Data pemilihan tidak tersedia</h1>
          <Link href="/pemilih" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">
            Kembali ke Beranda
          </Link>
        </section>
      </VoterShell>
    )
  }

  return (
    <VoterShell>
      <VoterStepper
        steps={[
          { label: 'pilih kandidat', done: true },
          { label: 'commit', done: true },
          { label: 'reveal', done: true },
          { label: 'result', active: true },
        ]}
      />

      <section className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Hasil Akhir Pemilihan</h1>
          <p className="mt-1.5 text-[14px] font-medium text-slate-700">{election.title}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button 
            type="button" 
            onClick={() => {
               refetchResults()
               showToast({ tone: 'success', title: 'Data Diperbarui', description: 'Hasil pemilihan telah disinkronkan dengan blockchain.' })
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${resultsLoading ? 'animate-spin' : ''}`} />
            Refresh On-Chain
          </button>
          <button 
            type="button" 
            onClick={() => showToast({ tone: 'info', title: 'Rekap sedang disiapkan', description: 'Fitur download laporan segera hadir.' })} 
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-4 text-[13px] font-semibold text-white hover:bg-[#1E293B] transition-colors"
          >
            <Download className="h-4 w-4" />
            Unduh Rekap Laporan
          </button>
        </div>
      </section>

      {currentPhase !== 3 ? (
        <section className="mt-8 rounded-2xl border-l-4 border-l-amber-500 bg-amber-50 p-6">
           <h2 className="text-[18px] font-bold text-amber-900">Pemilihan Belum Selesai</h2>
           <p className="mt-2 text-[14px] text-amber-800 leading-relaxed">
             Hasil resmi baru akan muncul setelah fase Reveal ditutup oleh Admin. Saat ini Anda melihat data sementara atau kosong.
           </p>
        </section>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Total Suara Terhitung" value={formatNumber(totalVotes)} subValue="Valid on-chain" />
        <MetricCard label="Status Konsensus" value="100% Valid" subValue="Audit blockchain sukses" />
        <MetricCard label="Node Verifikator" value="Base Sepolia" subValue="Penyimpanan terdistribusi" />
      </section>

      {winner && (
        <section className="mt-10 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm md:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex h-40 w-44 shrink-0 items-center justify-center rounded-[40px] bg-[radial-gradient(circle_at_top,_#34d399,_#064e3b)] shadow-lg shadow-emerald-900/10">
               <Trophy className="h-20 w-20 text-emerald-100/30" />
            </div>
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Pemenang Berdasarkan Suara Publik
              </span>
              <h2 className="mt-5 text-[32px] font-bold text-slate-950 md:text-[44px] tracking-tight">{winner.fullName}</h2>
              <p className="mt-2 text-[20px] font-medium text-slate-700">{winner.faculty}</p>
              
              <div className="mt-8 flex flex-wrap items-end gap-5">
                 <p className="text-[56px] font-bold leading-none text-emerald-600 tracking-tighter">
                   {totalVotes > 0 ? ((winner.votes / totalVotes) * 100).toFixed(1) : 0}%
                 </p>
                 <div className="pb-2 text-[18px] font-semibold text-slate-500">
                   {formatNumber(winner.votes)} Suara Sah
                 </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-[20px] font-bold text-slate-900">Perincian Suara Kandidat</h2>
        <div className="mt-6 space-y-4">
          {resultsWithData.map((res) => (
            <article key={res.id} className="rounded-2xl border border-slate-100 bg-white p-5 transition-colors hover:bg-slate-50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800 font-bold">
                  {res.candidateLocalId.split('-').pop()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-[16px] font-bold text-slate-900">{res.fullName}</h3>
                    <p className="text-[16px] font-bold text-slate-950">{formatNumber(res.votes)} Suara</p>
                  </div>
                  <div className="mt-3.5 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${res.votes === winner?.votes && res.votes > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      style={{ width: `${totalVotes > 0 ? (res.votes / totalVotes) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </VoterShell>
  )
}
