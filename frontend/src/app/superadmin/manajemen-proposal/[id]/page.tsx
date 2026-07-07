'use client'

import { BadgeCheck, CalendarDays, Check, CircleAlert, Download, ExternalLink, FileText, Landmark, ListChecks, ShieldCheck, ThumbsDown, ThumbsUp, Loader2, Rocket, Eye, UserRound, Youtube, Users, Clock3, Link, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useEffect } from 'react'
import {
  SuperadminDetailIntro,
  SuperadminEmptyState,
  SuperadminInteractiveCard,
  SuperadminSectionCard,
  SuperadminShell,
  SuperadminStatusBadge,
} from '@/components/superadmin/superadmin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { useProposalActivities, useProposalDraft, useUpdateProposalStatus } from '@/hooks/use-proposal-draft'
import { useQuery } from '@tanstack/react-query'
import { listProposalDocuments } from '@/lib/repositories/proposalDocumentRepository'
import { useProposalCandidates, useProposalWhitelistEntries } from '@/hooks/use-proposal-relations'
import { REGISTRY_ADDRESS, useRegistryContract } from '@/hooks/use-registry-contract'
import { createProposalDocumentPreviewUrl, createProposalDocumentSignedUrl } from '@/lib/repositories/proposalDocumentRepository'
import { updateWhitelistSyncStatus } from '@/lib/repositories/whitelistRepository'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'
import type { SuperadminProposalDetail } from '@/lib/superadmin-data'
import { isAddress, type Address } from 'viem'
import { useConnect, useDisconnect } from 'wagmi'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

type DecisionType = 'approve' | 'revise' | 'reject' | 'deploy' | null

const BASE_SEPOLIA_CHAIN_ID = 84532

function toUnixSeconds(value: string | null | undefined) {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? BigInt(Math.floor(time / 1000)) : null
}

function getDeployErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('user rejected') || lowerMessage.includes('rejected request')) {
    return 'Transaksi dibatalkan dari wallet.'
  }

  if (lowerMessage.includes('not connected') || lowerMessage.includes('connector not connected')) {
    return 'Wallet belum tersambung. Sambungkan Smart Wallet superadmin terlebih dahulu.'
  }

  if (lowerMessage.includes('wallet must has at least one account') || lowerMessage.includes('accounts received is empty')) {
    return 'Smart Wallet belum memiliki akun aktif. Buka popup wallet, selesaikan pembuatan/login akun, lalu coba lagi.'
  }

  if (lowerMessage.includes('notsuperadmin')) {
    return 'Wallet yang tersambung belum terdaftar sebagai superadmin di kontrak registry Base Sepolia. Hubungi superadmin on-chain lain untuk mendaftarkan wallet Anda melalui halaman Manajemen Superadmin > Daftarkan On-Chain, lalu sambungkan ulang wallet ini.'
  }

  if (lowerMessage.includes('invalidcandidatecount')) {
    return 'Jumlah kandidat belum valid, sehingga pemilihan belum bisa di-deploy.'
  }

  if (lowerMessage.includes('chain') || lowerMessage.includes('network')) {
    return 'Jaringan wallet belum Base Sepolia. Ubah network ke Base Sepolia lalu coba lagi.'
  }

  return 'Transaksi deploy belum berhasil. Pastikan wallet superadmin tersambung, jaringan Base Sepolia aktif, dan saldo gas tersedia.'
}

export default function SuperadminProposalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { connect, connectors, isPending: isConnectPending } = useConnect()
  const { disconnect } = useDisconnect()
  const proposalQuery = useProposalDraft(params.id)
  const proposalDocumentsQuery = useQuery({
    queryKey: ['proposal-documents', params.id ?? 'unknown'],
    queryFn: () => listProposalDocuments(params.id ?? ''),
    enabled: Boolean(params.id),
    retry: false,
  })
  const proposalCandidatesQuery = useProposalCandidates(params.id)
  const proposalWhitelistQuery = useProposalWhitelistEntries(params.id)
  const proposalActivitiesQuery = useProposalActivities(params.id)
  const updateStatus = useUpdateProposalStatus()
  
  // Real contract integration
  const { 
    createElectionForAdminWithConfig,
    parseElectionSpaceCreated,
    userAddress,
    isConnected,
    chainId,
    isSuperAdmin,
    isSuperAdminLoading,
    superAdminAddress,
    registryAddress,
    isWritePending, 
    isConfirming, 
    isConfirmed, 
    hash, 
    writeError,
    receipt,
    resetWrite
  } = useRegistryContract()

  const liveProposal = proposalQuery.data
  const proposalDocuments = proposalDocumentsQuery.data ?? []
  const proposalCandidates = proposalCandidatesQuery.data ?? []
  const proposalWhitelistEntries = proposalWhitelistQuery.data ?? []
  const proposalActivities = proposalActivitiesQuery.data ?? []
  const initialWhitelistWallets = useMemo(() => {
    return Array.from(new Set(
      proposalWhitelistEntries
        .map((entry) => entry.walletAddress.trim().toLowerCase())
        .filter((wallet) => isAddress(wallet))
    ))
  }, [proposalWhitelistEntries])

  const proposal = useMemo<SuperadminProposalDetail | null>(() => {
    if (!liveProposal) return null

    return {
      id: liveProposal.id,
      badge: liveProposal.status === 'draft' ? 'Draf' : liveProposal.status === 'submitted' ? 'Menunggu Review' : liveProposal.status === 'revision_requested' ? 'Perlu Revisi' : liveProposal.status === 'approved' ? 'Disetujui' : liveProposal.status === 'deployed' ? 'Berjalan' : liveProposal.status === 'archived' ? 'Dibatalkan' : liveProposal.status,
      proposalCode: `PROPOSAL-${liveProposal.id.slice(0, 8).toUpperCase()}`,
      title: liveProposal.title,
      organizationName: liveProposal.organizationName ?? 'Organisasi Tanpa Nama',
      submittedAt: new Date(liveProposal.createdAt).toLocaleDateString('id-ID'),
      summary: [
        liveProposal.description ?? 'Tidak ada deskripsi.',
      ],
      networkConfig: {
        contractAddress: liveProposal.deployedSpaceAddress ?? 'Pending Deployment',
        consensus: 'Commit-Reveal + Whitelist',
      },
      objectives: [
        { id: 'obj-1', title: 'Data proposal dasar tersedia', description: 'Nama organisasi, tipe proposal, dan tanggal pengajuan sudah tercatat.', tone: 'success' as const },
        { id: 'obj-2', title: 'Kandidat terdaftar', description: `${liveProposal.candidateCount} kandidat telah didaftarkan.`, tone: 'success' as const },
      ],
      timeline: proposalActivities.length > 0
        ? proposalActivities.map((activity) => ({ id: activity.id, title: activity.title, actor: activity.message ? `${activity.actorLabel} • ${activity.message}` : activity.actorLabel, time: new Date(activity.createdAt).toLocaleString('id-ID') }))
        : [{ id: 't1', title: 'Proposal Diajukan', actor: `Oleh: ${liveProposal.organizationName ?? 'Admin'}`, time: new Date(liveProposal.createdAt).toLocaleString('id-ID') }],
      documents: proposalDocuments.map((document) => ({
        id: document.id,
        name: document.fileName,
        meta: `Dokumen Pendukung • ${(document.fileSize / 1024 / 1024).toFixed(2)} MB • ${new Date(document.createdAt).toLocaleDateString('id-ID')}`,
        path: document.filePath,
        contentType: document.contentType,
        documentType: document.documentType,
        sizeLabel: `${(document.fileSize / 1024 / 1024).toFixed(2)} MB`,
        uploadedAt: new Date(document.createdAt).toLocaleString('id-ID'),
      })),
    }
  }, [liveProposal, proposalDocuments, proposalActivities])
  
  const [decisionType, setDecisionType] = useState<DecisionType>(null)
  const [note, setNote] = useState('')
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [pendingOnchainDecision, setPendingOnchainDecision] = useState<DecisionType>(null)
  const [isSyncingInitialWhitelist, setIsSyncingInitialWhitelist] = useState(false)
  const hasTriggeredPostDeploy = useRef(false)

  const proposalDocumentsForPreview = proposal?.documents ?? []
  const selectedPreviewDocument = proposalDocumentsForPreview.find((document) => document.id === previewDocumentId) ?? proposalDocumentsForPreview[0]
  const canPreviewSelectedDocument = Boolean(selectedPreviewDocument?.contentType?.includes('pdf') || selectedPreviewDocument?.name.toLowerCase().endsWith('.pdf'))

  const handleDownload = async (path?: string, fileName?: string) => {
    if (!path) {
      showToast({
        tone: 'info',
        title: 'Dokumen belum tersedia',
        description: 'Admin belum melampirkan surat rekomendasi atau dokumen pendukung lain pada proposal ini.',
      })
      return
    }

    try {
      const url = await createProposalDocumentSignedUrl(path, fileName)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast({ tone: 'success', title: 'Unduhan dimulai', description: `File ${fileName} sedang diunduh.` })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Penyimpanan file belum dapat diakses.'
      showToast({ tone: 'error', title: 'Gagal mengunduh', description: reason })
    }
  }

  const handlePreview = async (documentId: string, path?: string, contentType?: string, fileName?: string) => {
    setPreviewDocumentId(documentId)
    const canPreview = Boolean(contentType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf'))

    if (!path) {
      setPreviewUrl(null)
      showToast({ tone: 'info', title: 'Dokumen belum tersedia', description: 'Berkas tidak memiliki lokasi penyimpanan yang bisa dibuka.' })
      return
    }

    if (!canPreview) {
      setPreviewUrl(null)
      showToast({ tone: 'info', title: 'Pratinjau belum didukung', description: 'Saat ini pratinjau langsung hanya tersedia untuk PDF. Gunakan tombol unduh untuk format lain seperti Word.' })
      return
    }

    setIsPreviewLoading(true)
    try {
      const url = await createProposalDocumentPreviewUrl(path)
      setPreviewUrl(url)
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Pratinjau dokumen belum dapat dibuka.'
      showToast({ tone: 'error', title: 'Gagal membuka pratinjau', description: reason })
    } finally {
      setIsPreviewLoading(false)
    }
  }

  useEffect(() => {
    const firstDocument = proposalDocumentsForPreview[0]
    if (!previewDocumentId && firstDocument?.path) {
      void handlePreview(firstDocument.id, firstDocument.path, firstDocument.contentType, firstDocument.name)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalDocumentsForPreview])

  useEffect(() => {
    if (!isConfirmed || !hash || !receipt || !pendingOnchainDecision || updateStatus.isPending) return
    if (hasTriggeredPostDeploy.current) return
    hasTriggeredPostDeploy.current = true

    const deployment = pendingOnchainDecision === 'approve' || pendingOnchainDecision === 'deploy'
      ? parseElectionSpaceCreated(receipt)
      : null
    const ownerWallet = liveProposal?.createdByWalletAddress
     
    if (deployment && ownerWallet) {
      updateStatus.mutate({ 
        id: params.id, 
        status: 'deployed', 
        txHash: receipt.transactionHash,
        onchainProposalId: deployment.proposalId,
        deployment: {
          deployedSpaceId: deployment.spaceId,
          deployedSpaceAddress: deployment.spaceAddress,
          ownerWallet,
          registryAddress: REGISTRY_ADDRESS,
          deploymentTxHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber ? Number(receipt.blockNumber) : null,
          actorWallet: userAddress ?? null,
        },
        }, {
          onSuccess: async () => {
            let whitelistSyncMessage = initialWhitelistWallets.length > 0
              ? `${initialWhitelistWallets.length} wallet whitelist sudah ikut diinisialisasi dalam transaksi deploy.`
              : 'Proposal tidak memiliki whitelist awal untuk disinkronkan.'
            let scheduleMessage = 'Jadwal on-chain sudah ikut diinisialisasi dalam transaksi deploy.'

            if (initialWhitelistWallets.length > 0) {
              setIsSyncingInitialWhitelist(true)
              try {
                await updateWhitelistSyncStatus({
                  proposalDraftId: params.id,
                  txHash: receipt.transactionHash,
                  walletAddresses: initialWhitelistWallets,
                })
              } catch (error) {
                whitelistSyncMessage = `${initialWhitelistWallets.length} wallet whitelist sudah dikirim dalam deploy, tetapi status sinkron Supabase belum berhasil diperbarui.`
              } finally {
                setIsSyncingInitialWhitelist(false)
              }
            }

            const commitStartsAt = toUnixSeconds(liveProposal?.commitStartAt)
            const revealStartsAt = toUnixSeconds(liveProposal?.revealStartAt)
            const revealEndsAt = toUnixSeconds(liveProposal?.endedAt)

            if (!commitStartsAt || !revealStartsAt || !revealEndsAt || commitStartsAt >= revealStartsAt || revealStartsAt >= revealEndsAt) {
              scheduleMessage = 'Data jadwal proposal belum lengkap/valid, sehingga jadwal on-chain tidak ikut diaktifkan.'
            }

            // Auto-verify contract di Basescan (fire-and-forget)
            let verifyMessage = ''
            try {
              const supabase = getSupabaseBrowserClient()
              const accessToken = (await supabase?.auth.getSession())?.data.session?.access_token
              const verifyResponse = await fetch('/api/verify-contract', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
                body: JSON.stringify({
                  contractAddress: deployment.spaceAddress,
                  contractType: 'election-space',
                  registry: registryAddress,
                  spaceAdmin: ownerWallet,
                  spaceId: deployment.spaceId,
                  candidateCount: liveProposal.candidateCount,
                  title: liveProposal.title,
                  metadataURI: `supabase://proposal-drafts/${liveProposal.id}`,
                  initialActor: userAddress,
                  initialVoters: initialWhitelistWallets,
                  commitStartsAt: commitStartsAt!.toString(),
                  commitEndsAt: revealStartsAt!.toString(),
                  revealStartsAt: revealStartsAt!.toString(),
                  revealEndsAt: revealEndsAt!.toString(),
                }),
              })
              const verifyResult = await verifyResponse.json()
              if (verifyResult.verified) {
                verifyMessage = ' Contract sudah terverifikasi di Basescan.'
              } else if (verifyResult.pending) {
                verifyMessage = ' Contract sedang diverifikasi di Basescan.'
              } else {
                verifyMessage = ''
              }
            } catch {
              // Auto-verify gagal, tidak kritis
              verifyMessage = ''
            }

          showToast({
            title: 'Proposal Disetujui & Pemilihan Di-deploy',
            description: `${whitelistSyncMessage} ${scheduleMessage} Alamat Space: ${deployment.spaceAddress}${verifyMessage}`,
              tone: scheduleMessage.includes('tidak ikut') ? 'info' : 'success',
            })
          resetWrite()
          setPendingOnchainDecision(null)
          window.setTimeout(() => router.push('/superadmin/manajemen-pemilihan'), 1500)
        },
        onError: () => {
          showToast({
            title: 'Deploy berhasil, sinkronisasi Supabase gagal',
            description: 'Catat tx hash dari wallet lalu ulangi sinkronisasi data pemilihan.',
            tone: 'error',
          })
          resetWrite()
          setPendingOnchainDecision(null)
        }
      })
    } else {
      showToast({
        title: 'Deploy terkonfirmasi, event tidak terbaca',
        description: 'Transaksi sudah masuk blockchain, tetapi alamat Space belum berhasil dibaca dari receipt. Cek tx hash di wallet/Basescan.',
        tone: 'error',
      })
      resetWrite()
      setPendingOnchainDecision(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, hash, receipt, pendingOnchainDecision])

  if (proposalQuery.isLoading) return <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-400" /></div>
  if (!proposal) notFound()

  const decisionMeta = decisionType === 'approve'
    ? { title: 'Setujui dan deploy pemilihan ini?', confirmLabel: 'Setujui & Deploy' }
    : decisionType === 'deploy'
      ? { title: 'Deploy pemilihan ini sekarang?', confirmLabel: 'Deploy Pemilihan' }
      : decisionType === 'revise'
        ? { title: 'Minta revisi proposal ini?', confirmLabel: 'Kirim Permintaan Revisi' }
        : { title: 'Tolak permanen proposal ini?', confirmLabel: 'Tolak Proposal' }

  const isNoteRequired = decisionType === 'revise'
  const canConfirm = !isNoteRequired || note.trim().length > 0

  const readinessScore = proposal.objectives.filter((item) => item.tone === 'success').length
  const totalChecks = proposal.objectives.length

  const handleConnectSuperadminWallet = () => {
    const connector = connectors.find((item) => item.id === 'baseAccount') ?? connectors[0]

    if (!connector) {
      showToast({
        title: 'Connector wallet belum siap',
        description: 'Muat ulang halaman, lalu coba sambungkan Smart Wallet lagi.',
        tone: 'error',
      })
      return
    }

    if (isConnected) disconnect()

    window.setTimeout(() => connect(
      { connector, chainId: BASE_SEPOLIA_CHAIN_ID },
      {
        onSuccess: () => {
          showToast({
            title: 'Wallet tersambung',
            description: 'Ulangi aksi Setujui & Deploy untuk mengirim transaksi.',
            tone: 'success',
          })
        },
        onError: (error) => {
          showToast({
            title: 'Gagal menyambungkan wallet',
            description: getDeployErrorMessage(error),
            tone: 'error',
          })
        },
      },
    ), isConnected ? 250 : 0)
  }

  const handleConfirmAction = async () => {
    if (decisionType === 'approve' || decisionType === 'deploy') {
      const activeDecision = decisionType

      if (!isConnected || !userAddress) {
        showToast({
          title: 'Wallet belum tersambung',
          description: 'Membuka Smart Wallet. Setelah tersambung, ulangi aksi deploy.',
          tone: 'error',
        })
        setDecisionType(null)
        handleConnectSuperadminWallet()
        return
      }

      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        showToast({
          title: 'Network belum sesuai',
          description: 'Ubah jaringan wallet ke Base Sepolia sebelum deploy pemilihan.',
          tone: 'error',
        })
        setDecisionType(null)
        return
      }

      if (isSuperAdmin !== true) {
        showToast({
          title: isSuperAdmin === false ? 'Wallet belum terdaftar on-chain' : 'Validasi wallet belum siap',
          description: isSuperAdmin === false 
            ? `Wallet ${userAddress?.slice(0, 6)}...${userAddress?.slice(-4)} belum terdaftar sebagai superadmin di kontrak registry. Hubungi superadmin on-chain lain${superAdminAddress ? ` (${(superAdminAddress as string).slice(0, 6)}...${(superAdminAddress as string).slice(-4)})` : ''} untuk mendaftarkan wallet Anda melalui halaman Manajemen Superadmin, lalu sambungkan ulang wallet ini.`
            : 'Tunggu beberapa detik sampai peran wallet terbaca, lalu coba deploy lagi.',
          tone: 'error',
        })
        setDecisionType(null)
        return
      }

      if (!liveProposal?.createdByWalletAddress) {
        showToast({
          title: 'Wallet admin belum tersedia',
          description: 'Proposal belum bisa di-deploy karena wallet admin pengaju tidak ditemukan di Supabase.',
          tone: 'error',
        })
        setDecisionType(null)
        return
      }

      setDecisionType(null)
      setPendingOnchainDecision(activeDecision)
      resetWrite()
      try {
        const commitStartsAt = toUnixSeconds(liveProposal.commitStartAt)
        const revealStartsAt = toUnixSeconds(liveProposal.revealStartAt)
        const revealEndsAt = toUnixSeconds(liveProposal.endedAt)

        if (!commitStartsAt || !revealStartsAt || !revealEndsAt || commitStartsAt >= revealStartsAt || revealStartsAt >= revealEndsAt) {
          showToast({
            title: 'Jadwal belum valid',
            description: 'Lengkapi jadwal pencoblosan dan penghitungan sebelum deploy ke blockchain.',
            tone: 'error',
          })
          setPendingOnchainDecision(null)
          return
        }

        // Check if any dates are in the past
        const now = Math.floor(Date.now() / 1000)
        if (commitStartsAt < now || revealStartsAt < now || revealEndsAt < now) {
          showToast({
            title: 'Jadwal sudah lewat',
            description: 'Salah satu atau lebih tanggal pemilihan sudah lewat dari waktu sekarang. Admin harus memperbarui jadwal terlebih dahulu.',
            tone: 'error',
          })
          setPendingOnchainDecision(null)
          return
        }

        const txHash = await createElectionForAdminWithConfig(
          liveProposal.createdByWalletAddress as Address,
          liveProposal.title,
          `supabase://proposal-drafts/${liveProposal.id}`,
          liveProposal.candidateCount,
          initialWhitelistWallets as Address[],
          commitStartsAt,
          revealStartsAt,
          revealStartsAt,
          revealEndsAt,
        )
        showToast({
          title: 'Transaksi deploy & sinkronisasi dikirim',
          description: `Whitelist dan jadwal ikut dalam satu transaksi. Tx: ${txHash.slice(0, 10)}...`,
          tone: 'info',
        })
      } catch (error) {
        showToast({
          title: 'Transaksi deploy gagal',
          description: getDeployErrorMessage(error),
          tone: 'error',
        })
        setPendingOnchainDecision(null)
      }
    } else {
      // Off-chain actions
      const title = decisionType === 'revise' ? 'Permintaan revisi dikirim' : 'Proposal ditolak'
      const status = decisionType === 'revise' ? 'revision_requested' : 'rejected'
      
      updateStatus.mutate({ id: params.id, status, message: note.trim() || null }, {
        onSuccess: () => {
          showToast({ tone: decisionType === 'reject' ? 'error' : 'success', title, description: 'Status proposal berhasil diperbarui.' })
          setDecisionType(null)
          window.setTimeout(() => router.push('/superadmin/manajemen-proposal'), 500)
        },
        onError: (error) => {
          const description = error instanceof Error ? error.message : 'Status proposal gagal diperbarui.'
          showToast({ tone: 'error', title: 'Gagal memperbarui status', description })
        }
      })
    }
  }

  return (
    <SuperadminShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <SuperadminDetailIntro
          backHref="/superadmin/manajemen-proposal"
        backLabel="Kembali ke Daftar"
        chips={(
          <>
            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[14px] font-medium text-blue-700">
              <BadgeCheck className="h-4 w-4" />
              Review Proposal Superadmin
            </span>
            <span className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-[13px] text-slate-500"># {proposal.proposalCode}</span>
            {isConnected && userAddress && (
              <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium ${isSuperAdmin === true ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : isSuperAdmin === false ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                {isSuperAdmin === true ? <ShieldCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                {isSuperAdminLoading || typeof isSuperAdmin === 'undefined' ? 'Validasi Superadmin:' : isSuperAdmin ? 'Superadmin:' : 'Bukan Superadmin:'} {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </span>
            )}
          </>
        )}
        title={proposal.title}
        meta={(
          <>
            <SuperadminStatusBadge status={proposal.badge} />
            <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4" /> {proposal.organizationName}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Diajukan {liveProposal ? new Date(liveProposal.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : proposal.submittedAt}</span>
          </>
        )}
        actions={(
          <>
            <button
              type="button"
              disabled={proposal.documents.length === 0}
              onClick={() => handleDownload(proposal.documents[0]?.path, proposal.documents[0]?.name)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {proposal.documents.length === 0 ? 'Dokumen Belum Tersedia' : 'Unduh Dokumen'}
            </button>
            {proposal.badge === 'Disetujui' ? (
              <button
                type="button"
                disabled={isConnectPending || isWritePending || isConfirming || isSyncingInitialWhitelist || pendingOnchainDecision !== null}
                onClick={() => setDecisionType('deploy')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-[15px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                 {isConnectPending || isWritePending || isConfirming || isSyncingInitialWhitelist || pendingOnchainDecision ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {isSyncingInitialWhitelist ? 'Sinkron whitelist...' : 'Deploy ke Blockchain'}
              </button>
            ) : (
              <button
                type="button"
                  disabled={isConnectPending || isWritePending || isConfirming || isSyncingInitialWhitelist || pendingOnchainDecision !== null || proposal.badge === 'Selesai' || proposal.badge === 'Berjalan' || proposal.badge === 'Perlu Revisi' || proposal.badge === 'Dibatalkan'}
                onClick={() => setDecisionType('approve')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-5 text-[15px] font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                  {isConnectPending || isWritePending || isConfirming || isSyncingInitialWhitelist || pendingOnchainDecision ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                {isSyncingInitialWhitelist ? 'Sinkron whitelist...' : 'Setujui & Deploy'}
              </button>
            )}
          </>
        )}
      />
      </ScrollReveal>

      {writeError && (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 flex gap-3">
          <CircleAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-[15px] font-semibold text-red-900">Gagal memproses transaksi</h2>
            <p className="mt-1 text-[13px] text-red-800 leading-relaxed">
              {getDeployErrorMessage(writeError)}
            </p>
          </div>
        </section>
      )}

      {isConnected && userAddress && proposal.badge !== 'Berjalan' && proposal.badge !== 'Selesai' && proposal.badge !== 'Dibatalkan' ? (
        <section className={`mt-6 rounded-2xl border p-5 ${isSuperAdmin === false ? 'border-red-200 bg-red-50 text-red-900' : 'border-slate-200 bg-white text-slate-800'}`}>
          <div className="flex items-start gap-3">
            {isSuperAdmin === true ? <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Validasi wallet deploy</h2>
              <div className="mt-2 space-y-1 text-[13px] leading-6">
                <p>Wallet transaksi tersambung: <span className="font-mono">{userAddress}</span></p>
                <p>Registry yang dibaca frontend: <span className="font-mono">{registryAddress}</span></p>
                <p>Root superadmin on-chain: <span className="font-mono">{superAdminAddress ? String(superAdminAddress) : 'Memuat...'}</span></p>
              </div>
              {isSuperAdmin === false ? (
                <p className="mt-3 text-[13px] leading-6 text-red-800">
                  Wallet <span className="font-mono font-semibold">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</span> belum terdaftar sebagai superadmin di kontrak registry. Superadmin on-chain: <span className="font-mono font-semibold">{superAdminAddress && typeof superAdminAddress === 'string' ? `${superAdminAddress.slice(0, 6)}...${superAdminAddress.slice(-4)}` : '(memuat...)'}</span>. Untuk deploy, sambungkan wallet yang sudah terdaftar sebagai superadmin, atau minta superadmin lain melakukan deploy pemilihan ini.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-6 lg:grid-cols-4">
        <article className="rounded-[24px] border border-blue-200 bg-blue-50 p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-blue-600">Jadwal Pemilihan</p>
          <p className="mt-5 text-[18px] font-semibold tracking-[-0.02em] text-blue-900">
            {liveProposal?.commitStartAt ? new Date(liveProposal.commitStartAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            {' — '}
            {liveProposal?.endedAt ? new Date(liveProposal.endedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
          </p>
          <p className="mt-3 text-[14px] leading-6 text-blue-800">
            Mulai Pencoblosan: {liveProposal?.commitStartAt ? new Date(liveProposal.commitStartAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
          </p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Readiness Score</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{readinessScore}/{totalChecks}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-800">Checklist teknis yang sudah memenuhi syarat review awal.</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Dokumen</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{proposal.documents.length}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-800">Berkas pendukung yang tersedia untuk diverifikasi.</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Whitelist Awal</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{proposalWhitelistQuery.isLoading ? '...' : initialWhitelistWallets.length}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-800">Wallet valid dari proposal yang akan didaftarkan on-chain setelah deploy.</p>
        </article>
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={125} duration={800}>
        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-700" />
                <h2 className="text-[20px] font-semibold text-slate-900">Whitelist Pemilih</h2>
              </div>
              <p className="mt-2 text-[14px] leading-6 text-slate-600">
                Daftar lengkap wallet yang didaftarkan admin. Setelah deploy, wallet valid akan didaftarkan ke smart contract selama fase Registration.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex w-fit rounded-xl bg-slate-100 px-3 py-2 text-[13px] font-medium text-slate-700">
                {proposalWhitelistEntries.length} total
              </span>
              <span className="inline-flex w-fit rounded-xl bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700">
                {initialWhitelistWallets.length} valid
              </span>
              {proposalWhitelistEntries.filter((e) => e.validationStatus === 'invalid').length > 0 && (
                <span className="inline-flex w-fit rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
                  {proposalWhitelistEntries.filter((e) => e.validationStatus === 'invalid').length} invalid
                </span>
              )}
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-6 text-amber-900">
            Jika sinkronisasi awal gagal karena wallet ditolak, gas habis, atau transaksi dibatalkan, pemilihan tetap ter-deploy dan admin masih bisa memakai fitur tambah/import/sinkron whitelist di Manajemen Pemilihan.
          </div>
          {proposalWhitelistQuery.isLoading ? (
            <div className="mt-5 h-24 animate-pulse rounded-2xl bg-slate-100" />
          ) : proposalWhitelistEntries.length === 0 ? (
            <div className="mt-5">
              <SuperadminEmptyState title="Whitelist kosong" description="Proposal ini belum memiliki daftar wallet pemilih. Admin dapat menambahkan whitelist setelah pemilihan di-deploy selama fase Registration." />
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 font-semibold text-slate-700">Alamat Wallet</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Nama Pemilih</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Sumber</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Status Validasi</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Status Sinkron</th>
                      <th className="px-4 py-3 font-semibold text-slate-700">Tanggal Ditambahkan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposalWhitelistEntries.map((entry) => {
                      const isValid = entry.validationStatus === 'valid' || entry.validationStatus === 'synced' || entry.syncStatus === 'synced'
                      const isSynced = entry.syncStatus === 'synced' || entry.validationStatus === 'synced'
                      const isInvalid = entry.validationStatus === 'invalid'
                      return (
                        <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-[13px] text-slate-700">{entry.walletAddress}</td>
                          <td className="px-4 py-3 text-slate-700">{entry.voterName || <span className="text-slate-400 italic">Belum diisi</span>}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${
                              entry.source === 'csv' ? 'bg-blue-50 text-blue-600' : entry.source === 'sync' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {entry.source === 'csv' ? 'CSV' : entry.source === 'sync' ? 'Sinkron' : 'Manual'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${
                              isValid ? 'bg-emerald-50 text-emerald-600' : isInvalid ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {isValid ? <CheckCircle2 className="h-3 w-3" /> : isInvalid ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              {isValid ? 'Valid' : isInvalid ? 'Invalid' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] ${
                              isSynced ? 'bg-emerald-50 text-emerald-600' : entry.latestSyncTxHash ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {isSynced ? <RefreshCw className="h-3 w-3" /> : null}
                              {isSynced ? 'Tersinkron' : entry.latestSyncTxHash ? 'Proses' : 'Belum On-Chain'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-slate-500">
                            {new Date(entry.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {proposalWhitelistEntries.length > 10 && (
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-center text-[13px] text-slate-500">
                  Menampilkan {proposalWhitelistEntries.length} dari {proposalWhitelistEntries.length} pemilih
                </div>
              )}
            </div>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={140} duration={800}>
        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-7">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-slate-700" />
            <h2 className="text-[20px] font-semibold text-slate-900">Jadwal Pemilihan</h2>
          </div>
          <p className="mt-2 text-[14px] leading-6 text-slate-600">
            Tiga fase pemilihan dihitung otomatis dari tanggal yang diatur admin.
          </p>

          {/* Warning if any dates are in the past */}
          {liveProposal?.status !== 'deployed' && (() => {
            const now = Date.now()
            const pastDates: string[] = []
            if (liveProposal?.registrationStartAt && new Date(liveProposal.registrationStartAt).getTime() < now) pastDates.push('Mulai Persiapan')
            if (liveProposal?.commitStartAt && new Date(liveProposal.commitStartAt).getTime() < now) pastDates.push('Mulai Pencoblosan')
            if (liveProposal?.endedAt && new Date(liveProposal.endedAt).getTime() < now) pastDates.push('Selesai Pemilihan')
            if (pastDates.length === 0) return null
            return (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-6 text-amber-800">
                <span className="font-semibold">Peringatan:</span> {pastDates.join(', ')} sudah lewat dari waktu sekarang. Proposal harus memperbarui jadwal sebelum dapat dideploy.
              </div>
            )
          })()}

          {liveProposal?.commitStartAt || liveProposal?.revealStartAt || liveProposal?.endedAt ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600">Mulai Pencoblosan</p>
                <p className="mt-2 text-[15px] font-semibold text-blue-900">
                  {liveProposal?.commitStartAt ? new Date(liveProposal.commitStartAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
                <p className="mt-1 text-[12px] text-blue-700">Fase Commit dimulai</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600">Mulai Konfirmasi</p>
                <p className="mt-2 text-[15px] font-semibold text-amber-900">
                  {liveProposal?.revealStartAt ? new Date(liveProposal.revealStartAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
                <p className="mt-1 text-[12px] text-amber-700">Fase Reveal (otomatis)</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">Selesai Pemilihan</p>
                <p className="mt-2 text-[15px] font-semibold text-emerald-900">
                  {liveProposal?.endedAt ? new Date(liveProposal.endedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                </p>
                <p className="mt-1 text-[12px] text-emerald-700">Hasil dihitung, email terkirim</p>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <SuperadminEmptyState title="Jadwal belum diatur" description="Admin belum mengisi jadwal pemilihan saat membuat proposal." />
            </div>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={150} duration={800}>
        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-slate-700" />
                <h2 className="text-[20px] font-semibold text-slate-900">Profil Kandidat</h2>
              </div>
              <p className="mt-2 text-[14px] leading-6 text-slate-600">Detail kandidat yang akan ikut dalam ruang pemilihan jika proposal disetujui.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-[13px] font-medium text-slate-700">
              <Users className="h-4 w-4" />
              {proposalCandidates.length} kandidat dimuat
            </span>
          </div>

          {proposalCandidatesQuery.isLoading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1].map((item) => <div key={item} className="h-[420px] animate-pulse rounded-2xl bg-slate-100" />)}
            </div>
          ) : proposalCandidates.length === 0 ? (
            <div className="mt-6">
              <SuperadminEmptyState title="Kandidat belum tersedia" description="Admin belum menambahkan profil kandidat pada proposal ini." />
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {proposalCandidates.map((candidate, index) => (
                <article key={candidate.id} className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="relative flex h-[280px] items-center justify-center overflow-hidden bg-slate-100 sm:h-[300px]">
                    {candidate.avatarPath ? (
                      <img src={candidate.avatarPath} alt={`Foto ${candidate.fullName}`} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <UserRound className="h-12 w-12" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-lg bg-slate-900 px-2 py-1 font-mono text-[10px] font-semibold text-white">#{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="flex min-h-[300px] flex-1 flex-col p-4">
                    <p className="font-mono text-[11px] text-slate-400">ID {candidate.candidateLocalId}</p>
                    <h3 className="mt-2 text-[18px] font-semibold leading-tight text-slate-900">{candidate.fullName}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                      {candidate.studentId ? <span className="rounded-lg bg-slate-50 px-2 py-1 font-mono">{candidate.studentId}</span> : null}
                      {candidate.faculty ? <span className="rounded-lg bg-slate-50 px-2 py-1">{candidate.faculty}</span> : null}
                    </div>

                    <div className="mt-4 space-y-3 text-[12px] leading-5 text-slate-700">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Visi</p>
                        <RichTextRenderer value={candidate.vision} emptyFallback="Visi kandidat belum diisi." className="mt-1" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Misi</p>
                        {candidate.mission.length > 0 ? (
                          <RichTextRenderer
                            value={candidate.mission.join('\n')}
                            emptyFallback="Misi kandidat belum diisi."
                            className="mt-1"
                          />
                        ) : <p className="mt-1 text-slate-500">Misi kandidat belum diisi.</p>}
                      </div>
                    </div>

                    {candidate.youtubeUrl && (
                      <a href={candidate.youtubeUrl} target="_blank" rel="noreferrer" className="mt-auto inline-flex pt-4 text-[12px] font-semibold text-slate-700 hover:text-slate-900">
                        <Youtube className="mr-1.5 h-3.5 w-3.5" />
                        Video profil
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
        <div className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Ringkasan Proposal</h2>
            </div>
            <div className="mt-7 space-y-6 text-[16px] leading-9 text-slate-700">
              {proposal.summary.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] bg-slate-100 p-5">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Smart Contract Draft</p>
                  <p className="mt-2 inline-flex rounded-xl bg-white px-3 py-1.5 font-mono text-[14px] text-slate-700">{proposal.networkConfig.contractAddress}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Konsensus</p>
                  <p className="mt-2 text-[16px] font-medium text-slate-900">{proposal.networkConfig.consensus}</p>
                </div>
              </div>
            </div>
          </section>

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Checklist Strategis & Teknis</h2>
            </div>
            <div className="mt-7 space-y-4">
              {proposal.objectives.map((objective) => (
                <article key={objective.id} className={`rounded-[24px] border px-5 py-5 ${objective.tone === 'danger' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex gap-4">
                    <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full ${objective.tone === 'danger' ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'}`}>
                      {objective.tone === 'danger' ? <CircleAlert className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className={`text-[18px] font-semibold ${objective.tone === 'danger' ? 'text-red-700' : 'text-slate-900'}`}>{objective.title}</h3>
                      <p className={`mt-2 text-[15px] leading-7 ${objective.tone === 'danger' ? 'text-red-700' : 'text-slate-800'}`}>{objective.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SuperadminSectionCard>

          <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-700" />
                <h2 className="text-[20px] font-semibold text-slate-900">Dokumen Pendukung</h2>
              </div>
              <button
                type="button"
                disabled={proposal.documents.length === 0}
                onClick={() => handleDownload(proposal.documents[0]?.path, proposal.documents[0]?.name)}
                className="text-[14px] font-semibold text-slate-700 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {proposal.documents.length === 0 ? 'Tidak ada dokumen' : 'Unduh dokumen aktif'}
              </button>
            </div>
            {proposal.documents.length === 0 ? (
              <div className="mt-6">
                <SuperadminEmptyState
                  title="Belum ada dokumen pendukung"
                  description="Admin belum melampirkan surat rekomendasi atau dokumen pendukung lain saat membuat proposal ini."
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                <div className="space-y-3">
                  {proposal.documents.map((document) => (
                    <SuperadminInteractiveCard key={document.id} onClick={() => handlePreview(document.id, document.path, document.contentType, document.name)} className={`px-4 py-4 shadow-none ${selectedPreviewDocument?.id === document.id ? 'border-slate-900 bg-white' : 'bg-slate-100'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-2xl bg-white p-3 text-slate-700">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-slate-900">{document.name}</p>
                          <p className="mt-1 text-[14px] text-slate-500">{document.meta}</p>
                          <p className="mt-2 inline-flex rounded-lg bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{document.documentType === 'recommendation_letter' ? 'Surat rekomendasi' : 'Pendukung'}</p>
                        </div>
                      </div>
                      <button aria-label={`Unduh ${document.name}`} type="button" onClick={(event) => {
                        event.stopPropagation()
                        handleDownload(document.path, document.name)
                      }} className="rounded-2xl bg-white p-3 text-slate-700 hover:bg-slate-50">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </SuperadminInteractiveCard>
                  ))}
                </div>

                <div className="min-h-[520px] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                  <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-900">{selectedPreviewDocument?.name ?? 'Pilih dokumen'}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" />
                        {selectedPreviewDocument?.uploadedAt ?? 'Belum ada waktu unggah'}
                        {selectedPreviewDocument?.sizeLabel ? <span>• {selectedPreviewDocument.sizeLabel}</span> : null}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" disabled={!selectedPreviewDocument?.path} onClick={() => selectedPreviewDocument && handlePreview(selectedPreviewDocument.id, selectedPreviewDocument.path, selectedPreviewDocument.contentType, selectedPreviewDocument.name)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50">
                        <Eye className="h-4 w-4" />
                        Preview
                      </button>
                      <button type="button" disabled={!selectedPreviewDocument?.path} onClick={() => handleDownload(selectedPreviewDocument?.path, selectedPreviewDocument?.name)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-[13px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                        <Download className="h-4 w-4" />
                        Unduh
                      </button>
                    </div>
                  </div>
                  <div className="flex min-h-[456px] items-center justify-center p-4">
                    {isPreviewLoading ? (
                      <div className="flex items-center gap-3 text-[14px] text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Menyiapkan pratinjau dokumen...</div>
                    ) : previewUrl && canPreviewSelectedDocument ? (
                      <iframe title={`Pratinjau ${selectedPreviewDocument?.name ?? 'dokumen'}`} src={previewUrl} className="h-[456px] w-full rounded-2xl border border-slate-200 bg-white" />
                    ) : (
                      <div className="max-w-md text-center">
                        <FileText className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-4 text-[16px] font-semibold text-slate-900">Pratinjau tidak tersedia</h3>
                        <p className="mt-2 text-[14px] leading-6 text-slate-600">PDF dapat ditampilkan langsung di halaman ini. Untuk dokumen Word atau format lain, gunakan tombol unduh.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          {/* On-chain registration warning */}
          {isConnected && isSuperAdmin === false && proposal.badge !== 'Berjalan' && proposal.badge !== 'Selesai' && proposal.badge !== 'Dibatalkan' && (
            <section className="rounded-[32px] border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Link className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-amber-800">Wallet belum terdaftar on-chain</p>
                  <p className="mt-2 text-[13px] leading-6 text-amber-700">
                    Wallet <span className="font-mono font-semibold">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</span> belum terdaftar sebagai superadmin di smart contract registry. Deploy hanya bisa dilakukan oleh wallet yang sudah terdaftar on-chain.
                  </p>
                  <div className="mt-3 rounded-2xl bg-white/60 px-4 py-3 text-[12px] leading-6 text-amber-800">
                    <p className="font-semibold">Cara mengatasi:</p>
                    <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                      <li>Minta superadmin lain yang sudah terdaftar on-chain untuk login</li>
                      <li>Minta mereka buka <span className="font-semibold">Manajemen Superadmin</span></li>
                      <li>Di halaman itu, wallet Anda akan otomatis didaftarkan on-chain</li>
                      <li>Setelah terdaftar, ulangi aksi deploy ini</li>
                    </ol>
                  </div>
                  {typeof superAdminAddress === 'string' && (
                    <p className="mt-2 text-[11px] text-amber-600">
                      {'Superadmin on-chain saat ini: '}
                      <span className="font-mono">{superAdminAddress.slice(0, 6)}...{superAdminAddress.slice(-4)}</span>
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {proposal.badge !== 'Berjalan' && proposal.badge !== 'Selesai' && proposal.badge !== 'Dibatalkan' && (
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Aksi Review</p>
            <div className="mt-6 space-y-3">
              <button 
                type="button" 
                disabled={isConnectPending || isWritePending || isConfirming || pendingOnchainDecision !== null || proposal.badge === 'Disetujui' || proposal.badge === 'Berjalan'}
                onClick={() => setDecisionType('approve')} 
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-6 text-[15px] font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isConnectPending || isWritePending || isConfirming || pendingOnchainDecision ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                Setujui & Deploy
              </button>
              {proposal.badge === 'Disetujui' && (
                <button 
                  type="button" 
                  disabled={isConnectPending || isWritePending || isConfirming || pendingOnchainDecision !== null}
                  onClick={() => setDecisionType('deploy')} 
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-[15px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isConnectPending || isWritePending || isConfirming || pendingOnchainDecision ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  Deploy Pemilihan
                </button>
              )}
              <button 
                type="button" 
                disabled={isConnectPending || isWritePending || isConfirming || pendingOnchainDecision !== null || proposal.badge === 'Berjalan'}
                onClick={() => setDecisionType('revise')} 
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-200"
              >
                <ListChecks className="h-4 w-4" />
                Minta Revisi
              </button>
              <button 
                type="button" 
                disabled={isConnectPending || isWritePending || isConfirming || pendingOnchainDecision !== null || proposal.badge === 'Berjalan'}
                onClick={() => setDecisionType('reject')} 
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-6 text-[15px] font-medium text-red-600 hover:bg-red-100"
              >
                <ThumbsDown className="h-4 w-4" />
                Tolak Permanen
              </button>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{decisionType === 'revise' ? 'Pesan Revisi untuk Admin (Wajib)' : 'Catatan Internal (Opsional)'}</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={decisionType === 'revise' ? 'Contoh: Mohon lengkapi visi kandidat 2 dan perbaiki jadwal reveal.' : 'Tambahkan catatan untuk log audit...'}
                className="mt-3 h-32 w-full rounded-[20px] bg-slate-100 px-4 py-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
              />
              {decisionType === 'revise' ? <p className="mt-2 text-[12px] leading-5 text-slate-500">Pesan ini akan tampil untuk admin organisasi dan tercatat di riwayat aktivitas proposal.</p> : null}
              {decisionType === 'revise' && note.trim().length === 0 ? <p className="mt-1 text-[12px] leading-5 text-red-500">Pesan revisi wajib diisi.</p> : null}
            </div>
          </section>
          )}

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Riwayat Aktivitas</h2>
            </div>
            <div className="mt-6 space-y-5">
              {proposal.timeline.map((event) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex w-6 flex-col items-center">
                    <span className="mt-1 h-4 w-4 rounded-full border-2 border-black bg-white" />
                    <span className="mt-1 min-h-[56px] w-px bg-slate-200" />
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">{event.title}</p>
                    <p className="mt-1 text-[14px] text-slate-500">{event.actor}</p>
                    <p className="mt-1 text-[13px] text-slate-400">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Tautan Draft Kontrak</h2>
            </div>
            <div className="mt-5 rounded-[20px] bg-slate-50 px-4 py-4 font-mono text-[14px] text-slate-700">
              {proposal.networkConfig.contractAddress}
            </div>
            <button
              type="button"
              onClick={() => {
                if (proposal.networkConfig.contractAddress && proposal.networkConfig.contractAddress.startsWith('0x')) {
                  window.open(`https://sepolia.basescan.org/address/${proposal.networkConfig.contractAddress}`, '_blank')
                } else {
                  showToast({ tone: 'info', title: 'Explorer draft dibuka', description: 'Tautan draft kontrak sedang disiapkan.' })
                }
              }}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-[14px] font-medium text-slate-900 hover:bg-slate-200"
            >
              Lihat Draft Explorer
            </button>
          </SuperadminSectionCard>
        </div>
      </section>
      </ScrollReveal>

      <ConfirmDialog
        open={decisionType !== null}
        title={decisionMeta.title}
        description={note.trim() ? `Pesan: ${note}` : decisionType === 'approve' || decisionType === 'deploy' ? 'Superadmin akan membayar gas fee untuk deploy pemilihan ke Base Sepolia.' : 'Status proposal akan diperbarui di Supabase untuk ditindaklanjuti admin.'}
        confirmLabel={decisionMeta.confirmLabel}
        tone={decisionType === 'reject' ? 'danger' : 'default'}
        disabled={!canConfirm}
        onCancel={() => {
          setDecisionType(null)
          resetWrite()
        }}
        onConfirm={handleConfirmAction}
      />
    </SuperadminShell>
  )
}
