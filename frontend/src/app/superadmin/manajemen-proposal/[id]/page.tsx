'use client'

import { BadgeCheck, CalendarDays, Check, CircleAlert, Download, ExternalLink, FileText, Landmark, ListChecks, ShieldCheck, ThumbsDown, ThumbsUp, Loader2, Rocket, Eye, UserRound, Youtube, Users, Clock3 } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import { useMemo, useState, useEffect } from 'react'
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
import { useProposalDraft, useUpdateProposalStatus } from '@/hooks/use-proposal-draft'
import { useProposalDocuments } from '@/hooks/use-proposal-documents'
import { useProposalCandidates } from '@/hooks/use-proposal-relations'
import { REGISTRY_ADDRESS, useRegistryContract } from '@/hooks/use-registry-contract'
import { createProposalDocumentPreviewUrl, createProposalDocumentSignedUrl } from '@/lib/repositories/proposalDocumentRepository'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import type { SuperadminProposalDetail } from '@/lib/superadmin-data'
import type { Address } from 'viem'
import { useConnect } from 'wagmi'

type DecisionType = 'approve' | 'revise' | 'reject' | 'deploy' | null

const BASE_SEPOLIA_CHAIN_ID = 84532

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
    return 'Wallet tersambung bukan superadmin kontrak registry.'
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
  const proposalQuery = useProposalDraft(params.id)
  const proposalDocumentsQuery = useProposalDocuments(params.id)
  const proposalCandidatesQuery = useProposalCandidates(params.id)
  const updateStatus = useUpdateProposalStatus()
  
  // Real contract integration
  const { 
    createElectionForAdmin,
    parseElectionSpaceCreated,
    userAddress,
    isConnected,
    chainId,
    isSuperAdmin,
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

  const proposal = useMemo<SuperadminProposalDetail | null>(() => {
    if (!liveProposal) return null

    return {
      id: liveProposal.id,
      badge: liveProposal.status === 'draft' ? 'Draf' : liveProposal.status === 'submitted' ? 'Menunggu Review' : liveProposal.status === 'revision_requested' ? 'Perlu Revisi' : liveProposal.status === 'approved' ? 'Disetujui' : liveProposal.status === 'deployed' ? 'Berjalan' : liveProposal.status,
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
      riskProfile: {
        level: 'Low',
        note: 'Proposal diverifikasi oleh sistem.',
        items: [
          { label: 'Whitelist', status: 'Mitigated' },
        ],
      },
      timeline: [
        { id: 't1', title: 'Proposal Diajukan', actor: `Oleh: ${liveProposal.organizationName ?? 'Admin'}`, time: new Date(liveProposal.createdAt).toLocaleString('id-ID') },
      ],
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
  }, [liveProposal, proposalDocuments])
  
  const [decisionType, setDecisionType] = useState<DecisionType>(null)
  const [note, setNote] = useState('')
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [pendingOnchainDecision, setPendingOnchainDecision] = useState<DecisionType>(null)

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
      console.error('[superadmin] Gagal menyiapkan signed URL unduhan:', error)
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
      console.error('[superadmin] Gagal menyiapkan pratinjau dokumen:', error)
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
    if (isConfirmed && hash && receipt && pendingOnchainDecision && !updateStatus.isPending) {
      const deployment = pendingOnchainDecision === 'approve' || pendingOnchainDecision === 'deploy'
        ? parseElectionSpaceCreated(receipt)
        : null
      const ownerWallet = liveProposal?.createdByWalletAddress
       
      if (deployment && ownerWallet) {
        updateStatus.mutate({ 
          id: params.id, 
          status: 'deployed', 
          txHash: hash,
          onchainProposalId: deployment.proposalId,
          deployment: {
            deployedSpaceId: deployment.spaceId,
            deployedSpaceAddress: deployment.spaceAddress,
            ownerWallet,
            registryAddress: REGISTRY_ADDRESS,
            deploymentTxHash: hash,
            blockNumber: receipt.blockNumber ? Number(receipt.blockNumber) : null,
            actorWallet: userAddress ?? null,
          },
        }, {
          onSuccess: () => {
            showToast({
              title: 'Proposal Disetujui & Pemilihan Di-deploy',
              description: `Gas fee dibayar oleh superadmin. Alamat Space: ${deployment.spaceAddress}`,
              tone: 'success',
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
    }
  }, [isConfirmed, hash, receipt, pendingOnchainDecision, params.id, updateStatus, showToast, router, resetWrite, parseElectionSpaceCreated, liveProposal?.createdByWalletAddress, userAddress])

  if (proposalQuery.isLoading) return <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-400" /></div>
  if (!proposal) notFound()

  const decisionMeta = decisionType === 'approve'
    ? { title: 'Setujui dan deploy pemilihan ini?', confirmLabel: 'Setujui & Deploy' }
    : decisionType === 'deploy'
      ? { title: 'Deploy pemilihan ini sekarang?', confirmLabel: 'Deploy Pemilihan' }
      : decisionType === 'revise'
        ? { title: 'Minta revisi proposal ini?', confirmLabel: 'Kirim Permintaan Revisi' }
        : { title: 'Tolak permanen proposal ini?', confirmLabel: 'Tolak Proposal' }

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

    connect(
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
    )
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
          title: isSuperAdmin === false ? 'Wallet bukan superadmin kontrak' : 'Validasi wallet belum siap',
          description: isSuperAdmin === false 
            ? `Gunakan wallet superadmin. Wallet tersambung: ${userAddress?.slice(0, 6)}...${userAddress?.slice(-4)}. Pastikan alamat ini terdaftar di VoteChain Registry.` 
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
        const txHash = await createElectionForAdmin(
          liveProposal.createdByWalletAddress as Address,
          liveProposal.title,
          `supabase://proposal-drafts/${liveProposal.id}`,
          liveProposal.candidateCount,
        )
        showToast({
          title: 'Transaksi deploy dikirim',
          description: `Menunggu konfirmasi Base Sepolia. Tx: ${txHash.slice(0, 10)}...`,
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
      
      updateStatus.mutate({ id: params.id, status }, {
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
              <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium ${isSuperAdmin ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {isSuperAdmin ? <ShieldCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                {isSuperAdmin ? 'Superadmin:' : 'Bukan Superadmin:'} {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </span>
            )}
          </>
        )}
        title={proposal.title}
        meta={(
          <>
            <SuperadminStatusBadge status={proposal.badge} />
            <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4" /> {proposal.organizationName}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Diajukan {proposal.submittedAt}</span>
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
                disabled={isConnectPending || isWritePending || isConfirming || pendingOnchainDecision !== null}
                onClick={() => setDecisionType('deploy')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-[15px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                 {isConnectPending || isWritePending || isConfirming || pendingOnchainDecision ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Deploy ke Blockchain
              </button>
            ) : (
              <button
                type="button"
                 disabled={isConnectPending || isWritePending || isConfirming || pendingOnchainDecision !== null || proposal.badge === 'Selesai' || proposal.badge === 'Berjalan'}
                onClick={() => setDecisionType('approve')}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-5 text-[15px] font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                 {isConnectPending || isWritePending || isConfirming || pendingOnchainDecision ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                Setujui & Deploy
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

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-6 lg:grid-cols-4">
        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Organisasi</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{proposal.organizationName}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-800">Pemilik proposal yang sedang mengajukan ruang pemilihan baru.</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Readiness Score</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{readinessScore}/{totalChecks}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-800">Checklist teknis yang sudah memenuhi syarat review awal.</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Risk Level</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{proposal.riskProfile.level}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-800">{proposal.riskProfile.note}</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Dokumen</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{proposal.documents.length}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-800">Berkas pendukung yang tersedia untuk diverifikasi.</p>
        </article>
      </StaggerContainer>

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
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {[0, 1].map((item) => <div key={item} className="h-56 animate-pulse rounded-[24px] bg-slate-100" />)}
            </div>
          ) : proposalCandidates.length === 0 ? (
            <div className="mt-6">
              <SuperadminEmptyState title="Kandidat belum tersedia" description="Admin belum menambahkan profil kandidat pada proposal ini." />
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {proposalCandidates.map((candidate, index) => (
                <article key={candidate.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                  <div className="grid gap-0 md:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="min-h-[220px] bg-slate-100">
                      {candidate.avatarPath ? (
                        <img src={candidate.avatarPath} alt={`Foto ${candidate.fullName}`} className="h-full min-h-[220px] w-full object-cover" />
                      ) : (
                        <div className="flex h-full min-h-[220px] items-center justify-center text-slate-400">
                          <UserRound className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat {index + 1}</p>
                          <h3 className="mt-2 text-[20px] font-semibold text-slate-900">{candidate.fullName}</h3>
                        </div>
                        <span className="rounded-xl bg-white px-3 py-1.5 font-mono text-[12px] text-slate-600">ID {candidate.candidateLocalId}</span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">NPM/NIM</p>
                          <p className="mt-1 text-[14px] font-semibold text-slate-900">{candidate.studentId || 'Belum diisi'}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Fakultas/Prodi</p>
                          <p className="mt-1 text-[14px] font-semibold text-slate-900">{candidate.faculty || 'Belum diisi'}</p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-4 text-[14px] leading-6 text-slate-700">
                        <div>
                          <p className="font-semibold text-slate-900">Bio singkat</p>
                          <p className="mt-1">{candidate.bio || 'Bio kandidat belum diisi oleh admin.'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Visi</p>
                          <p className="mt-1">{candidate.vision || 'Visi kandidat belum diisi oleh admin.'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">Misi</p>
                          {candidate.mission.length > 0 ? (
                            <ol className="mt-2 space-y-2">
                              {candidate.mission.map((mission, missionIndex) => (
                                <li key={`${candidate.id}-${missionIndex}`} className="flex gap-2">
                                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-slate-600">{missionIndex + 1}</span>
                                  <span>{mission}</span>
                                </li>
                              ))}
                            </ol>
                          ) : <p className="mt-1">Misi kandidat belum diisi oleh admin.</p>}
                        </div>
                        {candidate.youtubeUrl && (
                          <a href={candidate.youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-900 hover:bg-slate-50">
                            <Youtube className="h-4 w-4" />
                            Lihat video profil
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_420px]">
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
              <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Catatan Internal (Opsional)</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Tambahkan catatan untuk log audit..."
                className="mt-3 h-32 w-full rounded-[20px] bg-slate-100 px-4 py-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </section>

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Profil Risiko</p>
            <div className="mt-6 flex items-start gap-4 rounded-[24px] bg-slate-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <CircleAlert className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-slate-900">Tingkat Risiko: {proposal.riskProfile.level}</h2>
                <p className="mt-2 text-[15px] text-slate-800">{proposal.riskProfile.note}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {proposal.riskProfile.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[18px] bg-slate-50 px-4 py-3 text-[15px] text-slate-700">
                  <span>{item.label}</span>
                  <span className={item.status === 'Elevated' ? 'text-amber-600' : 'text-emerald-600'}>{item.status}</span>
                </div>
              ))}
            </div>
          </SuperadminSectionCard>

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
            <button type="button" onClick={() => showToast({ tone: 'info', title: 'Explorer draft dibuka', description: 'Tautan draft kontrak sedang disiapkan.' })} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
              Lihat Draft Explorer
            </button>
          </SuperadminSectionCard>
        </div>
      </section>
      </ScrollReveal>

      <ConfirmDialog
        open={decisionType !== null}
        title={decisionMeta.title}
        description={note.trim() ? `Catatan audit: ${note}` : decisionType === 'approve' || decisionType === 'deploy' ? 'Superadmin akan membayar gas fee untuk deploy pemilihan ke Base Sepolia.' : 'Status proposal akan diperbarui di Supabase untuk ditindaklanjuti admin.'}
        confirmLabel={decisionMeta.confirmLabel}
        tone={decisionType === 'reject' ? 'danger' : 'default'}
        onCancel={() => {
          setDecisionType(null)
          resetWrite()
        }}
        onConfirm={handleConfirmAction}
      />
    </SuperadminShell>
  )
}
