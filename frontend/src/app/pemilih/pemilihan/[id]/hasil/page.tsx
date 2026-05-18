'use client'

import { Download, ExternalLink, Info, ShieldCheck, Star } from 'lucide-react'
import Link from 'next/link'
import { ScrollReveal } from '@/components/public/parallax'
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

export default function VoterResultPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast()
  const { store, loading } = useVoterStore()

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-[32px] bg-slate-200" /></VoterShell>
  }

  const election = findElection(store, params.id)

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 text-[15px] text-slate-600">
          <h1 className="text-[28px] font-semibold text-slate-900 sm:text-[32px]">Data pemilihan tidak tersedia</h1>
          <p className="mt-3 leading-8">Halaman hasil ini tidak menemukan data pemilihan yang diminta pada mode dummy saat ini.</p>
          <Link href="/pemilih" className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white">Kembali ke Beranda</Link>
        </section>
      </VoterShell>
    )
  }

  const resultRows = getElectionResultRows(election)
  const winner = resultRows[0]

  return (
    <VoterShell>
      <section>
        <VoterStepper
          steps={[
            { number: 1, label: 'Commit', done: true },
            { number: 2, label: 'Konfirmasi', done: true },
            { number: 3, label: 'Reveal', done: true },
            { number: 4, label: 'Result', active: true },
          ]}
        />
      </section>

      <ScrollReveal variant="fade-up" duration={800}>
      <section className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <span className="inline-flex rounded-full bg-amber-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">Laporan publik</span>
          <h1 className="mt-5 text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[42px] md:text-[56px]">Hasil Akhir & Rekapitulasi Suara</h1>
          <p className="mt-4 text-[16px] leading-8 text-slate-600 md:text-[18px] md:leading-9">Transparansi penuh hasil pemilihan yang telah divalidasi melalui alur commit-reveal.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => showToast({ tone: 'info', title: 'Sertifikat sedang disiapkan', description: 'Unduhan bukti hasil masih berupa simulasi frontend.' })} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-[14px] font-medium text-slate-900 hover:bg-slate-200 sm:w-auto">
            <Download className="h-4 w-4" />
            Unduh Sertifikat
          </button>
          {election.revealProof ? (
            <a href={basescanTxUrl(election.revealProof.txHash)} target="_blank" rel="noreferrer" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[14px] font-medium text-white hover:bg-slate-900 sm:w-auto">
              <ExternalLink className="h-4 w-4" />
              Lihat di Basescan
            </a>
          ) : null}
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.98fr)]">
        <article className="rounded-[32px] border border-slate-100 bg-white p-6 sm:p-8">
          <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
            <div className="rounded-[28px] bg-[radial-gradient(circle_at_top,_#374151,_#111827)] px-6 py-8 text-center text-[56px] font-semibold tracking-[-0.05em] text-white sm:px-8 sm:py-10 sm:text-[72px]">
              {winner.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Pemenang terpilih</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h2 className="text-[24px] font-semibold text-slate-900 sm:text-[28px] md:text-[44px]">{winner.name}</h2>
                <Star className="h-6 w-6 text-slate-300" />
              </div>
              <p className="mt-2 text-[16px] leading-8 text-slate-600 md:text-[18px]">{winner.faculty}</p>

              <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total suara</p>
                  <p className="mt-3 text-[22px] font-semibold text-slate-900">{formatNumber(winner.votes)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Persentase</p>
                  <p className="mt-3 text-[22px] font-semibold text-slate-900">{winner.percentage.toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-6 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">Selesai</div>
            </div>
          </div>
        </article>

        <article className="rounded-[32px] bg-[#161f35] p-6 text-white sm:p-8">
          <div className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white">
            <ShieldCheck className="h-5 w-5" />
            Blockchain audit trail
          </div>

          <div className="mt-8 space-y-6">
            {[
              { label: 'Result Proof Generation', proof: election.revealProof },
              { label: 'Tally Validation Hash', proof: election.commitProof },
            ].map((item) => item.proof ? (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[18px] font-semibold text-white">{item.label}</p>
                  <span className="rounded-md bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">Finalized</span>
                </div>
                  <div className="mt-4 rounded-[20px] bg-white/5 px-4 py-4 sm:px-5">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Transaction hash</p>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <p className="break-all font-mono text-[12px] text-white">{item.proof.txHash}</p>
                      <a href={basescanTxUrl(item.proof.txHash)} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                  </div>
                </div>
                <p className="mt-3 text-[12px] text-slate-400">Timestamp: {formatDateTime(item.proof.createdAt)} UTC+7</p>
              </div>
            ) : null)}
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-[12px] text-slate-400">
            Node network: active · Base Sepolia testnet
          </div>
        </article>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={150} duration={800}>
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.98fr)]">
        <article className="rounded-[32px] bg-slate-100 p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-700">Rekapitulasi suara kandidat</p>
            <p className="text-[12px] text-slate-500">Update: {election.revealProof ? formatDateTime(election.revealProof.createdAt) : formatDateTime(election.deadlineIso)} WIB</p>
          </div>

          <div className="mt-8 space-y-4">
            {resultRows.map((candidate, index) => (
              <article key={candidate.id} className="rounded-[24px] bg-white px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold text-white ${index === 0 ? 'bg-slate-900' : index === 1 ? 'bg-slate-600' : 'bg-slate-400'}`}>
                      {candidate.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}
                    </div>
                    <p className="text-[16px] font-semibold text-slate-900 sm:text-[18px]">{candidate.name}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[18px] font-semibold text-slate-900">{formatNumber(candidate.votes)}</p>
                    <p className="text-[13px] text-slate-500">({candidate.percentage.toFixed(1)}%)</p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-slate-200">
                  <div className={`h-2 rounded-full ${index === 0 ? 'bg-slate-600' : 'bg-slate-400'}`} style={{ width: `${candidate.percentage}%` }} />
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] bg-slate-100 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[22px] font-semibold text-slate-900">Informasi Sertifikat</h3>
              <p className="mt-3 text-[15px] leading-8 text-slate-600">
                Sertifikat digital ini berisi bukti kriptografis bahwa suara Anda telah dihitung dalam hasil akhir. Simpan tautan Basescan dan transaction hash untuk keperluan audit mandiri.
              </p>
            </div>
          </div>
        </article>
      </section>
      </ScrollReveal>
    </VoterShell>
  )
}
