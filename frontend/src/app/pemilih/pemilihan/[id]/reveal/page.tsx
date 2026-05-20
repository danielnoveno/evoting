'use client'

import { AlertCircle, CheckCircle2, ExternalLink, Info, ShieldCheck, LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { basescanTxUrl, findElection, formatDateTime, formatNumber, useVoterStore } from '@/lib/voter-mock-store'
import { clearDemoVoteCommitment, loadDemoVoteCommitment } from '@/lib/vote-commitment-demo'

function ProofRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-[12px] text-slate-800 space-y-3 shadow-inner">
      {rows.map(([label, value], index) => (
        <div 
          key={label} 
          className={`flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between pb-2.5 ${
            index < rows.length - 1 ? 'border-b border-slate-200/60' : ''
          }`}
        >
          <span className="font-semibold text-slate-700 select-none uppercase tracking-wider text-[10px] min-w-[120px]">
            {label}
          </span>
          <span className="break-all text-slate-900 font-semibold text-left md:text-right leading-relaxed max-w-full md:max-w-[70%] select-all">
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

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
          <p className="mt-2 leading-7 text-slate-700">Halaman reveal ini tidak menemukan data pemilihan yang diminta.</p>
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
  const savedCommitment = loadDemoVoteCommitment(election.id)

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
          <h1 className="text-[20px] font-semibold text-slate-900">Fase reveal belum dibuka</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Tunggu admin membuka fase reveal sebelum mengirim kandidat dan salt yang sama.</p>
        </section>
      </VoterShell>
    )
  }

  const handleReveal = () => {
    setIsRevealing(true)
    setConfirmOpen(false)
    
    // Simulate smart contract interaction speed
    setTimeout(() => {
      const proof = actions.revealVote(election.id)
      if (proof) {
        clearDemoVoteCommitment(election.id)
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
            Keamanan Blockchain Aktif
          </span>
        </div>

        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-slate-900">
          Buka Kunci Suara Anda (Reveal Phase)
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-600">
          Anda telah memberikan suara terenkripsi sebelumnya. Sekarang, masukkan kode rahasia (Secret Salt) yang Anda simpan saat memberikan suara untuk memvalidasi pilihan Anda di jaringan blockchain.
        </p>

        <div className="mt-10">
          <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2">
            Secret Salt
          </label>
          <div className="relative flex items-center">
            <LockKeyhole className="absolute left-4 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              readOnly
              value={savedCommitment?.salt || '..................'}
              className="h-12 w-full rounded-xl bg-slate-100 pl-11 pr-4 font-mono text-[14px] text-slate-600 outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-[13px] font-bold leading-relaxed text-amber-900">
            Perhatian: Tanpa proses Reveal, suara Anda tidak akan dihitung oleh sistem. Pastikan kode yang Anda masukkan sama persis dengan yang diberikan saat fase pertama.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={!savedCommitment || isRevealing || !!election.revealProof}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-[#0F172A] px-6 text-[13px] font-bold text-white transition-all hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRevealing ? 'Memproses...' : 'Buka Suara Sekarang'}
          </button>
          <Link
            href="/pemilih"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-transparent px-6 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Batal
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-slate-700" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">Hash Commitment</h2>
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
              {election.revealProof ? 'Suara Berhasil Terverifikasi' : 'Menunggu Dekripsi Suara'}
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
        title="Kirim reveal suara sekarang?"
        description="Pilihan kandidat dan Kunci Salt Anda akan dikirim untuk divalidasi oleh Smart Contract secara terbuka. Tindakan ini permanen dan tidak dapat diubah."
        confirmLabel="Ya, Buka Suara"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReveal}
      />
    </VoterShell>
  )
}
