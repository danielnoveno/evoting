'use client'

import { CalendarDays, CheckCircle2, ExternalLink, Fingerprint, Info, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { basescanTxUrl, findElection, formatDateTime, formatNumber, useVoterStore } from '@/lib/voter-mock-store'
import { loadDemoVoteCommitment } from '@/lib/vote-commitment-demo'

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

export default function VoterConfirmationPage({ params }: { params: { id: string } }) {
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
          <p className="mt-2 leading-7">Halaman konfirmasi ini tidak menemukan data pemilihan yang diminta.</p>
          <Link href="/pemilih" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">Kembali ke Beranda</Link>
        </section>
      </VoterShell>
    )
  }

  const selectedCandidate = election.candidates.find((candidate) => candidate.id === election.selectedCandidateId)
  const savedCommitment = loadDemoVoteCommitment(election.id)

  if (!selectedCandidate || !savedCommitment) {
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
          <h1 className="text-[20px] font-semibold text-slate-900">Data commit belum siap</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">
            Pilih kandidat terlebih dahulu dan pastikan data komitmen tersimpan di browser yang sama sebelum melanjutkan.
          </p>
          <Link href={`/pemilih/pemilihan/${params.id}/commit`} className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">Kembali ke Commit</Link>
        </section>
      </VoterShell>
    )
  }

  const commitProof = election.commitProof

  const handleCommit = () => {
    setConfirmOpen(false)
    actions.commitVote(election.id, savedCommitment.commitment)
  }

  const stepState = commitProof
    ? [
        { label: 'Terdaftar', done: true },
        { label: 'Commit', done: true },
        { label: 'Reveal' },
        { label: 'Selesai' },
      ]
    : [
        { label: 'Terdaftar', done: true },
        { label: 'Commit', active: true },
        { label: 'Reveal' },
        { label: 'Selesai' },
      ]

  return (
    <VoterShell>
      <VoterStepper steps={stepState} />

      <section className="mt-6">
        <h1 className="text-[20px] font-semibold text-slate-900">Ringkasan Commit</h1>
        <p className="mt-1 text-[14px] text-slate-400">{election.title} · Commit</p>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Data komitmenmu</p>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-4 w-4 text-slate-800" />
                <div>
                  <p className="text-[12px] font-semibold text-slate-900">{selectedCandidate.name}</p>
                  <p className="font-mono text-[12px] text-slate-400">candidateId: {savedCommitment.candidateId}</p>
                </div>
              </div>
            </div>

            <ProofRows
              rows={[
                ['Kandidat', `${selectedCandidate.name} (${savedCommitment.candidateId})`],
                ['Salt', savedCommitment.salt],
                ['Commitment', savedCommitment.commitment],
                ['Waktu siap', formatDateTime(savedCommitment.timestamp)],
              ]}
            />

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-[12px] text-slate-400">Kontrak memverifikasi:</p>
              <code className="mt-2 block font-mono text-[11px] leading-6 text-slate-800">keccak256(candidateId + salt) == commitment</code>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5">
          {!commitProof ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Konfirmasi & kirim</p>
              <p className="mt-4 text-[14px] leading-7 text-slate-800">
                Dengan mengklik tombol di bawah, hash komitmen akan disimpan sebagai bukti commit. Bukti ini tetap ditampilkan di halaman agar mudah ditinjau sebelum lanjut ke tahap berikutnya.
              </p>

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-[12px] leading-6 text-amber-800">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Pastikan kamu menyimpan browser yang sama sampai fase reveal dibuka.</p>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-slate-800" />
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Waktu kirim</p>
                    <p className="text-[12px] text-slate-400">{formatDateTime(new Date().toISOString())}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link href={`/pemilih/pemilihan/${election.id}/commit`} className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 hover:bg-slate-50">
                  Batal
                </Link>
                <button type="button" onClick={() => setConfirmOpen(true)} className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">
                  Kirim Commit
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              </div>
              <h2 className="mt-4 text-center text-[16px] font-semibold text-slate-900">Commit Berhasil Dicatat</h2>
              <p className="mt-2 text-center text-[13px] leading-6 text-slate-400">
                Bukti commit ditahan di halaman ini agar bisa langsung kamu salin atau periksa sebelum lanjut ke fase reveal.
              </p>

              <div className="mt-5">
                <ProofRows
                  rows={[
                    ['Tx Hash', commitProof.txHash],
                    ['Block', formatNumber(commitProof.blockNumber)],
                    ['Gas Used', formatNumber(commitProof.gasUsed)],
                  ]}
                />
              </div>

              <a href={basescanTxUrl(commitProof.txHash)} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-1 text-[13px] font-medium text-blue-700 hover:text-blue-800">
                Lihat di Basescan
                <ExternalLink className="h-4 w-4" />
              </a>

              <Link href={`/pemilih/pemilihan/${election.id}/reveal`} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 hover:bg-slate-50">
                Ke Halaman Reveal
              </Link>
            </>
          )}
        </article>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Kirim commit sekarang?"
        description="Setelah commit dikirim, kamu harus kembali saat fase reveal dibuka untuk mengkonfirmasi suara yang sama."
        confirmLabel="Ya, Kirim Commit"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleCommit}
      />
    </VoterShell>
  )
}
