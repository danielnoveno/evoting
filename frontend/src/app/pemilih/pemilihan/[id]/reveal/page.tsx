'use client'

import { AlertCircle, CheckCircle2, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { basescanTxUrl, findElection, formatDateTime, formatNumber, useVoterStore } from '@/lib/voter-mock-store'
import { clearDemoVoteCommitment, loadDemoVoteCommitment } from '@/lib/vote-commitment-demo'

function ProofRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-100">
      {rows.map(([label, value], index) => (
        <div key={label} className={`flex flex-col gap-2 px-4 py-3 md:flex-row md:items-start md:justify-between ${index < rows.length - 1 ? 'border-b border-slate-100' : ''}`}>
          <span className="min-w-[112px] text-[12px] font-semibold text-slate-400">{label}</span>
          <span className="break-all text-right font-mono text-[11px] leading-6 text-slate-800 md:max-w-[72%]">{value}</span>
        </div>
      ))}
    </div>
  )
}

export default function VoterRevealPage({ params }: { params: { id: string } }) {
  const { store, loading, actions } = useVoterStore()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-xl bg-slate-200" /></VoterShell>
  }

  const election = findElection(store, params.id)

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-[14px] text-slate-800">
          <h1 className="text-[20px] font-semibold text-slate-900">Data pemilihan tidak tersedia</h1>
          <p className="mt-2 leading-7">Halaman reveal ini tidak menemukan data pemilihan yang diminta.</p>
          <Link href="/pemilih" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">Kembali ke Beranda</Link>
        </section>
      </VoterShell>
    )
  }

  const committedCandidate = election.candidates.find((candidate) => candidate.id === election.committedCandidateId)
  const savedCommitment = loadDemoVoteCommitment(election.id)

  if (!committedCandidate || !election.commitProof) {
    return (
      <VoterShell>
        <VoterStepper
          steps={[
            { label: 'Terdaftar', done: true },
            { label: 'Commit', active: true },
            { label: 'Reveal' },
            { label: 'Selesai' },
          ]}
        />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-[20px] font-semibold text-slate-900">Commit belum ditemukan</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Silakan kirim commit terlebih dahulu agar halaman reveal bisa digunakan.</p>
          <Link href={`/pemilih/pemilihan/${params.id}/commit`} className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">Kembali ke Commit</Link>
        </section>
      </VoterShell>
    )
  }

  if (!election.revealProof && election.phase !== 'reveal') {
    return (
      <VoterShell>
        <VoterStepper
          steps={[
            { label: 'Terdaftar', done: true },
            { label: 'Commit', done: true },
            { label: 'Reveal' },
            { label: 'Selesai' },
          ]}
        />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-[20px] font-semibold text-slate-900">Fase reveal belum dibuka</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Tunggu admin membuka fase reveal sebelum mengirim kandidat dan salt yang sama.</p>
        </section>
      </VoterShell>
    )
  }

  const handleReveal = () => {
    setConfirmOpen(false)
    const proof = actions.revealVote(election.id)

    if (proof) {
      clearDemoVoteCommitment(election.id)
    }
  }

  const stepState = election.revealProof
    ? [
        { label: 'Terdaftar', done: true },
        { label: 'Commit', done: true },
        { label: 'Reveal', done: true },
        { label: 'Selesai', active: true },
      ]
    : [
        { label: 'Terdaftar', done: true },
        { label: 'Commit', done: true },
        { label: 'Reveal', active: true },
        { label: 'Selesai' },
      ]

  return (
    <VoterShell>
      <VoterStepper steps={stepState} />

      <section className="mt-6">
        <h1 className="text-[20px] font-semibold text-slate-900">Konfirmasi Suara</h1>
        <p className="mt-1 text-[14px] text-slate-400">{election.title} · Reveal</p>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Data komitmenmu</p>

          <div className="mt-4 space-y-4">
            <ProofRows
              rows={[
                ['Kandidat', `${committedCandidate.name} (${committedCandidate.id})`],
                ['Salt', savedCommitment?.salt ?? 'Salt tidak ditemukan di browser ini'],
                ['Commitment', election.commitmentHash ?? '-'],
                ['Nonce', '1'],
                ['Waktu Commit', formatDateTime(election.commitProof.createdAt)],
              ]}
            />

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-[12px] text-slate-400">Kontrak memverifikasi:</p>
              <code className="mt-2 block font-mono text-[11px] leading-6 text-slate-800">keccak256(candidateId + salt) == commitment</code>
            </div>

            {!savedCommitment ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[12px] leading-6 text-red-700">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Salt tidak ditemukan di perangkat ini. Kamu mungkin membuka dari browser yang berbeda.</p>
                </div>
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          {!election.revealProof ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Konfirmasi & kirim</p>
              <p className="mt-4 text-[14px] leading-7 text-slate-800">
                Dengan mengklik tombol di bawah, kamu mengirim candidateId dan salt yang sama untuk diverifikasi terhadap commit sebelumnya.
              </p>

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-[12px] leading-6 text-amber-800">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Pastikan admin telah membuka fase reveal sebelum melanjutkan.</p>
                </div>
              </div>

              <button
                type="button"
                disabled={!savedCommitment}
                onClick={() => setConfirmOpen(true)}
                className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Konfirmasi Suara ke Blockchain
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              </div>
              <h2 className="mt-4 text-center text-[16px] font-semibold text-slate-900">Suara Berhasil Dicatat</h2>
              <p className="mt-2 text-center text-[13px] leading-6 text-slate-400">
                Bukti reveal tetap ditampilkan di halaman ini agar mudah diverifikasi sebelum kamu melihat hasil akhir.
              </p>

              <div className="mt-5">
                <ProofRows
                  rows={[
                    ['Tx Hash', election.revealProof.txHash],
                    ['Block', formatNumber(election.revealProof.blockNumber)],
                    ['Gas Used', formatNumber(election.revealProof.gasUsed)],
                  ]}
                />
              </div>

              <a href={basescanTxUrl(election.revealProof.txHash)} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-1 text-[13px] font-medium text-blue-700 hover:text-blue-800">
                Lihat di Basescan
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link href={`/pemilih/pemilihan/${election.id}/hasil`} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 hover:bg-slate-50">
                Lanjut ke Hasil
              </Link>
            </>
          )}
        </article>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Kirim reveal sekarang?"
        description="candidateId dan salt yang sama akan dipakai untuk membuka commit. Setelah berhasil, hasil akhir dapat ditinjau dari halaman berikutnya."
        confirmLabel="Ya, Buka Suara"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReveal}
      />
    </VoterShell>
  )
}
