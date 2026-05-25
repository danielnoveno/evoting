'use client'

import { CalendarDays, CheckCircle2, ExternalLink, Fingerprint, LockKeyhole, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { basescanTxUrl, formatDateTime, formatNumber, useVoterStore } from '@/lib/voter-mock-store'
import { loadVoteCommitment } from '@/lib/vote-commitment-demo'
import { useElectionContract } from '@/hooks/use-election-contract'
import { useToast } from '@/components/ui/toast-provider'
import { useQuery } from '@tanstack/react-query'
import { getVoterElectionDetail } from '@/lib/repositories/voterRepository'

const headshots: Record<string, string> = {
  c1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
  c2: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
  c3: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
}

const defaultHeadshot = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop'

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Fingerprint
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-800">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
        <p className="mt-1 break-all text-[13px] text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function VoterCommitPage({ params }: { params: { id: string } }) {
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
    commitVote, 
    isWritePending, 
    isConfirming, 
    isConfirmed, 
    hash, 
    writeError,
    receipt,
    hasCommittedOnChain
  } = useElectionContract(contractAddress)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const savedCommitment = loadVoteCommitment(params.id)
  
  useEffect(() => {
    if (isConfirmed && hash && receipt) {
      showToast({
        title: 'Komitmen Berhasil',
        description: 'Suara Anda telah dicatat di blockchain.',
        tone: 'success',
      })
      // We still update mock store for UI feedback if needed
      actions.commitVote(params.id, savedCommitment?.commitment)
    }
  }, [isConfirmed, hash, receipt, params.id, actions, showToast, savedCommitment?.commitment])

  if (detailLoading) {
    return (
      <VoterShell>
        <div className="h-[420px] animate-pulse rounded-xl bg-slate-200" />
      </VoterShell>
    )
  }

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Pemilihan tidak ditemukan</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Ruang voting yang Anda cari belum tersedia saat ini.</p>
          <Link href="/pemilih" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">
            Kembali ke Beranda
          </Link>
        </section>
      </VoterShell>
    )
  }

  const selectedCandidate = candidates.find((c) => c.candidateLocalId === savedCommitment?.candidateId) ?? null

  const commitProof = isConfirmed && hash && receipt ? {
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: Number(receipt.gasUsed),
    createdAt: new Date().toISOString(),
    statusLabel: 'Confirmed',
  } : null

  const stepState = (commitProof || hasCommittedOnChain)
    ? [
        { label: 'pilih kandidat', done: true },
        { label: 'commit', done: true },
        { label: 'reveal' },
        { label: 'result' },
      ]
    : [
        { label: 'pilih kandidat', done: true },
        { label: 'commit', active: true },
        { label: 'reveal' },
        { label: 'result' },
      ]

  if (!savedCommitment || !selectedCandidate) {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Data pilihan belum siap</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">
            Pilih kandidat terlebih dahulu dari halaman pilih kandidat sebelum masuk ke tahap commit.
          </p>
          <Link
            href={`/pemilih/pemilihan/${params.id}/pilih-kandidat`}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]"
          >
            Ke Halaman Pilih Kandidat
          </Link>
        </section>
      </VoterShell>
    )
  }

  const handleCommit = () => {
    setConfirmOpen(false)
    commitVote(savedCommitment.commitment as `0x${string}`)
  }

  if (commitProof || hasCommittedOnChain) {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>

          <h1 className="mt-5 text-center text-[24px] font-semibold text-slate-900">Komitmen suara berhasil dikirim</h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[14px] leading-7 text-slate-700">
            Pilihan Anda sudah dicatat sebagai komitmen suara di blockchain. Gunakan browser dan perangkat yang sama saat fase konfirmasi suara dibuka.
          </p>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat terpilih</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-slate-200" />
                <div>
                  <h2 className="text-[20px] font-semibold text-slate-900">{selectedCandidate.fullName}</h2>
                  <p className="mt-1 text-[14px] text-slate-600">{selectedCandidate.faculty}</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-[#0F172A] p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Hash komitmen (On-Chain)</p>
              <p className="mt-4 break-all font-mono text-[12px] leading-6 text-slate-200">{savedCommitment.commitment}</p>
              <p className="mt-4 text-[13px] leading-6 text-slate-300">Bukti ini tersimpan secara permanen di blockchain.</p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
             <DetailRow icon={ShieldCheck} label="Jaringan" value="Base Sepolia" />
            <DetailRow icon={CalendarDays} label="Waktu Transaksi" value={commitProof ? `${formatDateTime(commitProof.createdAt)} WIB` : 'Tersimpan'} />
            <DetailRow icon={ShieldCheck} label="Nomor Block" value={commitProof ? formatNumber(commitProof.blockNumber) : '-'} />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {commitProof && (
              <a
                href={basescanTxUrl(commitProof.txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 hover:bg-slate-50"
              >
                Lihat di Basescan
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Link
              href={`/pemilih/pemilihan/${params.id}/reveal`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0F172A] px-5 text-[13px] font-semibold text-white hover:bg-[#1E293B]"
            >
               Lanjut ke Konfirmasi
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
          Konfirmasi pilihan
        </span>
        <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-slate-900 md:text-[40px]">Tinjau Suara Anda</h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-8 text-slate-700">
          Pastikan pilihan Anda sudah benar. Setelah dikirim, sistem akan mencatat komitmen suara Anda di blockchain Base Sepolia.
        </p>
      </section>

      {writeError && (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-[15px] font-semibold text-red-900">Gagal mengirim transaksi</h2>
            <p className="mt-1 text-[13px] text-red-800 leading-relaxed">
              {writeError.message.includes('User rejected') 
                ? 'Transaksi dibatalkan oleh pengguna.' 
                : 'Terjadi kesalahan saat mengirim transaksi ke blockchain. Pastikan dompet terhubung.'}
            </p>
          </div>
        </section>
      )}

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.85fr)]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat terpilih</p>
              <h2 className="mt-4 text-[24px] font-semibold text-slate-900">{selectedCandidate.fullName}</h2>
              <p className="mt-2 text-[18px] text-slate-700">{selectedCandidate.faculty}</p>
            </div>
            <div className="h-[96px] w-[96px] rounded-3xl bg-slate-100" />
          </div>

          <div className="mt-8 grid gap-4">
            <DetailRow icon={CalendarDays} label="Waktu Lokal" value={`${formatDateTime(savedCommitment.timestamp)} WIB`} />
          </div>
        </article>

        <article className="rounded-[28px] bg-[#0F172A] p-6 text-white shadow-sm md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-slate-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-8 text-[18px] font-semibold text-white">Ringkasan Komitmen</h2>
          <p className="mt-4 text-[16px] leading-8 text-slate-300">
            Sistem telah menyiapkan komitmen suara di browser ini. Pilihan asli Anda tetap tersembunyi sampai tahap konfirmasi suara dibuka.
          </p>

          <div className="mt-8 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-300">Hash komitmen</p>
            <p className="font-mono text-[12px] leading-6 text-slate-300">{savedCommitment.commitment}</p>
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-[28px] border border-slate-200 bg-slate-100 px-6 py-5 md:px-8">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" />
          <div>
            <h2 className="text-[18px] font-semibold text-slate-900">Pernyataan privasi</h2>
            <p className="mt-2 text-[14px] leading-7 text-slate-700">
              Setelah komitmen suara dikirim, pilihan Anda baru dapat dikonfirmasi kembali saat Anda menggunakan kode rahasia yang sama pada tahap berikutnya.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 md:px-8">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-[18px] font-semibold text-amber-900">Gunakan browser yang sama</h2>
            <p className="mt-2 text-[14px] leading-7 text-amber-900/90">
              Kode rahasia untuk konfirmasi suara tersimpan di browser ini. Jika Anda berpindah browser atau menghapus data lokal, proses konfirmasi suara bisa terganggu.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-3 pb-2 sm:flex-row sm:justify-end">
        <Link
          href={`/pemilih/pemilihan/${params.id}/pilih-kandidat`}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-200 px-6 text-[13px] font-semibold text-slate-900 hover:bg-slate-300"
        >
          Batal & Ubah
        </Link>
        <button
          type="button"
          disabled={isWritePending || isConfirming}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-6 text-[13px] font-semibold text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40 min-w-[200px]"
        >
          {isWritePending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menunggu Wallet...
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses Blockchain...
            </>
          ) : (
            'Kirim Komitmen Suara'
          )}
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Kirim komitmen suara sekarang?"
        description="Setelah dikirim, Anda perlu kembali pada fase konfirmasi suara dengan browser yang sama. Pastikan kandidat yang dipilih sudah benar."
        confirmLabel="Ya, Kirim Komitmen"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleCommit}
      />
    </VoterShell>
  )
}

  return (
    <VoterShell>
      <VoterStepper steps={stepState} />

      <section className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">
          <LockKeyhole className="h-3.5 w-3.5" />
          Konfirmasi pilihan
        </span>
        <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-slate-900 md:text-[40px]">Tinjau Suara Anda</h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-8 text-slate-700">
          Pastikan pilihan Anda sudah benar. Setelah dikirim, sistem akan mencatat komitmen suara Anda sebagai bukti awal sebelum tahap konfirmasi suara.
        </p>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.85fr)]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat terpilih</p>
              <h2 className="mt-4 text-[24px] font-semibold text-slate-900">{selectedCandidate.name}</h2>
              <p className="mt-2 text-[18px] text-slate-700">{selectedCandidate.vision}</p>
            </div>
            <img
              src={headshots[selectedCandidate.id] || defaultHeadshot}
              alt={selectedCandidate.name}
              className="h-[96px] w-[96px] rounded-3xl object-cover grayscale"
            />
          </div>

          <div className="mt-8 grid gap-4">
            <DetailRow icon={Fingerprint} label="ID Pemilih" value={election.voterIdentifier} />
            <DetailRow icon={CalendarDays} label="Waktu Transaksi" value={`${formatDateTime(savedCommitment.timestamp)} WIB`} />
          </div>
        </article>

        <article className="rounded-[28px] bg-[#0F172A] p-6 text-white shadow-sm md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-slate-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-8 text-[18px] font-semibold text-white">Ringkasan Komitmen</h2>
          <p className="mt-4 text-[16px] leading-8 text-slate-300">
            Sistem menyiapkan komitmen suara di browser ini sebelum dikirim. Pilihan asli Anda tetap tersembunyi sampai tahap konfirmasi suara dibuka.
          </p>

          <div className="mt-8 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-300">Hash komitmen</p>
            <p className="font-mono text-[12px] leading-6 text-slate-300">{savedCommitment.commitment}</p>
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-[28px] border border-slate-200 bg-slate-100 px-6 py-5 md:px-8">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" />
          <div>
            <h2 className="text-[18px] font-semibold text-slate-900">Pernyataan privasi</h2>
            <p className="mt-2 text-[14px] leading-7 text-slate-700">
              Setelah komitmen suara dikirim, pilihan Anda baru dapat dikonfirmasi kembali saat Anda menggunakan kode rahasia yang sama pada tahap berikutnya.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5 md:px-8">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-[18px] font-semibold text-amber-900">Gunakan browser yang sama</h2>
            <p className="mt-2 text-[14px] leading-7 text-amber-900/90">
              Kode rahasia untuk konfirmasi suara tersimpan di browser ini. Jika Anda berpindah browser atau menghapus data lokal, proses konfirmasi suara bisa terganggu.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-3 pb-2 sm:flex-row sm:justify-end">
        <Link
          href={`/pemilih/pemilihan/${election.id}/pilih-kandidat`}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-200 px-6 text-[13px] font-semibold text-slate-900 hover:bg-slate-300"
        >
          Batal & Ubah
        </Link>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-6 text-[13px] font-semibold text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'Mengirim komitmen...' : 'Kirim Komitmen Suara'}
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Kirim komitmen suara sekarang?"
        description="Setelah dikirim, Anda perlu kembali pada fase konfirmasi suara dengan browser yang sama. Pastikan kandidat yang dipilih sudah benar."
        confirmLabel="Ya, Kirim Komitmen"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleCommit}
      />
    </VoterShell>
  )
}
