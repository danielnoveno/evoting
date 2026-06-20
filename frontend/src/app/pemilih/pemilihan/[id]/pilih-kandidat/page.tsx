'use client'

import { AlertCircle, ArrowRight, CheckCircle2, Clock3, Info, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'
import type { Address } from 'viem'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'
import { basescanTxUrl, findElection, formatDateTime, formatWallet, useVoterStore } from '@/lib/voter-store'
import { generateCommitment, generateSalt, saveVoteCommitment, type VoteCommitmentRecord } from '@/lib/vote-commitment-storage'
import { backendRuntimeConfig } from '@/lib/supabase/config'
import { useElectionContract } from '@/hooks/use-election-contract'
import { useToast } from '@/components/ui/toast-provider'
import { queueAutoRevealIntent } from '@/lib/auto-reveal-intents'

async function fetchLatestContractAddress(electionId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/public/elections/${electionId}`, { method: 'GET' })
    const payload: unknown = await response.json().catch(() => ({}))
    if (!response.ok || !payload || typeof payload !== 'object' || !('election' in payload)) return null

    const liveElection = payload.election
    if (!liveElection || typeof liveElection !== 'object' || !('deployedSpaceAddress' in liveElection)) return null
    return typeof liveElection.deployedSpaceAddress === 'string' && liveElection.deployedSpaceAddress.trim()
      ? liveElection.deployedSpaceAddress
      : null
  } catch {
    return null
  }
}

function sameWalletAddress(left: string | null | undefined, right: string | null | undefined) {
  return Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase())
}

function getWalletConnectionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (/user rejected|request rejected|user denied|user closed modal|accounts received is empty/i.test(message)) {
    return 'Penyambungan dompet dibatalkan. Coba lagi saat Anda siap.'
  }

  return 'Dompet digital belum berhasil tersambung. Coba sambungkan ulang melalui tombol yang tersedia.'
}

export default function PilihKandidatPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { address } = useAccount()
  const { connect, connectors, isPending: isConnectPending } = useConnect()
  const { showToast } = useToast()
  const { store, loading, actions } = useVoterStore()
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 8 })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [candidateToConfirm, setCandidateToConfirm] = useState<string | null>(null)
  const [pendingCommit, setPendingCommit] = useState<{
    candidateUuid: string
    candidateNumber: number
    contractAddress: string
    record: VoteCommitmentRecord
  } | null>(null)
  const [autoRevealQueueStatus, setAutoRevealQueueStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [autoRevealQueueError, setAutoRevealQueueError] = useState<string | null>(null)
  const [pendingCandidateAfterConnect, setPendingCandidateAfterConnect] = useState<string | null>(null)

  const election = findElection(store, params.id)
  const contractAddress = election?.deployedSpaceAddress ?? undefined
  const {
    commitVote,
    isWritePending,
    isConfirming,
    isConfirmed,
    hash,
    receipt,
    writeError,
    currentPhase,
    hasCommittedOnChain,
    isWhitelistedOnChain,
    phaseError,
    hasCommittedError,
    whitelistError,
  } = useElectionContract(contractAddress, { checks: ['phase', 'hasCommitted', 'isWhitelisted'] })

  const currentPhaseNumber = typeof currentPhase === 'number' || typeof currentPhase === 'bigint'
    ? Number(currentPhase)
    : null
  const isConnectedWalletProfileWallet = sameWalletAddress(address, store?.profile.wallet)
  const onChainStatusError = phaseError ?? whitelistError ?? hasCommittedError ?? null

  const voteBlockedReason = !contractAddress
    ? 'Pemilihan ini belum memiliki smart contract aktif.'
    : store?.profile.wallet && address && !isConnectedWalletProfileWallet
      ? `Dompet tersambung (${formatWallet(address)}) berbeda dari dompet akun ini (${formatWallet(store.profile.wallet)}).`
    : onChainStatusError
      ? 'Status blockchain belum terbaca. Coba muat ulang halaman sebelum mencoblos.'
    : currentPhaseNumber !== null && currentPhaseNumber !== 1
      ? 'Pencoblosan belum dibuka atau sudah selesai.'
    : isWhitelistedOnChain === false
      ? 'Dompet ini belum masuk daftar pemilih untuk pemilihan ini.'
    : hasCommittedOnChain === true
      ? 'Wallet ini sudah pernah mencoblos pada pemilihan ini.'
      : ''

  useEffect(() => {
    if (!isConfirmed || !hash || !receipt || !pendingCommit) return

    const proof = {
      txHash: hash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: Number(receipt.gasUsed),
      createdAt: new Date().toISOString(),
      statusLabel: 'Pilihan tersimpan',
    }

    actions.commitVote(params.id, pendingCommit.record.commitment, proof)
    setAutoRevealQueueStatus('saving')
    setAutoRevealQueueError(null)

    queueAutoRevealIntent({
      electionId: params.id,
      voterWallet: address ?? '',
      contractAddress: pendingCommit.contractAddress,
      candidateUuid: pendingCommit.candidateUuid,
      candidateNumber: pendingCommit.candidateNumber,
      salt: pendingCommit.record.salt,
      commitment: pendingCommit.record.commitment,
      commitTxHash: hash,
      blockNumber: Number(receipt.blockNumber),
    })
      .then(() => {
        setAutoRevealQueueStatus('saved')
        showToast({
          title: 'Suara berhasil dicoblos',
          description: 'Pilihanmu sudah terkunci. Sistem akan menghitung otomatis saat jadwal penghitungan dibuka.',
          tone: 'success',
        })
      })
      .catch((error: Error) => {
        setAutoRevealQueueStatus('failed')
        setAutoRevealQueueError(error.message)
        showToast({
          title: 'Pilihan tersimpan, antrean otomatis perlu dicek',
          description: 'Transaksi commit berhasil, tetapi sistem belum berhasil menyimpan antrean penghitungan otomatis.',
          tone: 'error',
        })
      })
  }, [isConfirmed, hash, receipt, pendingCommit, actions, params.id, address, showToast])

  useEffect(() => {
    if (!election?.deadlineIso) return

    const target = new Date(election.deadlineIso).getTime()
    const updateTimer = () => {
      const now = new Date().getTime()
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft({ hours, minutes, seconds })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [election?.deadlineIso])

  useEffect(() => {
    if (address && pendingCandidateAfterConnect && !isConnectPending) {
      setCandidateToConfirm(pendingCandidateAfterConnect)
      setConfirmOpen(true)
      setPendingCandidateAfterConnect(null)
    }
  }, [address, pendingCandidateAfterConnect, isConnectPending])

  if (loading || !store) {
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

  const stepState = [
    { label: 'Coblos kandidat', description: 'Pilih satu nama', active: true },
    { label: 'Kunci pilihan', description: 'Tercatat di blockchain' },
    { label: 'Pengesahan suara', description: 'Otomatis oleh sistem' },
    { label: 'Lihat hasil', description: 'Cek hasil akhir' },
  ]

  const handleSelectClick = (candidateId: string) => {
    if (!address) {
      const connector = connectors.find((item) => item.id === 'baseAccount') ?? connectors[0]
      if (!connector) {
        showToast({ title: 'Dompet belum siap', description: 'Connector Base Account belum tersedia. Coba muat ulang halaman.', tone: 'error' })
        return
      }
      setPendingCandidateAfterConnect(candidateId)
      connect(
        { connector },
        {
          onSuccess: () => {
            setCandidateToConfirm(candidateId)
            setConfirmOpen(true)
            setPendingCandidateAfterConnect(null)
          },
          onError: (error) => {
            showToast({ title: 'Gagal menyambungkan dompet', description: getWalletConnectionErrorMessage(error), tone: 'error' })
            setPendingCandidateAfterConnect(null)
          },
        },
      )
      return
    }
    setCandidateToConfirm(candidateId)
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (candidateToConfirm) {
      const candidate = election.candidates.find(c => c.id === candidateToConfirm)
      const candidateNumber = election.candidates.findIndex(c => c.id === candidateToConfirm) + 1
      const deployedSpaceAddress = election.deployedSpaceAddress ?? await fetchLatestContractAddress(election.id)
      const voterWallet = address

      if (!voterWallet) {
        setConfirmOpen(false)
        const connector = connectors.find((item) => item.id === 'baseAccount') ?? connectors[0]
        if (!connector) {
          showToast({ title: 'Dompet belum siap', description: 'Connector Base Account belum tersedia. Coba muat ulang halaman.', tone: 'error' })
          return
        }
        setPendingCandidateAfterConnect(candidateToConfirm)
        connect(
          { connector },
          {
            onSuccess: () => {
              setCandidateToConfirm(candidateToConfirm)
              setConfirmOpen(true)
              setPendingCandidateAfterConnect(null)
            },
            onError: (error) => {
              showToast({ title: 'Gagal menyambungkan dompet', description: getWalletConnectionErrorMessage(error), tone: 'error' })
              setPendingCandidateAfterConnect(null)
            },
          },
        )
        return
      }

      if (voteBlockedReason) {
        setConfirmOpen(false)
        showToast({
          title: 'Belum bisa mencoblos',
          description: voteBlockedReason,
          tone: 'info',
        })
        return
      }

      if (!deployedSpaceAddress) {
        setConfirmOpen(false)
        showToast({ title: 'Kontrak belum tersedia', description: 'Alamat smart contract untuk ruang voting ini belum terbaca.', tone: 'error' })
        return
      }

      if (address && store.profile.wallet && !sameWalletAddress(address, store.profile.wallet)) {
        setConfirmOpen(false)
        showToast({ title: 'Dompet tidak sesuai', description: 'Sambungkan dompet yang sama dengan profil pemilih sebelum mencoblos.', tone: 'error' })
        return
      }

      if (!candidate || candidateNumber <= 0) {
        setConfirmOpen(false)
        showToast({ title: 'Kandidat tidak valid', description: 'Pilih kandidat dari daftar yang tersedia.', tone: 'error' })
        return
      }

      actions.selectCandidate(election.id, candidateToConfirm)
      
      const salt = generateSalt()
      const commitment = generateCommitment(
        candidateNumber,
        salt,
        voterWallet as Address,
        deployedSpaceAddress as Address,
        backendRuntimeConfig.chainId,
      )
      const record = {
        candidateId: candidateToConfirm,
        salt,
        commitment,
        timestamp: new Date().toISOString()
      }
      saveVoteCommitment(election.id, record)
      setPendingCommit({
        candidateUuid: candidateToConfirm,
        candidateNumber,
        contractAddress: deployedSpaceAddress,
        record,
      })
      setAutoRevealQueueStatus('idle')
      setAutoRevealQueueError(null)
      commitVote(commitment)
    }
    setConfirmOpen(false)
  }

  const formatTimeVal = (val: number) => String(val).padStart(2, '0')
  const committedCandidate = election.candidates.find((candidate) => candidate.id === (pendingCommit?.candidateUuid ?? election.committedCandidateId ?? election.selectedCandidateId))
  const commitProof = election.commitProof || (isConfirmed && hash && receipt ? {
    txHash: hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: Number(receipt.gasUsed),
    createdAt: new Date().toISOString(),
    statusLabel: 'Pilihan tersimpan',
  } : null)

  if (commitProof || hasCommittedOnChain) {
    return (
      <VoterShell>
        <VoterStepper
          steps={[
            { label: 'Coblos kandidat', description: 'Pilih satu nama', done: true },
            { label: 'Kunci pilihan', description: 'Tercatat di blockchain', done: true },
            { label: 'Hitung otomatis', description: 'Dikerjakan sistem', active: true },
            { label: 'Lihat hasil', description: 'Cek hasil akhir' },
          ]}
        />

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm md:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-[24px] font-semibold text-slate-900">Suara berhasil dicoblos</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-7 text-slate-700">
            Pilihanmu sudah dikunci di blockchain. Kamu tidak perlu melakukan konfirmasi manual; sistem akan menghitung suara otomatis saat jadwal penghitungan dibuka.
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 text-left md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat yang dicoblos</p>
              <h2 className="mt-3 text-[20px] font-semibold text-slate-900">{committedCandidate?.name ?? 'Pilihan tersimpan'}</h2>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">Detail pilihan akan dibuka oleh sistem pada tahap penghitungan otomatis.</p>
            </article>
            <article className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">Status penghitungan otomatis</p>
              <p className="mt-3 text-[15px] font-semibold text-slate-900">
                {autoRevealQueueStatus === 'saving'
                  ? 'Menyiapkan antrean penghitungan...'
                  : autoRevealQueueStatus === 'failed'
                    ? 'Antrean perlu dicek admin/TU'
                    : 'Antrean penghitungan otomatis siap'}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                {autoRevealQueueError ?? 'Saat waktu penghitungan tiba, relayer tepercaya akan mengesahkan suara ke smart contract.'}
              </p>
            </article>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {commitProof ? (
              <a
                href={basescanTxUrl(commitProof.txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 hover:bg-slate-50"
              >
                Lihat Bukti Transaksi
              </a>
            ) : null}
            <Link href="/pemilih" className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0F172A] px-5 text-[13px] font-semibold text-white hover:bg-[#1E293B]">
              Kembali ke Beranda
            </Link>
          </div>
        </section>
      </VoterShell>
    )
  }

  return (
    <VoterShell>
      <VoterStepper steps={stepState} />

      <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0F172A] p-6 text-white">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] items-center">
          <div>
            <span className="inline-flex rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-400">
              STATUS SAAT INI
            </span>
            <h1 className="mt-3 text-[26px] font-bold tracking-tight text-white md:text-[32px]">
              {voteBlockedReason
                ? 'Belum Bisa Mencoblos'
                : !address
                  ? 'Siapkan Dompet'
                  : currentPhaseNumber === 1
                    ? 'Saatnya Mencoblos'
                    : 'Menunggu Jadwal'}
            </h1>
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-slate-300">
              {voteBlockedReason
                ? voteBlockedReason
                : !address
                  ? 'Sambungkan dompet yang tertaut ke akun ini untuk mulai mencoblos. Kandidat bisa dilihat tanpa dompet.'
                : currentPhaseNumber === 1
                  ? 'Pilih satu kandidat lalu konfirmasi di dompet. Setelah itu selesai; sistem akan menghitung suara otomatis saat jadwal penghitungan dibuka.'
                  : 'Pencoblosan belum dimulai. Kamu bisa melihat kandidat terlebih dahulu, lalu coblos saat masa pencoblosan dibuka.'}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end justify-center shrink-0 border-t border-slate-800 md:border-t-0 md:pl-6 pt-4 md:pt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">WAKTU TERSISA</span>
            <div className="mt-2.5 flex items-center gap-1.5 font-mono">
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-[18px] font-bold text-white shadow-inner">
                  {formatTimeVal(timeLeft.hours)}
                </div>
                <span className="mt-1 text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Jam</span>
              </div>
              <span className="text-white text-[16px] font-bold select-none mb-4">:</span>
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-[18px] font-bold text-white shadow-inner">
                  {formatTimeVal(timeLeft.minutes)}
                </div>
                <span className="mt-1 text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Menit</span>
              </div>
              <span className="text-white text-[16px] font-bold select-none mb-4">:</span>
              <div className="flex flex-col items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-[18px] font-bold text-white shadow-inner">
                  {formatTimeVal(timeLeft.seconds)}
                </div>
                <span className="mt-1 text-[8px] font-semibold text-slate-500 uppercase tracking-widest">Detik</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10 flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Kandidat Aktif</h2>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
            {election.title}
          </p>
        </div>
        <span className="mt-2 sm:mt-0 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-sm">
          {election.candidates.length} Kandidat Terdaftar
        </span>
      </section>

      <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-[12.5px] leading-relaxed text-blue-900">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-blue-700" />
          <p>
            Setelah mencoblos, kamu tidak perlu melakukan konfirmasi suara manual. Votein akan menyiapkan antrean penghitungan otomatis menggunakan relayer tepercaya saat waktunya tiba.
          </p>
        </div>
      </section>

      {!address ? (
        <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-[13px] leading-7 text-blue-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold">Dompet belum tersambung</p>
              <p className="mt-1">Klik "Coblos Kandidat Ini" pada kandidat pilihanmu. Sistem akan meminta penyambungan dompet secara otomatis.</p>
            </div>
          </div>
        </section>
      ) : (voteBlockedReason || writeError) ? (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-7 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold">Belum bisa mencoblos</p>
              <p className="mt-1">
                {writeError
                  ? 'Transaksi belum berhasil diproses. Pastikan wallet siap dan pemilihan sudah berada pada masa pencoblosan.'
                  : voteBlockedReason}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {election.candidates.map((candidate, index) => {
          return (
            <article
              key={candidate.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-slate-300"
            >
              <div>
                <div className="relative overflow-hidden bg-slate-50 border-b border-slate-100">
                  <div className="flex h-[250px] w-full items-center justify-center bg-slate-200 text-[36px] font-semibold text-slate-600 transition-transform duration-500 group-hover:scale-105">
                    {candidate.avatarPath ? (
                      <img
                        src={candidate.avatarPath}
                        alt={candidate.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                          ;(e.target as HTMLImageElement).parentElement!.innerHTML = candidate.name.slice(0, 2).toUpperCase()
                        }}
                      />
                    ) : (
                      candidate.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                   <div className="absolute top-3 left-3 rounded border border-white/10 bg-black/85 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                    K0{index + 1}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                    {candidate.name}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {candidate.faculty}
                  </p>

                  <div className="mt-4 space-y-3.5">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">Visi</h4>
                      <RichTextRenderer value={candidate.vision} className="mt-1 text-[12.5px] leading-relaxed text-slate-700 line-clamp-3" />
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">Misi</h4>
                      <ul className="mt-1.5 space-y-1">
                        {candidate.mission.map((item, mIndex) => (
                          <li key={mIndex} className="text-[12px] leading-relaxed text-slate-600 flex items-start gap-1.5">
                            <span className="text-slate-400 font-bold select-none shrink-0">•</span>
                            <RichTextRenderer value={item} className="line-clamp-2" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => handleSelectClick(candidate.id)}
                  disabled={isWritePending || isConfirming || hasCommittedOnChain === true}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0F172A] px-4 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Pilih kandidat ${candidate.name}`}
                >
                  {isWritePending || isConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : isConnectPending && pendingCandidateAfterConnect === candidate.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyambungkan...
                    </>
                  ) : hasCommittedOnChain === true ? (
                    'Sudah Mencoblos'
                  ) : (
                    <>
                      Coblos Kandidat Ini
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </article>
          )
        })}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <Clock3 className="h-4.5 w-4.5 shrink-0 text-slate-400" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500">Batas waktu memilih</p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-slate-900">
              {formatDateTime(election.deadlineIso)} WIB
            </p>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Coblos kandidat ini?"
        description="Setelah kamu konfirmasi di dompet, pilihan akan dikunci di blockchain dan sistem akan menghitung otomatis saat jadwal penghitungan dibuka. Pilihan tidak bisa diubah."
        confirmLabel="Ya, Coblos Sekarang"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </VoterShell>
  )
}
