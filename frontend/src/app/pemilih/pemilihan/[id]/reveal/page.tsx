'use client'

import { AlertCircle, CheckCircle2, ShieldCheck, LockKeyhole, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { findElection, useVoterStore } from '@/lib/voter-store'
import { clearVoteCommitment, loadVoteCommitment } from '@/lib/vote-commitment-storage'
import { useElectionContract } from '@/hooks/use-election-contract'
import { useToast } from '@/components/ui/toast-provider'

export default function VoterRevealPage({ params }: { params: { id: string } }) {
  const { store, loading: storeLoading, actions } = useVoterStore()
  const { showToast } = useToast()

  const election = findElection(store, params.id)
  
  const contractAddress = election?.deployedSpaceAddress ?? undefined

  const { 
    revealVote, 
    isWritePending, 
    isConfirming, 
    isConfirmed, 
    hash, 
    writeError,
    receipt,
    hasRevealedOnChain
  } = useElectionContract(contractAddress)

  const [confirmOpen, setConfirmOpen] = useState(false)

  const committedCandidate = election?.candidates.find((candidate) => candidate.id === election.committedCandidateId)
  const savedCommitment = loadVoteCommitment(params.id)

  useEffect(() => {
    if (isConfirmed && hash && receipt) {
      showToast({
        title: 'Konfirmasi Berhasil',
        description: 'Pilihan Anda telah divalidasi dan dihitung.',
        tone: 'success',
      })
      actions.revealVote(params.id, {
        txHash: hash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed),
        createdAt: new Date().toISOString(),
        statusLabel: 'Suara disahkan',
      })
      // Clear commitment since it's used
      clearVoteCommitment(params.id)
    }
  }, [isConfirmed, hash, receipt, params.id, actions, showToast])

  if (storeLoading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-xl bg-slate-200" /></VoterShell>
  }

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

  if (!committedCandidate || (!election.commitProof && !election.commitmentHash)) {
    return (
      <VoterShell>
        <VoterStepper
          steps={[
            { label: 'Pilih kandidat', description: 'Pilih satu nama', done: true },
            { label: 'Simpan pilihan', description: 'Kunci pilihanmu', done: true },
            { label: 'Konfirmasi suara', description: 'Sahkan pilihanmu', active: true },
            { label: 'Lihat hasil', description: 'Cek hasil akhir' },
          ]}
        />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Pilihan belum tersimpan</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Silakan pilih kandidat dan simpan pilihan terlebih dahulu sebelum mengesahkan suara.</p>
          <Link 
            href={`/pemilih/pemilihan/${params.id}/commit`} 
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B] focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none"
            aria-label="Menuju ke halaman simpan pilihan"
          >
            Simpan Pilihan Dulu
          </Link>
        </section>
      </VoterShell>
    )
  }

  const handleReveal = () => {
    if (!savedCommitment || !committedCandidate) return
    setConfirmOpen(false)
    
    // Map candidate ID to index (1-based)
    const candidateIndex = election.candidates.findIndex(c => c.id === committedCandidate.id) + 1
    revealVote(candidateIndex, savedCommitment.salt)
  }

  const stepState = election.revealProof || hasRevealedOnChain
    ? [
        { label: 'Pilih kandidat', description: 'Pilih satu nama', done: true },
        { label: 'Simpan pilihan', description: 'Kunci pilihanmu', done: true },
        { label: 'Konfirmasi suara', description: 'Sahkan pilihanmu', done: true },
        { label: 'Lihat hasil', description: 'Cek hasil akhir', active: true },
      ]
    : [
        { label: 'Pilih kandidat', description: 'Pilih satu nama', done: true },
        { label: 'Simpan pilihan', description: 'Kunci pilihanmu', done: true },
        { label: 'Konfirmasi suara', description: 'Sahkan pilihanmu', active: true },
        { label: 'Lihat hasil', description: 'Cek hasil akhir' },
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
          Sistem akan memakai kode rahasia yang tersimpan di browser ini untuk memastikan suara yang dihitung adalah suara yang sama dengan pilihanmu tadi.
        </p>

        {writeError && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-[15px] font-semibold text-red-900">Gagal konfirmasi suara</h2>
              <p className="mt-1 text-[13px] text-red-800 leading-relaxed">
                {writeError.message.includes('CommitmentMismatch') 
                  ? 'Kode rahasia tidak cocok dengan pilihan yang sebelumnya disimpan.' 
                  : 'Terjadi kesalahan saat mengesahkan suara. Pastikan dompet digitalmu siap dan memiliki saldo uji coba yang cukup.'}
              </p>
            </div>
          </section>
        )}

        {!contractAddress ? (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[13px] leading-7 text-amber-900">
            Data resmi untuk pemilihan ini belum lengkap, jadi tombol konfirmasi dinonaktifkan agar website tidak menampilkan bukti palsu.
          </section>
        ) : null}

        <div className="mt-10">
          <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-2">
            Kode Rahasia di Browser Ini
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
            Pastikan kamu menggunakan browser yang sama. Jika data browser terhapus, suara ini bisa gagal dikonfirmasi.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={!contractAddress || !savedCommitment || isWritePending || isConfirming || !!election.revealProof || !!(hasRevealedOnChain as boolean | undefined)}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#0F172A] px-6 text-[13px] font-bold text-white transition-all hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[220px]"
          >
            {isWritePending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menunggu persetujuan...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengesahkan suara...
              </>
            ) : (
              'Konfirmasi Suara Sekarang'
            )}
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
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">Kode bukti pilihan</h2>
          </div>
          <p className="mt-4 break-all font-mono text-[12px] leading-relaxed text-slate-500">
            {election.commitmentHash ?? savedCommitment?.commitment ?? 'Belum ada kode bukti.'}
          </p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-slate-700" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">Status Validasi</h2>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${election.revealProof || hasRevealedOnChain ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            <p className={`text-[14px] font-medium ${election.revealProof || hasRevealedOnChain ? 'text-emerald-600' : 'text-blue-600'}`}>
              {election.revealProof || hasRevealedOnChain ? 'Suara Berhasil Dikonfirmasi' : 'Menunggu Konfirmasi Suara'}
            </p>
          </div>
          {(election.revealProof || !!(hasRevealedOnChain as boolean | undefined)) && (
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
        description="Pilihan kandidat dan kode rahasia akan dicocokkan. Jika cocok, suaramu masuk ke hasil akhir."
        confirmLabel="Ya, Konfirmasi Suara"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReveal}
      />
    </VoterShell>
  )
}
