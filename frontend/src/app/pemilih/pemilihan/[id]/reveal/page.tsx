'use client'

import { AlertCircle, CheckCircle2, ShieldCheck, LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { findElection, useVoterStore } from '@/lib/voter-mock-store'
import { clearVoteCommitment, loadVoteCommitment } from '@/lib/vote-commitment-demo'

export default function VoterRevealPage({ params }: { params: { id: string } }) {
  const { store, loading, actions } = useVoterStore()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-xl bg-slate-200" /></VoterShell>
  }

  const election = findElection(store, params.id)

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-slate-200 bg-white p-6 text-[14px] text-slate-800 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Data pemilihan tidak tersedia</h1>
          <p className="mt-2 leading-7 text-slate-700">Halaman konfirmasi suara ini tidak menemukan data pemilihan yang diminta.</p>
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

  const committedCandidate = election.candidates.find((candidate) => candidate.id === election.committedCandidateId)
  const savedCommitment = loadVoteCommitment(election.id)

  if (!committedCandidate || !election.commitProof) {
    return (
      <VoterShell>
        <VoterStepper
          steps={[
            { label: 'pilih kandidat', done: true },
            { label: 'commit', done: true },
            { label: 'reveal', active: true },
            { label: 'result' },
          ]}
        />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Commit belum ditemukan</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Silakan kirim commit terlebih dahulu agar halaman reveal bisa digunakan.</p>
          <Link 
            href={`/pemilih/pemilihan/${params.id}/commit`} 
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B] focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none"
            aria-label="Menuju ke halaman Kirim Commit"
          >
            Kembali ke Commit
          </Link>
        </section>
      </VoterShell>
    )
  }

  if (!election.revealProof && election.phase !== 'reveal') {
    return (
      <VoterShell>
        <VoterStepper
          steps={[
            { label: 'pilih kandidat', done: true },
            { label: 'commit', done: true },
            { label: 'reveal', active: true },
            { label: 'result' },
          ]}
        />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Fase konfirmasi belum dibuka</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Tunggu admin membuka fase konfirmasi suara sebelum mengirim pilihan dan kode rahasia yang sama.</p>
        </section>
      </VoterShell>
    )
  }

  const handleReveal = () => {
    setIsRevealing(true)
    setConfirmOpen(false)
    
    setTimeout(() => {
      const proof = actions.revealVote(election.id)
      if (proof) {
        clearVoteCommitment(election.id)
      }
      setIsRevealing(false)
    }, 1200)
  }

  const stepState = election.revealProof
    ? [
        { label: 'pilih kandidat', done: true },
        { label: 'commit', done: true },
        { label: 'reveal', done: true },
        { label: 'result', active: true },
      ]
    : [
        { label: 'pilih kandidat', done: true },
        { label: 'commit', done: true },
        { label: 'reveal', active: true },
        { label: 'result' },
      ]

  return (
    <VoterShell>
      <VoterStepper steps={stepState} />

      <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 mb-6">
          <LockKeyhole className="h-3.5 w-3.5 text-slate-700" />
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700">
            Konfirmasi Suara
          </span>
        </div>

        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-slate-900">
          Konfirmasi Suara Anda
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-600">
          Anda sudah mengirim komitmen suara sebelumnya. Sekarang sistem akan memakai kode rahasia yang tersimpan di browser ini untuk mengkonfirmasi pilihan Anda.
        </p>

        <div className="mt-10">
          <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2">
            Kode Rahasia
          </label>
          <div className="relative flex items-center">
            <LockKeyhole className="absolute left-4 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              readOnly
              value={savedCommitment?.salt || '..................'}
              className="h-12 w-full rounded-xl bg-slate-100 pl-11 pr-4 font-mono text-[14px] text-slate-600 outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            />
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-[13px] font-bold leading-relaxed text-amber-900">
            Tanpa tahap konfirmasi suara, pilihan Anda belum dihitung pada hasil akhir. Pastikan Anda menggunakan browser yang sama seperti saat mengirim komitmen.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={!savedCommitment || isRevealing || !!election.revealProof}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-[#0F172A] px-6 text-[13px] font-bold text-white transition-all hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRevealing ? 'Memproses...' : 'Konfirmasi Suara Sekarang'}
          </button>
          <Link
            href="/pemilih"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-transparent px-6 text-[13px] font-bold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            Batal
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-slate-700" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">Hash Komitmen</h2>
          </div>
          <p className="mt-4 break-all font-mono text-[12px] leading-relaxed text-slate-500">
            {election.commitmentHash ?? savedCommitment?.commitment ?? 'Belum ada hash komitmen.'}
          </p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-slate-700" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">Status Validasi</h2>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${election.revealProof ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            <p className={`text-[14px] font-medium ${election.revealProof ? 'text-emerald-600' : 'text-blue-600'}`}>
              {election.revealProof ? 'Suara Berhasil Dikonfirmasi' : 'Menunggu Konfirmasi Suara'}
            </p>
          </div>
          {election.revealProof && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <Link
                href={`/pemilih/pemilihan/${election.id}/hasil`}
                className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-4 text-[12px] font-bold text-white transition-all hover:bg-emerald-700"
              >
                Lihat Hasil Akhir
              </Link>
            </div>
          )}
        </article>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Kirim konfirmasi suara sekarang?"
        description="Pilihan kandidat dan kode rahasia Anda akan dikirim untuk memvalidasi komitmen suara yang sudah tersimpan. Tindakan ini tidak dapat diubah."
        confirmLabel="Ya, Konfirmasi Suara"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReveal}
      />
    </VoterShell>
  )
}
