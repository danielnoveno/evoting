'use client'

import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, Clock3, ExternalLink, Info, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'
import { basescanTxUrl, findElection, formatDateTime, formatWallet, useVoterStore } from '@/lib/voter-store'
import { generateCommitment, generateSalt, saveVoteCommitment, type VoteCommitmentRecord } from '@/lib/vote-commitment-storage'
import { useElectionContract } from '@/hooks/use-election-contract'
import { useToast } from '@/components/ui/toast-provider'
import { resolveSchedulePhase } from '@/lib/election-phase'
import { sameWalletAddress } from '@/lib/repositories/helpers'

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

export default function PilihKandidatPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast()
  const { store, loading, actions } = useVoterStore()
  const { address: connectedWallet, isConnecting } = useAccount()
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
  const election = findElection(store, params.id)
  const contractAddress = election?.deployedSpaceAddress ?? undefined
  const profileWallet = store?.profile.wallet ?? ''
  const isWalletReady = Boolean(profileWallet && connectedWallet && sameWalletAddress(profileWallet, connectedWallet))
  const walletError = connectedWallet && profileWallet && !sameWalletAddress(profileWallet, connectedWallet)
    ? 'Dompet tersambung berbeda dari dompet aktivasi voter. Putuskan koneksi lalu sambungkan dompet yang dipakai saat aktivasi.'
    : null
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
  } = useElectionContract(contractAddress, { checks: ['phase', 'hasCommitted', 'isWhitelisted'], voterAddress: profileWallet })

  const currentPhaseNumber = typeof currentPhase === 'number' || typeof currentPhase === 'bigint'
    ? Number(currentPhase)
    : null
  const onChainStatusError = phaseError ?? whitelistError ?? hasCommittedError ?? null

  const hasSchedule = Boolean(election?.commitStartAt || election?.revealStartAt || election?.endedAt)
  const liveSchedulePhase = election && hasSchedule
    ? resolveSchedulePhase({
        status: 'deployed',
        commitStartAt: election.commitStartAt,
        revealStartAt: election.revealStartAt,
        endedAt: election.endedAt,
      })
    : null
  const dbPhase = liveSchedulePhase?.phase ?? election?.phase ?? 'commit'
  // Use DB schedule as the user-facing source of truth. On-chain phase is used
  // only as an extra safety guard while submitting a commit transaction.
  const effectivePhase: 'commit' | 'reveal' | 'ended' | 'suspended' | 'registration' = dbPhase === 'suspended' ? 'suspended' : dbPhase
  const effectivePhaseNumber = effectivePhase === 'commit' ? 1 : effectivePhase === 'reveal' ? 2 : effectivePhase === 'ended' ? 3 : 0
  const onChainPhaseLabel = currentPhaseNumber === 0
    ? 'Pencoblosan'
    : currentPhaseNumber === 1
      ? 'Konfirmasi Suara'
    : currentPhaseNumber === 2
        ? 'Selesai'
        : 'belum terbaca'
  const onChainCommitBlockedReason = !profileWallet
    ? ''
    : currentPhaseNumber === null
      ? 'Status fase blockchain belum terbaca. Coba muat ulang halaman sebelum mencoblos.'
    : currentPhaseNumber !== 0
      ? `Jadwal aplikasi sudah masuk masa pencoblosan, tetapi fase blockchain masih ${onChainPhaseLabel}. Admin perlu sinkronkan jadwal ke blockchain terlebih dahulu.`
    : isWhitelistedOnChain === false
      ? 'Wallet ini belum masuk whitelist on-chain. Admin perlu sinkronkan daftar pemilih ke blockchain terlebih dahulu.'
    : hasCommittedOnChain === true
      ? 'Wallet ini sudah pernah mencoblos pada pemilihan ini.'
      : ''

  const voteBlockedReason = !contractAddress
    ? 'Pemilihan ini belum memiliki smart contract aktif.'
    : effectivePhase === 'suspended'
      ? 'Pemilihan ini sedang ditangguhkan oleh superadmin. Pencoblosan dihentikan sementara hingga proses tinjauan selesai.'
    : !isWalletReady
      ? walletError ?? 'Sambungkan dompet yang dipakai saat aktivasi voter sebelum mencoblos.'
    : onChainStatusError
      ? 'Status blockchain belum terbaca. Coba muat ulang halaman sebelum mencoblos.'
    : effectivePhaseNumber !== 1
      ? effectivePhase === 'reveal'
          ? 'Masa mencoblos sudah berakhir. Sistem sedang menunggu pengesahan otomatis dan penghitungan suara.'
        : effectivePhase === 'ended'
          ? 'Pemilihan ini sudah selesai.'
          : 'Pencoblosan belum dibuka atau sudah selesai.'
    : onChainCommitBlockedReason
      ? onChainCommitBlockedReason
      : ''

  const countdownTargetIso = effectivePhase === 'suspended'
    ? null
    : effectivePhase === 'commit'
      ? election?.revealStartAt ?? election?.deadlineIso ?? null
      : effectivePhase === 'reveal'
        ? election?.endedAt ?? election?.deadlineIso ?? null
        : null
  const countdownLabel = effectivePhase === 'suspended'
    ? 'PEMILIHAN DITANGGUHKAN'
    : effectivePhase === 'commit'
        ? 'SISA WAKTU MENCOBLOS'
        : effectivePhase === 'reveal'
          ? 'PENGHITUNGAN BERAKHIR DALAM'
          : 'WAKTU TERSISA'

  useEffect(() => {
    if (!isConfirmed || !hash || !receipt || !pendingCommit) return

    const proof = {
      txHash: receipt.transactionHash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: Number(receipt.gasUsed),
      createdAt: new Date().toISOString(),
      statusLabel: 'Bukti commit tersimpan',
    }

    actions.commitVote(params.id, pendingCommit.record.commitment, proof)
    setAutoRevealQueueStatus('saving')
    setAutoRevealQueueError(null)

    // Save salt to server for auto-reveal (fire-and-forget)
    ;(async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser')
        const client = getSupabaseBrowserClient()
        const { data: sessionData } = await client?.auth.getSession() ?? { data: { session: null } }
        const accessToken = sessionData?.session?.access_token

        if (accessToken && election?.deployedSpaceAddress) {
          const res = await fetch('/api/voter/commit-store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify({
              electionId: params.id,
              spaceAddress: election.deployedSpaceAddress,
              voterAddress: profileWallet,
              candidateId: pendingCommit.candidateNumber,
              salt: pendingCommit.record.salt,
              commitmentHash: pendingCommit.record.commitment,
              commitTxHash: receipt.transactionHash,
            }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Gagal menyimpan ke server' }))
            console.error('[commit-store] Failed:', err)
            setAutoRevealQueueStatus('failed')
            setAutoRevealQueueError('Pengesahan otomatis belum siap. Hubungi admin/TU jika status ini tidak berubah saat fase penghitungan dibuka.')
          } else {
            setAutoRevealQueueStatus('saved')
          }
        } else {
          setAutoRevealQueueStatus('failed')
          setAutoRevealQueueError('Sesi tidak terbaca, sehingga antrean pengesahan otomatis belum tersimpan. Hubungi admin/TU jika diperlukan.')
        }
      } catch (err) {
        console.error('[commit-store] Error:', err)
        setAutoRevealQueueStatus('failed')
        setAutoRevealQueueError('Pengesahan otomatis belum siap. Hubungi admin/TU jika status ini tidak berubah saat fase penghitungan dibuka.')
      }
    })()

    showToast({
      title: 'Suara berhasil dicoblos',
      description: 'Komitmen suara tersimpan. Sistem akan mencoba mengesahkan suara otomatis saat fase penghitungan dibuka.',
      tone: 'success',
    })
  }, [isConfirmed, hash, receipt, pendingCommit, actions, params.id, showToast])

  useEffect(() => {
    if (!countdownTargetIso) {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      return
    }

    const target = new Date(countdownTargetIso).getTime()
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
  }, [countdownTargetIso])

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
    { label: 'Pengesahan otomatis', description: 'Oleh sistem' },
    { label: 'Lihat hasil', description: 'Cek hasil akhir' },
  ]

  const handleSelectClick = (candidateId: string) => {
    if (voteBlockedReason) {
      showToast({ title: 'Belum bisa mencoblos', description: voteBlockedReason, tone: 'info' })
      return
    }

    if (!isWalletReady) {
      showToast({ title: 'Dompet aktivasi belum siap', description: walletError ?? 'Sambungkan dompet yang dipakai saat aktivasi voter.', tone: 'info' })
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
      const voterWallet = profileWallet

      if (!voterWallet) {
        setConfirmOpen(false)
        showToast({ title: 'Dompet aktivasi belum siap', description: 'Profil voter belum memiliki wallet aktivasi.', tone: 'info' })
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

      if (!connectedWallet || !sameWalletAddress(voterWallet, connectedWallet)) {
        setConfirmOpen(false)
        showToast({ title: 'Dompet tidak sesuai', description: walletError ?? 'Sambungkan dompet yang dipakai saat aktivasi voter.', tone: 'error' })
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
        voterWallet as `0x${string}`,
        deployedSpaceAddress as `0x${string}`,
        baseSepolia.id,
      )
      const record = {
        candidateId: candidateToConfirm,
        salt,
        commitment,
        timestamp: new Date().toISOString(),
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
  const candidateBeingConfirmed = election.candidates.find((candidate) => candidate.id === candidateToConfirm)
  const committedCandidate = election.candidates.find((candidate) => candidate.id === (pendingCommit?.candidateUuid ?? election.committedCandidateId ?? election.selectedCandidateId))
  const commitProof = election.commitProof || (isConfirmed && hash && receipt ? {
    txHash: receipt.transactionHash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: Number(receipt.gasUsed),
    createdAt: new Date().toISOString(),
    statusLabel: 'Bukti commit tersimpan',
  } : null)

  if (commitProof || hasCommittedOnChain) {
    return (
      <VoterShell>
        <VoterStepper
          steps={[
            { label: 'Coblos kandidat', description: 'Pilih satu nama', done: true },
            { label: 'Kunci pilihan', description: 'Tercatat di blockchain', done: true },
            { label: 'Pengesahan otomatis', description: 'Menunggu sistem', active: true },
            { label: 'Lihat hasil', description: 'Cek hasil akhir' },
          ]}
        />

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm md:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-[24px] font-semibold text-slate-900">Suara berhasil dicoblos</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-7 text-slate-700">
            Komitmen suara sudah tercatat di blockchain. Kamu boleh keluar dari sistem; pengesahan akan dicoba otomatis saat fase penghitungan dibuka.
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 text-left md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat yang dicoblos</p>
              <h2 className="mt-3 text-[20px] font-semibold text-slate-900">{committedCandidate?.name ?? 'Komitmen tersimpan'}</h2>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">Detail pilihan akan dibuka saat sistem berhasil mengesahkan suara pada tahap penghitungan.</p>
            </article>
            <article className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">Status pengesahan otomatis</p>
              <p className="mt-3 text-[15px] font-semibold text-slate-900">
                {autoRevealQueueStatus === 'saving'
                  ? 'Menyiapkan antrean penghitungan...'
                  : autoRevealQueueStatus === 'failed'
                    ? 'Pengesahan perlu dicek admin/TU'
                    : autoRevealQueueStatus === 'saved'
                      ? 'Terdaftar untuk pengesahan otomatis'
                      : 'Menunggu fase penghitungan'}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                {autoRevealQueueError ?? 'Saat fase penghitungan dibuka, sistem akan mencoba mengirim transaksi reveal melalui relayer. Kamu tidak perlu masuk lagi hanya untuk reveal.'}
              </p>
            </article>
          </div>

          {/* Transaction Proof Section */}
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Bukti Transaksi Blockchain</p>
            <div className="mt-4 space-y-3">
              {profileWallet && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-[12px] font-semibold text-slate-500 min-w-[140px]">Alamat Pemilih</span>
                  <span className="font-mono text-[12px] text-slate-700 break-all" title={profileWallet}>{formatWallet(profileWallet)}</span>
                </div>
              )}
              {commitProof?.txHash && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-[12px] font-semibold text-slate-500 min-w-[140px]">Tx Hash</span>
                  <span className="font-mono text-[12px] text-slate-700 break-all" title={commitProof.txHash}>{formatWallet(commitProof.txHash)}</span>
                </div>
              )}
              {commitProof?.blockNumber && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-[12px] font-semibold text-slate-500 min-w-[140px]">Block Number</span>
                  <span className="font-mono text-[12px] text-slate-700">#{commitProof.blockNumber}</span>
                </div>
              )}
              {contractAddress && (
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-[12px] font-semibold text-slate-500 min-w-[140px]">Kontrak</span>
                  <span className="font-mono text-[12px] text-slate-700 break-all" title={contractAddress}>{formatWallet(contractAddress)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {commitProof ? (
              <a
                href={basescanTxUrl(commitProof.txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 hover:bg-slate-50"
              >
                Lihat Transaksi di Basescan
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : hasCommittedOnChain && contractAddress ? (
              <a
                href={`https://sepolia.basescan.org/address/${contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 hover:bg-slate-50"
              >
                Lihat Kontrak di Basescan
                <ExternalLink className="h-4 w-4" />
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
              {effectivePhase === 'suspended'
                ? 'Pemilihan Ditangguhkan'
                : voteBlockedReason
                  ? effectivePhase === 'reveal'
                    ? 'Masa Mencoblos Selesai'
                    : 'Belum Bisa Mencoblos'
                    : !isWalletReady
                        ? 'Sambungkan Dompet Aktivasi'
                        : effectivePhaseNumber === 1
                          ? 'Saatnya Mencoblos'
                          : 'Menunggu Jadwal'}
            </h1>
            <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-slate-300">
              {effectivePhase === 'suspended'
                ? 'Pemilihan ini sedang ditangguhkan oleh superadmin. Pencoblosan dihentikan sementara hingga proses tinjauan selesai. Hubungi admin atau superadmin untuk informasi lebih lanjut.'
                : voteBlockedReason
                  ? voteBlockedReason
                  : !isWalletReady
                        ? walletError ?? 'Sambungkan dompet yang dipakai saat aktivasi voter sebelum mencoblos.'
                      : effectivePhaseNumber === 1
                        ? 'Pilih satu kandidat lalu konfirmasi. Saat jadwal penghitungan dibuka, sistem akan mencoba mengesahkan suara otomatis.'
                        : 'Pencoblosan belum dimulai. Kamu bisa melihat kandidat terlebih dahulu, lalu coblos saat masa pencoblosan dibuka.'}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end justify-center shrink-0 border-t border-slate-800 md:border-t-0 md:pl-6 pt-4 md:pt-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{countdownLabel}</span>
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
            Setelah mencoblos, sistem menyimpan data teknis yang diperlukan untuk pengesahan otomatis. Saat tahap penghitungan dibuka, relayer akan mencoba mengirim transaksi reveal sehingga kamu tidak perlu masuk lagi hanya untuk reveal.
          </p>
        </div>
      </section>

      {effectivePhase === 'suspended' && (
        <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-[13px] leading-7 text-red-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Pemilihan Ditangguhkan</p>
              <p className="mt-1">
                Pemilihan ini sedang ditangguhkan oleh superadmin. Pencoblosan dihentikan sementara hingga proses tinjauan selesai.
              </p>
              <p className="mt-2 text-[12px] text-red-700">
                Hubungi admin organisasi atau superadmin untuk informasi lebih lanjut mengenai alasan penangguhan dan kapan pemilihan akan dilanjutkan.
              </p>
            </div>
          </div>
        </section>
      )}

      {isConnecting ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-7 text-slate-600">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-slate-500" />
            <div>
              <p className="font-semibold">Menyambungkan dompet</p>
              <p className="mt-1">Sistem sedang menyambungkan dompet aktivasi Anda. Tunggu sebentar...</p>
            </div>
          </div>
        </section>
      ) : !isWalletReady && effectivePhaseNumber === 1 ? (
        <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-[13px] leading-7 text-blue-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold">Dompet aktivasi belum siap</p>
              <p className="mt-1">{walletError ?? 'Sambungkan dompet yang dipakai saat aktivasi voter sebelum mencoblos.'}</p>
            </div>
          </div>
        </section>
      ) : walletError ? (
        <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] leading-7 text-red-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold">Dompet aktivasi tidak sesuai</p>
              <p className="mt-1">{walletError}</p>
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
                    ? 'Transaksi belum berhasil diproses. Pastikan pemilihan sudah berada pada masa pencoblosan.'
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
                      <RichTextRenderer value={candidate.vision} className="mt-1 text-[12.5px] leading-relaxed text-slate-700" />
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">Misi</h4>
                      <RichTextRenderer
                        value={candidate.mission.join('\n')}
                        className="mt-1.5 text-[12px] leading-relaxed text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  type="button"
                  onClick={() => handleSelectClick(candidate.id)}
                  disabled={Boolean(voteBlockedReason) || !isWalletReady || isWritePending || isConfirming || hasCommittedOnChain === true}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0F172A] px-4 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Pilih kandidat ${candidate.name}`}
                >
                  {isWritePending || isConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses...
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
        title="Pastikan pilihan sudah benar"
        description={(
          <div className="space-y-4">
            <p>
              Kamu akan mencoblos kandidat berikut. Setelah dikunci di blockchain, pilihan tidak bisa diubah.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat yang dipilih</p>
              <p className="mt-2 text-[16px] font-semibold text-slate-900">{candidateBeingConfirmed?.name ?? 'Kandidat belum dipilih'}</p>
              <p className="mt-1 text-[12px] font-medium text-slate-600">{candidateBeingConfirmed?.faculty ?? 'Data kandidat belum tersedia'}</p>
            </div>
            <p className="text-[13px] text-slate-600">
              Sistem akan mengirim transaksi commit dari dompet aktivasi kamu. Gas dapat disponsori paymaster, tetapi alamat pemilih tetap sama.
            </p>
          </div>
        )}
        confirmLabel="Ya, Pilihan Sudah Benar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </VoterShell>
  )
}
