'use client'

import { CalendarDays, CheckCircle2, ExternalLink, Fingerprint, LockKeyhole, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { basescanTxUrl, findElection, formatDateTime, formatNumber, formatWallet, useVoterStore } from '@/lib/voter-store'
import { loadVoteCommitment } from '@/lib/vote-commitment-storage'
import { useElectionContract } from '@/hooks/use-election-contract'
import { useToast } from '@/components/ui/toast-provider'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'

function sameWalletAddress(left: string | null | undefined, right: string | null | undefined) {
  return Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase())
}

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
  const { store, loading: storeLoading, actions } = useVoterStore()
  const { showToast } = useToast()
  const { address: connectedWallet } = useAccount()
  
  const election = findElection(store, params.id)
  const contractAddress = election?.deployedSpaceAddress ?? undefined

  const { 
    commitVote, 
    isWritePending, 
    isConfirming, 
    isConfirmed, 
    hash, 
    writeError,
    receipt,
    hasCommittedOnChain,
    isWhitelistedOnChain,
    currentPhase,
    phaseError,
    hasCommittedError,
    whitelistError,
    refetchPhase,
    refetchHasCommitted,
    refetchIsWhitelisted
  } = useElectionContract(contractAddress, { checks: ['phase', 'hasCommitted', 'isWhitelisted'] })

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isRefreshingOnChainStatus, setIsRefreshingOnChainStatus] = useState(false)

  const savedCommitment = loadVoteCommitment(params.id)
  
  useEffect(() => {
    if (isConfirmed && hash && receipt) {
      showToast({
        title: 'Pilihan Berhasil Disimpan',
        description: 'Suaramu sudah dikunci dengan aman.',
        tone: 'success',
      })
      actions.commitVote(params.id, savedCommitment?.commitment, {
        txHash: hash,
        blockNumber: Number(receipt.blockNumber),
        gasUsed: Number(receipt.gasUsed),
        createdAt: new Date().toISOString(),
        statusLabel: 'Pilihan tersimpan',
      })
    }
  }, [isConfirmed, hash, receipt, params.id, actions, showToast, savedCommitment?.commitment])

  if (storeLoading || !store) {
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

  const selectedCandidate = election.candidates.find((candidate) => candidate.id === election.selectedCandidateId)
    ?? election.candidates.find((candidate) => candidate.id === election.committedCandidateId)
    ?? null

  const commitProof = election.commitProof || (isConfirmed && hash && receipt ? {
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: Number(receipt.gasUsed),
    createdAt: new Date().toISOString(),
    statusLabel: 'Confirmed',
  } : null)

  const stepState = commitProof
    ? [
        { label: 'Pilih kandidat', description: 'Pilih satu nama', done: true },
        { label: 'Simpan pilihan', description: 'Kunci pilihanmu', done: true },
        { label: 'Konfirmasi suara', description: 'Datang lagi nanti' },
        { label: 'Lihat hasil', description: 'Cek hasil akhir' },
      ]
    : [
        { label: 'Pilih kandidat', description: 'Pilih satu nama', done: true },
        { label: 'Simpan pilihan', description: 'Kunci pilihanmu', active: true },
        { label: 'Konfirmasi suara', description: 'Datang lagi nanti' },
        { label: 'Lihat hasil', description: 'Cek hasil akhir' },
      ]

  if ((!selectedCandidate || !savedCommitment) && !commitProof && !hasCommittedOnChain) {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Data pilihan belum siap</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">
            Pilih kandidat terlebih dahulu sebelum suara bisa disimpan dengan aman.
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

  const currentPhaseNumber = typeof currentPhase === 'number' || typeof currentPhase === 'bigint'
    ? Number(currentPhase)
    : null
  const profileWallet = store.profile.wallet
  const isConnectedWalletProfileWallet = sameWalletAddress(connectedWallet, profileWallet)
  const isCommitPhaseOnChain = currentPhaseNumber === 1
  const isOnChainStatusReady = Boolean(contractAddress) && Boolean(connectedWallet) && isConnectedWalletProfileWallet && currentPhaseNumber !== null && typeof isWhitelistedOnChain === 'boolean'
  const onChainStatusError = phaseError ?? whitelistError ?? hasCommittedError ?? null
  const commitBlockedReason = !contractAddress
    ? 'Smart contract untuk pemilihan ini belum tersedia di Supabase.'
    : !connectedWallet
      ? 'Dompet belum tersambung. Sambungkan dompet yang tertaut ke akun ini sebelum menyimpan pilihan.'
    : profileWallet && !isConnectedWalletProfileWallet
      ? `Dompet tersambung (${formatWallet(connectedWallet)}) berbeda dari dompet akun ini (${formatWallet(profileWallet)}). Sambungkan dompet yang sama agar pengecekan whitelist sesuai.`
    : onChainStatusError
      ? 'Jaringan Base Sepolia belum merespons. Coba periksa ulang sebelum menyimpan pilihan.'
    : !isOnChainStatusReady
      ? 'Status on-chain sedang diperiksa. Tunggu sebentar atau periksa ulang sebelum menyimpan pilihan.'
      : !isWhitelistedOnChain
        ? 'Wallet ini belum terdaftar di whitelist smart contract untuk ruang voting ini.'
        : hasCommittedOnChain
          ? 'Wallet ini sudah pernah menyimpan pilihan untuk ruang voting ini.'
          : !isCommitPhaseOnChain
            ? 'Fase smart contract belum berada di tahap menyimpan pilihan.'
            : ''

  const handleRefreshOnChainStatus = async () => {
    setIsRefreshingOnChainStatus(true)
    try {
      await Promise.allSettled([
        refetchPhase(),
        refetchHasCommitted(),
        refetchIsWhitelisted(),
      ])
      showToast({
        title: 'Status diperiksa ulang',
        description: 'Jika jaringan Base Sepolia sudah merespons, tombol simpan akan aktif sesuai status smart contract.',
        tone: 'info',
      })
    } finally {
      setIsRefreshingOnChainStatus(false)
    }
  }

  const handleCommit = () => {
    if (!savedCommitment) return
    if (commitBlockedReason) {
      showToast({
        title: 'Belum bisa menyimpan pilihan',
        description: commitBlockedReason,
        tone: 'info',
      })
      return
    }
    setConfirmOpen(false)
    commitVote(savedCommitment.commitment)
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

          <h1 className="mt-5 text-center text-[24px] font-semibold text-slate-900">Pilihan berhasil disimpan aman</h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[14px] leading-7 text-slate-700">
            Pilihanmu sudah dikunci sebagai bukti suara. Gunakan browser dan perangkat yang sama saat waktunya mengesahkan suara dibuka.
          </p>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat terpilih</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-[18px] font-semibold text-slate-600">
                  {selectedCandidate ? selectedCandidate.name.slice(0, 2).toUpperCase() : 'VC'}
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold text-slate-900">{selectedCandidate?.name ?? 'Pilihan tersimpan terdeteksi'}</h2>
                  <RichTextRenderer value={selectedCandidate?.vision} emptyFallback="Detail kandidat asli tetap mengikuti data di browser dan baru dibuka saat konfirmasi suara." className="mt-1 text-[14px] text-slate-600" />
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-[#0F172A] p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Kode bukti suara</p>
              <p className="mt-4 break-all font-mono text-[12px] leading-6 text-slate-200">{election.commitmentHash ?? savedCommitment?.commitment ?? 'Kode bukti pilihan terdeteksi.'}</p>
              <p className="mt-4 text-[13px] leading-6 text-slate-300">Kode ini menjadi tanda bahwa pilihanmu sudah tersimpan dan tidak bisa diubah sembarangan.</p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <DetailRow icon={Fingerprint} label="ID Pemilih" value={election.voterIdentifier} />
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
            {selectedCandidate && savedCommitment ? (
              <Link
                href={`/pemilih/pemilihan/${election.id}/reveal`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0F172A] px-5 text-[13px] font-semibold text-white hover:bg-[#1E293B]"
              >
                Lanjut ke Konfirmasi
              </Link>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-6 text-amber-900">
                Pilihan sudah pernah disimpan, tetapi kode rahasia di browser ini tidak ditemukan. Gunakan browser yang sama seperti saat memilih agar bisa mengesahkan suara.
              </div>
            )}
          </div>
        </section>
      </VoterShell>
    )
  }

  if (!selectedCandidate || !savedCommitment) {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Data pilihan belum siap</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">
            Pilih kandidat terlebih dahulu sebelum suara bisa disimpan dengan aman.
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
          Pastikan pilihanmu sudah benar. Setelah dikirim, pilihan akan dikunci sebagai bukti suara dan belum akan terlihat oleh orang lain.
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
                : 'Transaksi tidak bisa diproses oleh smart contract. Pastikan fase sudah Tahap Memilih dan wallet ini sudah masuk whitelist on-chain.'}
            </p>
          </div>
        </section>
      )}

      {commitBlockedReason ? (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-[13px] leading-7 text-amber-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p>
                {commitBlockedReason} Tombol dinonaktifkan agar dompet tidak membuka transaksi yang pasti gagal.
              </p>
              {(connectedWallet || profileWallet) ? (
                <p className="mt-2 text-[12px] text-amber-800/90">
                  Dompet tersambung: <span className="font-mono font-semibold">{connectedWallet ? formatWallet(connectedWallet) : 'Belum tersambung'}</span>
                  {' · '}Dompet akun: <span className="font-mono font-semibold">{profileWallet ? formatWallet(profileWallet) : 'Belum tertaut'}</span>
                </p>
              ) : null}
            </div>
            {contractAddress && (!isOnChainStatusReady || onChainStatusError) ? (
              <button
                type="button"
                onClick={handleRefreshOnChainStatus}
                disabled={isRefreshingOnChainStatus}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 text-[13px] font-semibold text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefreshingOnChainStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Periksa ulang status
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.85fr)]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat terpilih</p>
              <h2 className="mt-4 text-[24px] font-semibold text-slate-900">{selectedCandidate.name}</h2>
              <RichTextRenderer value={selectedCandidate.vision} className="mt-2 text-[18px] text-slate-700" />
            </div>
            <div className="flex h-[96px] w-[96px] items-center justify-center rounded-3xl bg-slate-200 text-[24px] font-semibold text-slate-600">
              {selectedCandidate.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            <DetailRow icon={Fingerprint} label="ID Pemilih" value={election.voterIdentifier} />
            <DetailRow icon={CalendarDays} label="Waktu Lokal" value={`${formatDateTime(savedCommitment.timestamp)} WIB`} />
          </div>
        </article>

        <article className="rounded-[28px] bg-[#0F172A] p-6 text-white shadow-sm md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-slate-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-8 text-[18px] font-semibold text-white">Ringkasan Penyimpanan Suara</h2>
          <p className="mt-4 text-[16px] leading-8 text-slate-300">
            Sistem sudah menyiapkan kode bukti di browser ini. Pilihan aslimu tetap tersembunyi sampai tahap konfirmasi suara dibuka.
          </p>

          <div className="mt-8 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-300">Kode bukti suara</p>
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
              Setelah pilihan disimpan, suara baru dihitung saat kamu mengesahkannya pada tahap berikutnya dengan browser yang sama.
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
          disabled={Boolean(commitBlockedReason) || isWritePending || isConfirming}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-6 text-[13px] font-semibold text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40 min-w-[200px]"
        >
          {isWritePending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menunggu persetujuan...
            </>
          ) : isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan suara...
            </>
          ) : (
            'Simpan Pilihan Saya'
          )}
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Simpan pilihan sekarang?"
        description="Setelah disimpan, kamu perlu kembali saat tahap konfirmasi dibuka. Gunakan browser yang sama agar kode rahasianya tetap terbaca."
        confirmLabel="Ya, Simpan Pilihan"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleCommit}
      />
    </VoterShell>
  )
}
