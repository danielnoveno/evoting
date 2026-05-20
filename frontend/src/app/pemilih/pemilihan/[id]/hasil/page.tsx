'use client'

import { Download, ExternalLink, Trophy } from 'lucide-react'
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
    <article className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{label}</p>
      <p className="mt-2 text-[24px] font-semibold leading-none text-slate-900">{value}</p>
      {subValue ? <p className="mt-1 text-[12px] text-slate-400">{subValue}</p> : null}
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
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-[14px] text-slate-800">
          <h1 className="text-[20px] font-semibold text-slate-900">Data pemilihan tidak tersedia</h1>
          <p className="mt-2 leading-7">Halaman hasil ini tidak menemukan data pemilihan yang diminta.</p>
          <Link href="/pemilih" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">Kembali ke Beranda</Link>
        </section>
      </VoterShell>
    )
  }

  const resultRows = getElectionResultRows(election)
  const winner = resultRows[0]
  const totalVotes = winner?.totalVotes ?? 0

  return (
    <VoterShell>
      <VoterStepper
        steps={[
          { label: 'Terdaftar', done: true },
          { label: 'Commit', done: true },
          { label: 'Reveal', done: true },
          { label: 'Selesai', active: true },
        ]}
      />

      <section className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-slate-900">Hasil Voting</h1>
          <p className="mt-1 text-[14px] text-slate-400">{election.title}</p>
          {election.revealProof ? (
            <a href={basescanTxUrl(election.revealProof.txHash)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-blue-700 hover:text-blue-800">
              Lihat bukti di Basescan
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => showToast({ tone: 'info', title: 'Unduhan belum tersedia', description: 'Rekap hasil masih berupa prototipe frontend.' })} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Unduh Rekap
          </button>
          <Link href="/pemilih/bukti-saya" className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">
            Lihat Bukti Saya
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Suara" value={formatNumber(totalVotes)} />
        <MetricCard label="Partisipasi" value={`${election.quorumPercent}%`} subValue={`${formatNumber(election.revealedCount)} dari ${formatNumber(election.totalParticipants)} pemilih`} />
        <MetricCard label="Commit Tercatat" value={formatNumber(election.committedCount)} />
        <MetricCard label="Reveal Tercatat" value={formatNumber(election.revealedCount)} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Perolehan suara</p>

          <div className="mt-5 space-y-5">
            {resultRows.map((candidate, index) => (
              <div key={candidate.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold ${index === 0 ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-800'}`}>
                      {candidate.name
                        .split(' ')
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                        {index === 0 ? <Trophy className="h-4 w-4 text-amber-600" /> : null}
                        {candidate.name}
                      </p>
                      <p className="text-[12px] text-slate-400">{formatNumber(candidate.votes)} suara</p>
                    </div>
                  </div>
                  <p className="text-[15px] font-semibold text-slate-900">{candidate.percentage.toFixed(1)}%</p>
                </div>
                <div className="mt-3 h-[6px] rounded-full bg-slate-100">
                  <div className={`h-[6px] rounded-full ${index === 0 ? 'bg-[#0F172A]' : 'bg-slate-300'}`} style={{ width: `${candidate.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Ringkasan bukti</p>

          {election.revealProof ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-100">
              {[
                ['Tx Hash', election.revealProof.txHash],
                ['Block', formatNumber(election.revealProof.blockNumber)],
                ['Gas Used', formatNumber(election.revealProof.gasUsed)],
                ['Waktu', formatDateTime(election.revealProof.createdAt)],
              ].map(([label, value], index, rows) => (
                <div key={label} className={`flex flex-col gap-2 px-4 py-3 md:flex-row md:items-start md:justify-between ${index < rows.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <span className="text-[12px] font-semibold text-slate-400">{label}</span>
                  <span className="break-all text-right font-mono text-[11px] leading-6 text-slate-800 md:max-w-[70%]">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4 text-[13px] leading-6 text-slate-400">
              Bukti reveal belum tersedia pada data pemilihan ini.
            </div>
          )}
        </article>
      </section>
    </VoterShell>
  )
}
