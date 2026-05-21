'use client'

import { Download, ExternalLink, Trophy, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast-provider'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import {
  basescanTxUrl,
  findElection,
  formatDateTime,
  formatNumber,
  getElectionResultRows,
  useVoterStore,
} from '@/lib/voter-mock-store'

function MetricCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-slate-300">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">{label}</p>
      <p className="mt-3 text-[28px] font-bold leading-none text-slate-950 tracking-tight">{value}</p>
      {subValue ? <p className="mt-2 text-[12px] font-medium text-slate-600 leading-relaxed">{subValue}</p> : null}
    </article>
  )
}

export default function VoterResultPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast()
  const { store, loading } = useVoterStore()

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-xl bg-slate-200" /></VoterShell>
  }

  const election = findElection(store, params.id)

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-[14px] text-slate-800 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Data pemilihan tidak tersedia</h1>
          <p className="mt-2 leading-7 text-slate-700">Halaman hasil ini tidak menemukan data pemilihan yang diminta.</p>
          <Link 
            href="/pemilih" 
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B] focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none"
            aria-label="Kembali ke Beranda Pemilih"
          >
            Kembali ke Beranda
          </Link>
        </section>
      </VoterShell>
    )
  }

  const resultRows = getElectionResultRows(election)
  const totalVotes = resultRows.reduce((acc, curr) => acc + curr.votes, 0)

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
          {election.revealProof ? (
            <a 
              href={basescanTxUrl(election.revealProof.txHash)} 
              target="_blank" 
              rel="noreferrer" 
              className="mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-blue-700 hover:text-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none rounded"
              aria-label="Lihat bukti transaksi lengkap di Basescan (jendela baru)"
            >
              Lihat bukti di Basescan
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button 
            type="button" 
            onClick={() => showToast({ tone: 'info', title: 'Rekap sedang disiapkan', description: 'Silakan gunakan bukti transaksi di Basescan untuk peninjauan saat ini.' })} 
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:outline-none"
            aria-label="Unduh Rekapitulasi Suara Resmi"
          >
            <Download className="h-4 w-4 text-slate-600" />
            Unduh Rekap
          </button>
          <Link 
            href="/pemilih/bukti-saya" 
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none"
            aria-label="Lihat arsip bukti digital pilihan suara Anda"
          >
            Lihat Bukti Saya
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Suara Sah" value={formatNumber(totalVotes)} />
        <MetricCard 
          label="Tingkat Partisipasi" 
          value={`${election.quorumPercent}%`} 
          subValue={`${formatNumber(election.revealedCount)} dari ${formatNumber(election.totalParticipants)} pemilih`} 
        />
        <MetricCard label="Commit Tercatat" value={formatNumber(election.committedCount)} />
        <MetricCard label="Reveal Sukses" value={formatNumber(election.revealedCount)} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-slate-300">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-800">Perolehan suara kandidat</h2>
          <p className="mt-1 mb-6 text-[13px] text-slate-600">Ringkasan perolehan suara akhir yang dapat ditinjau publik.</p>

          <div className="space-y-4">
            {resultRows.map((candidate, index) => {
              const isWinner = index === 0
              return (
                <div 
                  key={candidate.id} 
                  className={`rounded-xl border p-4 transition-all duration-300 hover:shadow-sm ${
                    isWinner 
                      ? 'border-amber-200 bg-amber-50/20' 
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold ${
                        isWinner ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {candidate.name
                          .split(' ')
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join('')}
                      </div>
                      <div>
                        <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-950">
                          {candidate.name}
                          {isWinner ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                              <Trophy className="h-3 w-3 text-amber-700" />
                              Pemenang
                            </span>
                          ) : null}
                        </h3>
                        <p className="text-[12px] font-medium text-slate-600 mt-0.5">
                          {formatNumber(candidate.votes)} suara
                        </p>
                      </div>
                    </div>
                    <span className={`text-[16px] font-bold ${isWinner ? 'text-amber-900' : 'text-slate-950'}`}>
                      {candidate.percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isWinner 
                            ? 'bg-[#0F172A]' 
                            : 'bg-slate-400'
                        }`} 
                        style={{ width: `${candidate.percentage}%` }} 
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-slate-300">
          <div>
            <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-800">Ringkasan bukti transaksi</h2>
            <p className="mt-1 mb-6 text-[13px] text-slate-600">Jejak transaksi yang dapat Anda cocokkan kembali melalui Basescan.</p>

            {election.revealProof ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-[12px] text-slate-800 space-y-3 shadow-inner">
                {[
                  ['Tx Hash', election.revealProof.txHash],
                  ['Nomor Block', formatNumber(election.revealProof.blockNumber)],
                  ['Gas Terpakai', formatNumber(election.revealProof.gasUsed)],
                  ['Waktu Sinkron', formatDateTime(election.revealProof.createdAt)],
                ].map(([label, value], index, rows) => (
                  <div 
                    key={label} 
                    className={`flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between pb-2.5 ${
                      index < rows.length - 1 ? 'border-b border-slate-200/60' : ''
                    }`}
                  >
                    <span className="font-semibold text-slate-700 select-none uppercase tracking-wider text-[10px] min-w-[100px]">
                      {label}
                    </span>
                    <span className="break-all text-slate-900 font-semibold text-left md:text-right leading-relaxed max-w-full md:max-w-[70%] select-all">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[13px] leading-6 text-slate-700">
                Bukti reveal belum tersedia pada data pemilihan ini.
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[12px] font-medium leading-relaxed text-slate-700">
                Hasil voting ini dilengkapi bukti transaksi yang dapat diperiksa publik untuk mendukung transparansi proses pemungutan suara.
              </p>
            </div>
          </div>
        </article>
      </section>
    </VoterShell>
  )
}
