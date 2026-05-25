'use client'

import { AlertCircle, CheckCircle2, ShieldCheck, LockKeyhole, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { useVoterStore } from '@/lib/voter-mock-store'
import { clearVoteCommitment, loadVoteCommitment } from '@/lib/vote-commitment-demo'
import { useElectionContract } from '@/hooks/use-election-contract'
import { useToast } from '@/components/ui/toast-provider'
import { useQuery } from '@tanstack/react-query'
import { getVoterElectionDetail } from '@/lib/repositories/voterRepository'

export default function VoterRevealPage({ params }: { params: { id: string } }) {
  const { actions } = useVoterStore()
  const { showToast } = useToast()

  // Real database fetch
  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['voter-election-detail', params.id],
    queryFn: () => getVoterElectionDetail(params.id)
  })

  const election = detail?.election
  const candidates = detail?.candidates ?? []
  const contractAddress = detail?.spaceAddress ?? undefined

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
  const savedCommitment = loadVoteCommitment(params.id)

  useEffect(() => {
    if (isConfirmed && hash && receipt) {
      showToast({
        title: 'Konfirmasi Berhasil',
        description: 'Pilihan Anda telah divalidasi dan dihitung.',
        tone: 'success',
      })
      // Sync mock store
      actions.revealVote(params.id)
      // Clear commitment since it's used
      clearVoteCommitment(params.id)
    }
  }, [isConfirmed, hash, receipt, params.id, actions, showToast])

  if (detailLoading) {
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
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]"
          >
            Kembali ke Beranda
          </Link>
        </section>
      </VoterShell>
    )
  }

  const committedCandidate = candidates.find((c) => c.candidateLocalId === savedCommitment?.candidateId)

  const stepState = (isConfirmed || hasRevealedOnChain)
    ? [
        { label: 'pilih kandidat', done: true },
        { label: 'commit', done: true },
        { label: 'reveal', done: true },
        { label: 'result' },
      ]
    : [
        { label: 'pilih kandidat', done: true },
        { label: 'commit', done: true },
        { label: 'reveal', active: true },
        { label: 'result' },
      ]

  if (!savedCommitment || !committedCandidate) {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Komitmen belum ditemukan</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Silakan kirim komitmen suara terlebih dahulu agar halaman konfirmasi bisa digunakan.</p>
          <Link 
            href={`/pemilih/pemilihan/${params.id}/commit`} 
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]"
          >
            Kembali ke Halaman Commit
          </Link>
        </section>
      </VoterShell>
    )
  }

  const handleReveal = () => {
    setConfirmOpen(false)
    const candidateNumber = parseInt(committedCandidate.candidateLocalId.split('-').pop() || '1')
    revealVote(candidateNumber, savedCommitment.salt as `0x${string}`)
  }

  if (isConfirmed || hasRevealedOnChain) {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />
        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>
          <h1 className="mt-5 text-center text-[24px] font-semibold text-slate-900">Suara berhasil dikonfirmasi</h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-[14px] leading-7 text-slate-700">
            Terima kasih! Pilihan Anda telah divalidasi oleh smart contract dan dihitung secara permanen di blockchain.
          </p>
          <div className="mt-10 flex justify-center">
             <Link 
              href={`/pemilih/pemilihan/${params.id}/hasil`} 
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-black px-8 text-[14px] font-bold text-white hover:bg-slate-900 transition-all"
            >
              Lihat Perolehan Suara
            </Link>
          </div>
        </section>
      </VoterShell>
    )
  }

  return (
    <VoterShell>
      <VoterStepper steps={stepState} />

      <section className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">
          <LockKeyhole className="h-3.5 w-3.5" />
          Tahap Konfirmasi
        </span>
        <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-slate-900 md:text-[40px]">Buka Komitmen Anda</h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-8 text-slate-700">
          Pada tahap ini, sistem akan mengirimkan kode rahasia Anda untuk membuktikan pilihan yang telah dikirim sebelumnya.
        </p>
      </section>

      {writeError && (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-[15px] font-semibold text-red-900">Gagal konfirmasi suara</h2>
            <p className="mt-1 text-[13px] text-red-800 leading-relaxed">
              {writeError.message.includes('User rejected') 
                ? 'Transaksi dibatalkan oleh pengguna.' 
                : 'Terjadi kesalahan saat memproses konfirmasi on-chain. Pastikan fase Reveal sudah dibuka.'}
            </p>
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
           <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Pilihan yang akan dibuka</p>
           <div className="mt-6 flex items-center gap-6">
              <div className="h-24 w-24 rounded-3xl bg-slate-100 flex items-center justify-center">
                 <ShieldCheck className="h-10 w-10 text-slate-300" />
              </div>
              <div>
                <h2 className="text-[24px] font-bold text-slate-900">{committedCandidate.fullName}</h2>
                <p className="mt-1 text-[15px] text-slate-600">{committedCandidate.faculty}</p>
              </div>
           </div>
           
           <div className="mt-10 grid gap-4 rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between text-[13px]">
                 <span className="text-slate-500">Salt Rahasia (Local)</span>
                 <span className="font-mono text-slate-900">{savedCommitment.salt.slice(0, 12)}...</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                 <span className="text-slate-500">ID Kandidat On-Chain</span>
                 <span className="font-mono text-slate-900">#{parseInt(committedCandidate.candidateLocalId.split('-').pop() || '1')}</span>
              </div>
           </div>
        </article>

        <aside className="space-y-6">
           <article className="rounded-[28px] bg-[#0F172A] p-6 text-white shadow-sm md:p-8">
             <ShieldCheck className="h-8 w-8 text-emerald-400" />
             <h2 className="mt-6 text-[18px] font-semibold text-white">Privasi Terjamin</h2>
             <p className="mt-4 text-[14px] leading-7 text-slate-300">
               Suara Anda hanya akan dihitung jika kode rahasia ini cocok dengan komitmen yang Anda kirim sebelumnya.
             </p>
           </article>
        </aside>
      </div>

      <section className="mt-8 flex flex-col gap-3 pb-8 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={isWritePending || isConfirming}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-8 text-[15px] font-bold text-white hover:bg-[#1E293B] disabled:opacity-40 min-w-[240px] shadow-xl shadow-blue-900/10"
        >
          {isWritePending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menunggu Dompet...
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mencatat di Blockchain...
            </>
          ) : (
            'Konfirmasi & Kirim Suara'
          )}
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Konfirmasi pilihan Anda?"
        description="Setelah aksi ini dijalankan, suara Anda akan dihitung secara publik namun pilihan tetap anonim di blockchain."
        confirmLabel="Ya, Konfirmasi"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReveal}
      />
    </VoterShell>
  )
}
