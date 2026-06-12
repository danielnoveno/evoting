'use client'

import { ArrowLeft, CalendarDays, CirclePlus, Download, FileText, Link2, ListChecks, Pencil, RefreshCw, Share2, ShieldCheck, Trash2, Upload } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ModalShell } from '@/components/ui/modal-shell'
import { useToast } from '@/components/ui/toast-provider'
import { adminElectionDetailTabs, AdminElectionDetailTabId, AdminElectionRecord } from '@/lib/admin-election-data'
import { ScrollReveal } from '@/components/public/parallax'
import { useCreateWhitelistEntriesBulk, useCreateWhitelistEntry, useDeleteWhitelistEntry, useUpdateWhitelistSyncStatus, useWhitelistEntries } from '@/hooks/use-whitelist-status'
import { useWhitelistImportJobs } from '@/hooks/use-whitelist-import-jobs'
import { useWhitelistImportSignedUrl } from '@/hooks/use-whitelist-import-file'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { countInvalidWhitelistCsvRows, parseWhitelistCsv } from '@/lib/whitelist-csv'
import { useProposalCandidates } from '@/hooks/use-proposal-relations'
import { useElectionContract } from '@/hooks/use-election-contract'
import { useElectionResults } from '@/hooks/use-election-results'
import { useElectionAuditLogs } from '@/hooks/use-election-audit-logs'
import { RequiredAsterisk } from '@/components/ui/required-asterisk'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'
import type { PublicElectionCandidateResultRecord } from '@/lib/repositories/types'

function QuickActionIcon({ icon }: { icon: 'download' | 'share' | 'audit' | 'report' }) {
  if (icon === 'download') return <Download className="h-5 w-5" />
  if (icon === 'share') return <Share2 className="h-5 w-5" />
  if (icon === 'audit') return <ListChecks className="h-5 w-5" />
  return <FileText className="h-5 w-5" />
}

function CandidateImage({ tone }: { tone: 'dark' | 'neutral' }) {
  return (
    <div className={`relative h-[280px] w-full overflow-hidden rounded-[28px] ${tone === 'dark' ? 'bg-[radial-gradient(circle_at_top,_#4b5563,_#0f172a_70%)]' : 'bg-[radial-gradient(circle_at_top,_#6b7280,_#111827_72%)]'}`}>
      <div className="absolute inset-x-8 bottom-0 top-10 rounded-[32px] border border-white/10 bg-white/5" />
    </div>
  )
}

function StatusBadge({ status }: { status: 'synced' | 'valid' | 'pending' }) {
  if (status === 'synced') {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
        Tersinkron On-Chain
      </span>
    )
  }

  if (status === 'valid') {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">
        Valid Database
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
      Pending
    </span>
  )
}

export function AdminElectionDetailView({ election, activeTab }: { election: AdminElectionRecord; activeTab: AdminElectionDetailTabId }) {
  const canAddCandidate = election.status === 'aktif'
  const { showToast } = useToast()

  // Blockchain Hook
  const deployedAddress = election.detail.parameterVoting.contract.address
  const isAddressValid = deployedAddress && deployedAddress.startsWith('0x') && deployedAddress.length === 42
  
  const { 
    registerVoters, 
    transitionToNextPhase,
    isWritePending, 
    isConfirming, 
    isConfirmed, 
    hash: txHash,
    writeError,
    resetWrite,
    currentPhase: onChainPhase
  } = useElectionContract(isAddressValid ? deployedAddress : undefined)

  // Indexer Hooks
  const resultsQuery = useElectionResults(isAddressValid ? deployedAddress : undefined)
  const auditLogsQuery = useElectionAuditLogs(isAddressValid ? deployedAddress : undefined)

  const [candidates, setCandidates] = useState(election.detail.candidates)
  const [candidateToDelete, setCandidateToDelete] = useState<{ id: string; name: string } | null>(null)
  const [manualWhitelistOpen, setManualWhitelistOpen] = useState(false)
  const [manualWhitelistConfirmOpen, setManualWhitelistConfirmOpen] = useState(false)
  const [manualWallet, setManualWallet] = useState('')
  const [manualName, setManualName] = useState('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false)
  const [uploadFileName, setUploadFileName] = useState('daftar-pemilih.csv')
  const [uploadCsvContent, setUploadCsvContent] = useState('')
  const [syncOnchainConfirmOpen, setSyncOnchainConfirmOpen] = useState(false)
  const [nextPhaseConfirmOpen, setNextPhaseConfirmOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [whitelistSearch, setWhitelistSearch] = useState('')
  const whitelistQuery = useWhitelistEntries(election.id)
  const createWhitelistEntry = useCreateWhitelistEntry()
  const deleteWhitelistEntry = useDeleteWhitelistEntry(election.id)
  const createWhitelistEntriesBulk = useCreateWhitelistEntriesBulk(election.id)
  const updateWhitelistSyncStatus = useUpdateWhitelistSyncStatus(election.id)
  const whitelistImportJobsQuery = useWhitelistImportJobs(election.id)
  const whitelistImportSignedUrl = useWhitelistImportSignedUrl()
  const candidatesQuery = useProposalCandidates(election.id)

  // Track transaction success for whitelist sync
  useEffect(() => {
    if (isConfirmed && txHash && isSyncing) {
      const unsyncedAddresses = (whitelistQuery.data ?? [])
        .filter(r => r.syncStatus !== 'synced')
        .map(r => r.walletAddress)

      if (unsyncedAddresses.length > 0) {
        updateWhitelistSyncStatus.mutate({
          proposalDraftId: election.id,
          txHash: txHash,
          walletAddresses: unsyncedAddresses
        }, {
          onSuccess: () => {
            setIsSyncing(false)
            setSyncOnchainConfirmOpen(false)
            resetWrite()
            showToast({
              tone: 'success',
              title: 'Sinkronisasi Berhasil',
              description: 'Daftar pemilih telah berhasil didaftarkan on-chain.',
            })
          }
        })
      } else {
        setIsSyncing(false)
        setSyncOnchainConfirmOpen(false)
      }
    }
  }, [isConfirmed, txHash, isSyncing, election.id, whitelistQuery.data, updateWhitelistSyncStatus, showToast, resetWrite])

  // Track transaction success for phase transition
  useEffect(() => {
    if (isConfirmed && txHash && nextPhaseConfirmOpen) {
      setNextPhaseConfirmOpen(false)
      resetWrite()
      showToast({
        tone: 'success',
        title: 'Fase Diperbarui',
        description: 'Fase pemilihan berhasil diubah di blockchain.',
      })
    }
  }, [isConfirmed, txHash, nextPhaseConfirmOpen, showToast, resetWrite])

  // Handle Error
  useEffect(() => {
    if (writeError) {
      setIsSyncing(false)
      showToast({
        tone: 'error',
        title: 'Transaksi Gagal',
        description: (writeError as any)?.shortMessage || writeError.message || 'Terjadi kesalahan saat memproses transaksi.',
      })
      resetWrite()
    }
  }, [writeError, showToast, resetWrite])

  const whitelistRecords = useMemo(() => {
    return (whitelistQuery.data ?? []).map((record) => ({
      id: record.id,
      wallet: record.walletAddress,
      name: record.voterName ?? 'Nama belum diisi',
      status: record.syncStatus === 'synced' ? 'synced' as const : record.validationStatus === 'valid' ? 'valid' as const : 'pending' as const,
      addedAt: new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(record.createdAt)),
      isFallback: false,
    }))
  }, [whitelistQuery.data])

  useEffect(() => {
    setCandidates((candidatesQuery.data ?? []).map((candidate, index) => ({
      id: candidate.id,
      number: `K${String(index + 1).padStart(2, '0')}`,
      name: candidate.fullName,
      faculty: candidate.faculty ?? candidate.studentId ?? 'Data fakultas belum diisi',
      summary: candidate.vision ?? candidate.bio ?? 'Ringkasan kandidat belum diisi.',
      imageTone: index % 2 === 0 ? 'dark' : 'neutral',
      identityNumber: candidate.studentId ?? '-',
      bio: candidate.bio ?? '-',
      vision: candidate.vision ?? '-',
      mission: '-',
    })))
  }, [candidatesQuery.data])

  const filteredWhitelistRecords = useMemo(() => {
    const keyword = whitelistSearch.trim().toLowerCase()
    if (!keyword) return whitelistRecords
    return whitelistRecords.filter((record) => {
      return record.wallet.toLowerCase().includes(keyword) || record.name.toLowerCase().includes(keyword)
    })
  }, [whitelistRecords, whitelistSearch])

  const handleDeleteCandidate = () => {
    if (!candidateToDelete) return
    setCandidates((items) => items.filter((candidate) => candidate.id !== candidateToDelete.id))
    setCandidateToDelete(null)
    showToast({
      tone: 'success',
      title: 'Kandidat dihapus',
      description: 'Data kandidat berhasil dihapus.',
    })
  }

  const handleManualWhitelistSave = () => {
    const normalizedWallet = manualWallet.trim()
    if (!normalizedWallet) {
      showToast({
        tone: 'error',
        title: 'Alamat wallet wajib diisi',
        description: 'Masukkan alamat wallet sebelum menambahkan pemilih manual.',
      })
      return
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedWallet)) {
      showToast({
        tone: 'error',
        title: 'Format wallet tidak valid',
        description: 'Alamat wallet harus diawali 0x dan berisi 40 karakter heksadesimal.',
      })
      return
    }

    setManualWhitelistConfirmOpen(true)
  }

  const handleConfirmManualWhitelistSave = () => {
    setManualWhitelistConfirmOpen(false)

    createWhitelistEntry.mutate(
      {
        proposalDraftId: election.id,
        walletAddress: manualWallet.trim().toLowerCase(),
        voterName: manualName || null,
      },
      {
        onSuccess: () => {
          setManualWhitelistOpen(false)
          showToast({
            tone: 'success',
            title: 'Pemilih berhasil ditambahkan',
            description: `Wallet ${manualWallet.trim().toLowerCase()} telah ditambahkan ke whitelist database. Jalankan sinkronisasi untuk mendaftarkan on-chain.`,
          })
          setManualWallet('')
          setManualName('')
        },
        onError: (error) => {
          showToast({
            tone: 'error',
            title: 'Gagal menambahkan pemilih',
            description: getRepositoryErrorMessage(error, 'Tambah whitelist live belum tersedia untuk data ini.'),
          })
        },
      },
    )
  }

  const handleDeleteWhitelistEntry = (recordId: string, wallet: string, isFallback: boolean) => {
    if (isFallback) {
      showToast({
        tone: 'info',
        title: 'Mode transisi aktif',
        description: `Hapus whitelist live untuk ${wallet} belum tersedia karena data masih lokal.`,
      })
      return
    }

    deleteWhitelistEntry.mutate(recordId, {
      onSuccess: () => {
        showToast({
          tone: 'success',
          title: 'Pemilih dihapus',
          description: `Wallet ${wallet} berhasil dihapus dari whitelist.`,
        })
      },
      onError: (error) => {
        showToast({
          tone: 'error',
          title: 'Gagal menghapus pemilih',
          description: getRepositoryErrorMessage(error, 'Hapus whitelist live belum tersedia untuk data ini.'),
        })
      },
    })
  }

  const handleUploadCsv = () => {
    if (!uploadFileName.trim()) {
      showToast({
        tone: 'error',
        title: 'Nama file wajib diisi',
        description: 'Masukkan nama file CSV sebelum melanjutkan unggahan.',
      })
      return
    }

    if (!uploadCsvContent.trim()) {
      showToast({
        tone: 'error',
        title: 'Isi CSV wajib diisi',
        description: 'Tempelkan isi CSV sebelum memproses unggahan whitelist.',
      })
      return
    }

    setUploadConfirmOpen(true)
  }

  const handleConfirmUploadCsv = () => {
    const entries = parseWhitelistCsv(uploadCsvContent)
    const invalidCount = countInvalidWhitelistCsvRows(uploadCsvContent)

    if (entries.length === 0) {
      setUploadConfirmOpen(false)
      showToast({
        tone: 'error',
        title: 'CSV tidak valid',
        description: 'Tidak ada alamat wallet valid yang dapat diproses dari isi CSV.',
      })
      return
    }

    createWhitelistEntriesBulk.mutate(
      {
        proposalDraftId: election.id,
        fileName: uploadFileName,
        rawContent: uploadCsvContent,
        entries,
        invalidCount,
      },
      {
        onSuccess: () => {
          setUploadConfirmOpen(false)
          setUploadModalOpen(false)
          setUploadCsvContent('')
          showToast({
            tone: 'success',
            title: 'File whitelist diunggah',
            description: `File ${uploadFileName} berhasil diproses. ${entries.length} wallet valid ditambahkan${invalidCount > 0 ? `, ${invalidCount} baris diabaikan.` : '.'}`,
          })
        },
        onError: (error) => {
          setUploadConfirmOpen(false)
          showToast({
            tone: 'error',
            title: 'Gagal memproses CSV',
            description: getRepositoryErrorMessage(error, 'Unggahan CSV whitelist belum tersedia untuk data ini.'),
          })
        },
      },
    )
  }

  const handleQuickAction = (label: string) => {
    showToast({
      tone: 'info',
      title: `${label} diproses`,
      description: `Aksi ${label.toLowerCase()} berhasil dijalankan.`,
    })
  }

  const handleConfirmSyncOnchain = () => {
    if (!isAddressValid) {
      showToast({
        tone: 'error',
        title: 'Alamat Kontrak Tidak Valid',
        description: 'Pemilihan ini belum dideploy ke blockchain.',
      })
      setSyncOnchainConfirmOpen(false)
      return
    }

    const unsyncedAddresses = (whitelistQuery.data ?? [])
      .filter(r => r.syncStatus !== 'synced')
      .map(r => r.walletAddress)

    if (unsyncedAddresses.length === 0) {
      showToast({
        tone: 'info',
        title: 'Sudah Sinkron',
        description: 'Seluruh daftar pemilih sudah terdaftar on-chain.',
      })
      setSyncOnchainConfirmOpen(false)
      return
    }

    setIsSyncing(true)
    registerVoters(unsyncedAddresses)
  }

  const handleConfirmNextPhase = () => {
    if (!isAddressValid) return
    transitionToNextPhase()
  }

  const handleOpenImportFile = (filePath: string) => {

    whitelistImportSignedUrl.mutate(filePath, {
      onSuccess: (signedUrl) => {
        window.open(signedUrl, '_blank', 'noopener,noreferrer')
      },
      onError: (error) => {
        showToast({
          tone: 'error',
          title: 'Gagal membuka file impor',
          description: getRepositoryErrorMessage(error, 'Tautan file impor belum tersedia.'),
        })
      },
    })
  }

  const renderCandidateTab = () => (
    <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_420px]">
      <div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {candidates.map((candidate) => (
            <article key={candidate.id} className={`rounded-[30px] border border-slate-200 bg-white p-5 ${canAddCandidate ? 'cursor-pointer transition-all duration-150 hover:-translate-y-px hover:border-slate-300' : ''}`} onClick={canAddCandidate ? () => window.location.assign(`/admin/manajemen-pemilihan/${election.id}/kandidat/${candidate.id}/edit`) : undefined}>
              <div className="relative">
                <div className="absolute left-4 top-4 z-10 rounded-xl bg-black px-3 py-2 text-[14px] font-semibold text-white">
                  {candidate.number}
                </div>
                <CandidateImage tone={candidate.imageTone} />
              </div>
              <div className="mt-6">
                <h2 className="text-[18px] font-semibold text-slate-900">{candidate.name}</h2>
                <p className="mt-1 text-[14px] text-slate-500">{candidate.faculty}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-100 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Visi Misi Singkat</p>
                <RichTextRenderer value={candidate.summary} className="mt-2 text-[13px] leading-6 text-slate-800" />
              </div>
                <div className="mt-6 flex items-center justify-end gap-4">
                  {canAddCandidate ? (
                    <div className="flex items-center gap-2">
                       <button type="button" onClick={(event) => { event.stopPropagation(); setCandidateToDelete({ id: candidate.id, name: candidate.name }) }} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                         <Trash2 className="h-4 w-4" />
                       </button>
                       <Link href={`/admin/manajemen-pemilihan/${election.id}/kandidat/${candidate.id}/edit`} onClick={(event) => event.stopPropagation()} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                         <Pencil className="h-4 w-4" />
                       </Link>
                    </div>
                  ) : null}
                </div>
            </article>
          ))}

          {canAddCandidate ? (
            <Link href={`/admin/manajemen-pemilihan/${election.id}/tambah-kandidat`} className="rounded-[30px] border border-dashed border-slate-300 bg-white p-5 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
              <div className="flex h-full min-h-[540px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <CirclePlus className="h-8 w-8" />
                </div>
                <h2 className="mt-8 text-[28px] font-semibold text-slate-900">Tambah Kandidat Baru</h2>
                <p className="mt-3 max-w-[240px] text-[15px] leading-8 text-slate-500">
                  Format foto: JPG, PNG (Max 5MB)
                </p>
              </div>
            </Link>
          ) : (
            <div className="rounded-[30px] border border-dashed border-slate-200 bg-slate-50 p-5 opacity-70">
              <div className="flex h-full min-h-[540px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <CirclePlus className="h-8 w-8" />
                </div>
                <h2 className="mt-8 text-[28px] font-semibold text-slate-500">Tambah Kandidat Dinonaktifkan</h2>
                <p className="mt-3 max-w-[260px] text-[15px] leading-8 text-slate-400">
                  Kandidat tidak dapat ditambahkan lagi karena pemilihan ini sudah selesai.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-6">
        <article className="rounded-[28px] bg-slate-100 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Anchor Transaksi</p>
          <div className="mt-5 rounded-2xl bg-white p-5">
            <p className="font-mono text-[12px] leading-6 text-slate-500 break-all">{election.detail.blockchainAnchor}</p>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 text-[13px] text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
            {election.detail.blockchainNetworkLabel}
          </p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Status Pemilih</p>
          <div className="mt-5 flex items-end justify-between gap-4">
            <p className="text-[52px] font-semibold leading-none tracking-[-0.05em] text-slate-900">{election.detail.turnout.total}</p>
            <p className="pb-2 text-[18px] text-slate-500">/ {election.detail.turnout.target}</p>
            <p className="pb-2 text-[16px] font-semibold text-slate-900">{election.detail.turnout.percentage}</p>
          </div>
          <div className="mt-6 h-2 rounded-full bg-slate-100">
            <div className={`h-2 rounded-full bg-black ${election.detail.turnout.progressWidthClassName}`} />
          </div>
          <p className="mt-4 text-center text-[12px] leading-6 text-slate-400">{election.detail.turnout.note}</p>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Tindakan Cepat</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {election.detail.quickActions.map((action) => (
              <button key={action.label} type="button" onClick={() => handleQuickAction(action.label)} className="flex h-[92px] flex-col items-center justify-center rounded-[22px] bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                <QuickActionIcon icon={action.icon} />
                <span className="mt-3 text-[13px] font-semibold">{action.label}</span>
              </button>
            ))}
          </div>
        </article>
      </aside>
    </section>
  )

  const renderWhitelistTab = () => (
    <section className="mt-8 space-y-8">
      <div className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total Pemilih</p>
          <div className="mt-5 flex items-end gap-3">
            <p className="text-[56px] font-semibold leading-none tracking-[-0.05em] text-slate-900">{whitelistRecords.length}</p>
            <p className="pb-2 text-[22px] text-slate-500">/ {election.detail.whitelist.target}</p>
          </div>
          <div className="mt-6 h-2 rounded-full bg-slate-100">
            <div className={`h-2 rounded-full bg-black ${election.detail.turnout.progressWidthClassName}`} />
          </div>
        </article>

        <article className="rounded-[28px] border border-emerald-200 border-l-4 border-l-emerald-500 bg-white p-6 xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Integritas Database</p>
          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[22px] font-semibold text-slate-900">{election.detail.whitelist.integrityTitle}</h3>
              <p className="mt-4 max-w-[360px] text-[15px] leading-7 text-slate-500">{election.detail.whitelist.integrityDescription}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border-l-4 border-l-black bg-slate-100 p-6 xl:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Bukti Transaksi</p>
          <div className="mt-5 rounded-2xl bg-white p-5">
            <p className="font-mono text-[12px] leading-6 text-slate-800 break-all">{election.detail.whitelist.evidence}</p>
          </div>
          <p className="mt-5 inline-flex items-center gap-2 text-[13px] text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {election.detail.whitelist.evidenceStatus}
          </p>
        </article>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_420px]">
        <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 md:flex-row md:items-center md:justify-between">
            <h2 className="text-[20px] font-semibold text-slate-900">Daftar Whitelist Terbaru</h2>
            <div className="inline-flex h-11 items-center gap-3 rounded-2xl bg-slate-100 px-4 text-slate-400 md:w-[260px]">
              <Link2 className="h-4 w-4" />
              <input
                type="text"
                value={whitelistSearch}
                onChange={(event) => setWhitelistSearch(event.target.value)}
                placeholder="Cari alamat atau nama..."
                className="w-full bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          {whitelistQuery.error ? (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-[13px] text-amber-800" role="status">
              {getRepositoryErrorMessage(whitelistQuery.error, 'Daftar pemilih live belum tersedia dari Supabase.')}
            </div>
          ) : null}
          {!whitelistQuery.isLoading && whitelistRecords.length === 0 ? (
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-[13px] text-slate-600">
              Belum ada whitelist di Supabase untuk proposal ini. Tambahkan manual atau unggah CSV.
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-[24px] border border-slate-100 bg-white">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-6 py-4">Alamat Wallet</th>
                  <th className="px-6 py-4">Nama (Opsional)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tanggal Ditambahkan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {whitelistQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={`whitelist-loading-${index}`} className="border-b border-slate-100">
                      <td className="px-6 py-5" colSpan={5}>
                        <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : null}
                {filteredWhitelistRecords.map((record) => (
                    <tr key={record.wallet} className="text-[15px] text-slate-700 transition hover:bg-slate-50/70">
                    <td className="px-6 py-5 font-mono">{record.wallet}</td>
                    <td className="px-6 py-5">{record.name}</td>
                    <td className="px-6 py-5"><StatusBadge status={record.status} /></td>
                    <td className="px-6 py-5 text-slate-500">{record.addedAt}</td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteWhitelistEntry(record.id, record.wallet, record.isFallback)}
                        disabled={deleteWhitelistEntry.isPending}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
                        aria-label={`Hapus pemilih ${record.wallet}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!whitelistQuery.isLoading && filteredWhitelistRecords.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-[14px] text-slate-500" colSpan={5}>Tidak ada data whitelist yang ditampilkan.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-5 text-[14px] text-slate-500">
            <p>Menampilkan {filteredWhitelistRecords.length} dari {whitelistRecords.length} pemilih</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => showToast({ tone: 'info', title: 'Pagination', description: 'Navigasi halaman sedang disiapkan.' })} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">‹</button>
              <button type="button" onClick={() => showToast({ tone: 'info', title: 'Pagination', description: 'Navigasi halaman sedang disiapkan.' })} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">›</button>
            </div>
          </div>
        </article>

        <article className="rounded-[30px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900">Whitelisting Pemilih</h2>
              <p className="mt-3 max-w-[300px] text-[15px] leading-7 text-slate-500">Unggah berkas untuk mendaftarkan identitas digital pemilih secara massal.</p>
            </div>
            <button type="button" onClick={() => setManualWhitelistOpen(true)} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
              <CirclePlus className="h-4 w-4" />
              Tambah Pemilih Manual
            </button>
          </div>
          <button type="button" onClick={() => setUploadModalOpen(true)} className="mt-8 block w-full rounded-[28px] border border-dashed border-slate-300 p-8 text-center hover:border-slate-400">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <Upload className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-[28px] font-semibold text-slate-900">Unggah Daftar Pemilih (.csv)</h3>
            <p className="mt-3 text-[15px] leading-7 text-slate-500">Maksimal 10.000 alamat wallet per unggahan.</p>
            <span className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{election.detail.whitelist.uploadSupport}</span>
          </button>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Riwayat Import</p>
                <p className="mt-2 text-[14px] text-slate-700">Pantau file CSV yang pernah diproses untuk whitelist draft.</p>
              </div>
            </div>

            {whitelistImportJobsQuery.isLoading ? (
              <div className="mt-4 h-16 animate-pulse rounded-2xl bg-white" />
            ) : null}

            {whitelistImportJobsQuery.data && whitelistImportJobsQuery.data.length > 0 ? (
              <div className="mt-4 space-y-3">
                {whitelistImportJobsQuery.data.slice(0, 3).map((job) => (
                  <div key={job.id} className="rounded-2xl bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Link href={`/admin/manajemen-pemilihan/${election.id}/import-job/${job.id}`} className="text-[13px] font-semibold text-blue-600 hover:underline">{job.fileName}</Link>
                        <p className="mt-1 text-[12px] text-slate-500">{job.rowCount} wallet valid · {job.invalidCount} baris diabaikan</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">{job.status}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenImportFile(job.filePath)}
                          disabled={whitelistImportSignedUrl.isPending}
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 px-3 text-[12px] font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                        >
                          Buka File
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!whitelistImportJobsQuery.isLoading && (!whitelistImportJobsQuery.data || whitelistImportJobsQuery.data.length === 0) ? (
              <p className="mt-4 text-[13px] text-slate-500">Belum ada riwayat import CSV untuk proposal ini.</p>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  )

  const renderParameterTab = () => (
    <section className="mt-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => showToast({ tone: 'info', title: 'Log Audit', description: 'Fitur log audit akan tersedia pada versi produksi.' })} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[15px] font-medium text-slate-700 hover:bg-slate-200">
          <ListChecks className="h-4 w-4" />
          Lihat Log Audit
        </button>
        {isAddressValid && (
          <button 
            type="button" 
            onClick={() => setNextPhaseConfirmOpen(true)} 
            disabled={isWritePending || isConfirming || onChainPhase === 3}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-[15px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${(isWritePending || isConfirming) ? 'animate-spin' : ''}`} />
            Buka Fase Berikutnya
          </button>
        )}
        <button type="button" onClick={() => showToast({ tone: 'info', title: 'Edit Parameter', description: 'Parameter pemilihan hanya dapat diubah sebelum fase commit dimulai.' })} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-500 px-5 text-[15px] font-medium text-white hover:bg-slate-600">
          <Pencil className="h-4 w-4" />
          Edit Parameter
        </button>
        <button 
          type="button" 
          onClick={() => setSyncOnchainConfirmOpen(true)} 
          disabled={isWritePending || isConfirming}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-[15px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Link2 className="h-4 w-4" />
          Sinkronisasi ke Blockchain
        </button>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.45fr)_420px]">
        <article className="rounded-[30px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900">{election.detail.parameterVoting.phaseTitle}</h2>
              <p className="mt-3 text-[15px] text-slate-500">{election.detail.parameterVoting.phaseDescription}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-400">
              <CalendarDays className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-black text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600">Fase 01</p>
                  <h3 className="mt-1 text-[18px] font-semibold text-slate-900">{election.detail.parameterVoting.phaseOne.label}</h3>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] bg-slate-100 p-4 text-[15px] text-slate-700">
                <div className="flex items-center justify-between gap-4 py-2"><span>Mulai</span><span className="font-mono">{election.detail.parameterVoting.phaseOne.start}</span></div>
                <div className="flex items-center justify-between gap-4 py-2"><span>Selesai</span><span className="font-mono">{election.detail.parameterVoting.phaseOne.end}</span></div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-100 text-slate-500">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Fase 02</p>
                  <h3 className="mt-1 text-[18px] font-semibold text-slate-400">{election.detail.parameterVoting.phaseTwo.label}</h3>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] bg-slate-100 p-4 text-[15px] text-slate-700">
                <div className="flex items-center justify-between gap-4 py-2"><span>Mulai</span><span className="font-mono">{election.detail.parameterVoting.phaseTwo.start}</span></div>
                <div className="flex items-center justify-between gap-4 py-2"><span>Selesai</span><span className="font-mono">{election.detail.parameterVoting.phaseTwo.end}</span></div>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[30px] bg-slate-100 p-6">
          <h2 className="text-[20px] font-semibold text-slate-900">Aturan Konsensus</h2>
          <div className="mt-8 space-y-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Metode Hitung</p>
              <p className="mt-3 text-[18px] font-semibold text-slate-900">{election.detail.parameterVoting.consensus.method}</p>
            </div>
            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Kuorum Minimum</p>
                  <p className="mt-3 text-[18px] font-semibold text-slate-900">{election.detail.parameterVoting.consensus.quorum}</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white">
                <div className={`h-2 rounded-full bg-black ${election.detail.parameterVoting.consensus.quorumProgressWidthClassName}`} />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Protection</p>
              <p className="mt-3 text-[18px] font-semibold text-slate-900">{election.detail.parameterVoting.consensus.protectionTitle}</p>
              <p className="mt-2 text-[14px] leading-7 text-slate-500">{election.detail.parameterVoting.consensus.protectionDescription}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <article className="rounded-[30px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <h2 className="text-[20px] font-semibold text-slate-900">Detail Kontrak</h2>
          <div className="mt-8 space-y-4">
            <div className="rounded-[20px] border-l-4 border-l-black bg-slate-100 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Alamat Kontrak</p>
              <p className="mt-3 font-mono text-[14px] break-all text-slate-700">{election.detail.parameterVoting.contract.address}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] bg-slate-100 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Jaringan</p>
                <p className="mt-3 text-[18px] font-semibold text-slate-900">{election.detail.parameterVoting.contract.network}</p>
              </div>
              <div className="rounded-[20px] bg-slate-100 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Protocol Version</p>
                <p className="mt-3 text-[18px] font-semibold text-slate-900">{election.detail.parameterVoting.contract.version}</p>
              </div>
            </div>
            <div className="rounded-[20px] bg-slate-100 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Current Blockchain Hash</p>
              <p className="mt-3 font-mono text-[13px] break-all text-slate-700">{election.detail.parameterVoting.contract.currentHash}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[30px] bg-[#161b33] p-6 text-white">
          <h2 className="text-[20px] font-semibold text-white">{election.detail.parameterVoting.privacy.headline}</h2>
          <div className="mt-8 space-y-8">
            {election.detail.parameterVoting.privacy.items.map((item) => (
              <div key={item.title}>
                <h3 className="text-[18px] font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-[14px] leading-7 text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 border-t border-white/10 pt-6">
            <button type="button" onClick={() => showToast({ tone: 'info', title: 'Verifikasi Privasi', description: 'Audit privasi end-to-end akan tersedia pada versi produksi.' })} className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-white text-[14px] font-semibold uppercase tracking-[0.08em] text-slate-900 hover:bg-slate-50">
              {election.detail.parameterVoting.privacy.ctaLabel}
            </button>
          </div>
        </article>
      </div>
    </section>
  )

  const renderRealtimeTab = () => {
    const indexerData = resultsQuery.data
    const totalVoters = parseInt(election.detail.realtime.totalTarget) || 100
    const totalVotes = indexerData?.totalRevealed ?? 0
    const participationRate = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0
    
    // Map indexer candidate results to UI candidates
    const mappedResults = candidates.map((candidate, index) => {
      const candidateId = index + 1 // 1-indexed on contract
      const result = indexerData?.candidateResults.find((r: PublicElectionCandidateResultRecord) => Number(r.candidateId) === candidateId)
      const votes = result?.voteCount ?? 0
      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
      
      return {
        candidateNumber: String(candidateId),
        candidateName: candidate.name,
        votes: String(votes),
        percentage: `${percentage.toFixed(1)}%`,
        tone: index === 0 ? 'primary' as const : 'secondary' as const,
      }
    })

    const auditFeed = (auditLogsQuery.data ?? []).map(log => ({
      tx: log.txHash,
      time: new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(log.createdAt)),
      age: 'Baru saja', // Simplified
    }))

    return (
      <section className="mt-8 space-y-8">
        <div className="flex justify-end">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] ${resultsQuery.isError ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <span className={`h-3 w-3 rounded-full ${resultsQuery.isError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {resultsQuery.isError ? 'Indexer Tertunda' : (resultsQuery.isLoading ? 'Menghubungkan Indexer...' : 'Indexer Terhubung (Live)')}
          </span>
        </div>

        <div className="grid gap-6 2xl:grid-cols-3">
          <article className="rounded-[30px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total Suara Masuk</p>
            <div className="mt-5 flex items-end gap-3">
              <p className="text-[56px] font-semibold leading-none tracking-[-0.05em] text-slate-900">{totalVotes}</p>
              <p className="pb-2 text-[22px] text-slate-500">/ {totalVoters}</p>
            </div>
            <div className="mt-8 flex items-center justify-between gap-4 text-[16px] text-slate-700">
              <span>Partisipasi</span>
              <span className="font-semibold text-slate-900">{participationRate.toFixed(1)}%</span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-black transition-all duration-1000" style={{ width: `${participationRate}%` }} />
            </div>
          </article>

          <article className="rounded-[30px] border-l-4 border-l-black bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Waktu Tersisa</p>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[48px] font-semibold leading-none tracking-[-0.05em] text-slate-900">{election.detail.realtime.remaining.hours}</p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-slate-400">Jam</p>
              </div>
              <div>
                <p className="text-[48px] font-semibold leading-none tracking-[-0.05em] text-slate-900">{election.detail.realtime.remaining.minutes}</p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-slate-400">Menit</p>
              </div>
              <div>
                <p className="text-[48px] font-semibold leading-none tracking-[-0.05em] text-slate-900">{election.detail.realtime.remaining.seconds}</p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-slate-400">Detik</p>
              </div>
            </div>
            <button type="button" onClick={() => showToast({ tone: 'info', title: 'Hitung Mundur', description: 'Waktu mundur otomatis berjalan pada saat pemilihan berlangsung.' })} className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-100 text-[14px] font-semibold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-200">
              {election.detail.realtime.remaining.label}
            </button>
          </article>

          <article className="rounded-[30px] bg-[#161b33] p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Status Jaringan</p>
            <div className="mt-6 flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-white">{election.detail.realtime.networkStatus.title}</h2>
                <p className="mt-3 text-[14px] leading-7 text-slate-300">{election.detail.realtime.networkStatus.subtitle}</p>
              </div>
            </div>
          </article>
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.4fr)_420px]">
          <article className="rounded-[30px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-[20px] font-semibold text-slate-900">Perolehan Suara Kandidat</h2>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => { resultsQuery.refetch(); showToast({ tone: 'success', title: 'Data di-refresh', description: 'Data perolehan suara telah diperbarui.' }) }} 
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <RefreshCw className={`h-4 w-4 ${resultsQuery.isRefetching ? 'animate-spin' : ''}`} />
                </button>
                <button type="button" onClick={() => showToast({ tone: 'info', title: 'Unduh Laporan', description: 'Fitur unduh laporan sedang disiapkan.' })} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-[14px] font-medium text-white hover:bg-slate-900">
                  <Download className="h-4 w-4" />
                  Unduh Laporan
                </button>
              </div>
            </div>
            <div className="mt-8 space-y-10">
              {mappedResults.map((result) => (
                <div key={result.candidateNumber} className="flex gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,_#475569,_#0f172a_72%)]" />
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">No. Urut {result.candidateNumber}</p>
                    <div className="mt-2 flex items-end justify-between gap-4">
                      <h3 className="text-[18px] font-semibold text-slate-900">{result.candidateName}</h3>
                      <div className="text-right">
                        <p className="text-[18px] font-semibold text-slate-900">{result.votes} Suara</p>
                        <p className="mt-1 text-[14px] text-slate-500">{result.percentage}</p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${result.tone === 'primary' ? 'bg-black' : 'bg-slate-400'}`} 
                        style={{ width: result.percentage }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="space-y-6">
            <article className="rounded-[30px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[20px] font-semibold text-slate-900">Live Feed Blockchain</h2>
                <span className={`h-3 w-3 rounded-full ${auditLogsQuery.isLoading ? 'animate-pulse bg-blue-500' : 'bg-emerald-500'}`} />
              </div>
              <div className="mt-6 space-y-4">
                {auditFeed.length > 0 ? auditFeed.map((item) => (
                  <article key={item.tx} className="rounded-[20px] border-l-4 border-l-black bg-slate-100 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Terkonfirmasi</p>
                        <p className="mt-3 font-mono text-[13px] text-slate-700 break-all">{item.tx}</p>
                        <p className="mt-3 text-[12px] text-slate-500">◷ {item.time}</p>
                      </div>
                      <span className="text-[12px] text-slate-400 whitespace-nowrap">{item.age}</span>
                    </div>
                  </article>
                )) : (
                  <p className="text-[14px] text-slate-500 py-4 text-center italic">Menunggu transaksi pertama...</p>
                )}
              </div>
              <button type="button" onClick={() => showToast({ tone: 'info', title: 'Explorer Blockchain', description: 'Tautan ke Basescan explorer akan tersedia pada versi produksi.' })} className="mt-8 inline-flex h-12 w-full items-center justify-center text-[14px] font-semibold uppercase tracking-[0.08em] text-slate-700 hover:text-slate-900">
                Lihat Semua Transaksi
              </button>
            </article>

            <article className="rounded-[30px] bg-slate-100 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-slate-900">{election.detail.realtime.guarantee.title}</h2>
                  <p className="mt-3 text-[14px] leading-7 text-slate-500">{election.detail.realtime.guarantee.description}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    )
  }

  return (
    <AdminShell>
      <ScrollReveal variant="fade-up" duration={700}>
      <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/manajemen-pemilihan"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              aria-label="Kembali ke manajemen pemilihan"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[48px]">{election.title}</h1>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${election.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'}`}>
              {election.detail.statusPill}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[14px] text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1.5">
              <FileText className="h-4 w-4" />
              {election.code}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {election.periodLabel}
            </span>
          </div>
        </div>

        {activeTab === 'kandidat' ? (
          canAddCandidate ? (
            <Link href={`/admin/manajemen-pemilihan/${election.id}/tambah-kandidat`} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900">
              <CirclePlus className="h-4 w-4" />
              Tambah Kandidat
            </Link>
          ) : (
            <button type="button" disabled className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-200 px-6 text-[15px] font-medium text-slate-400">
              <CirclePlus className="h-4 w-4" />
              Tambah Kandidat
            </button>
          )
        ) : null}
      </section>

      <section className="mt-8 flex flex-wrap items-center gap-8 border-b border-slate-100 pb-4">
        {adminElectionDetailTabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/manajemen-pemilihan/${election.id}?tab=${tab.id}`}
            className={activeTab === tab.id
              ? 'border-b-2 border-black pb-3 text-[16px] font-semibold text-slate-900'
              : 'pb-3 text-[16px] text-slate-500'}
          >
            {tab.label}
          </Link>
        ))}
      </section>

      {activeTab === 'kandidat' ? renderCandidateTab() : null}
      {activeTab === 'whitelist' ? renderWhitelistTab() : null}
      {activeTab === 'parameter' ? renderParameterTab() : null}
      {activeTab === 'realtime' ? renderRealtimeTab() : null}
      </ScrollReveal>

      <ConfirmDialog
        open={candidateToDelete !== null}
        title="Hapus kandidat?"
        description={candidateToDelete
          ? `Kandidat ${candidateToDelete.name} akan dihapus dari daftar. Aksi ini tidak dapat dibatalkan.`
          : ''}
        confirmLabel="Hapus Kandidat"
        tone="danger"
        onCancel={() => setCandidateToDelete(null)}
        onConfirm={handleDeleteCandidate}
      />

      <ModalShell
        open={manualWhitelistOpen}
        title="Tambah Pemilih Manual"
        description="Masukkan alamat wallet dan nama opsional untuk menambahkan pemilih ke whitelist."
        onClose={() => setManualWhitelistOpen(false)}
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-slate-800">Alamat Wallet <RequiredAsterisk /></label>
            <input
              type="text"
              value={manualWallet}
              onChange={(event) => setManualWallet(event.target.value)}
              placeholder="0x..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-slate-800">Nama (Opsional)</label>
            <input
              type="text"
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              placeholder="Masukkan nama pemilih"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setManualWhitelistOpen(false)} className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-700 hover:bg-slate-200">
              Batal
            </button>
            <button type="button" onClick={handleManualWhitelistSave} className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white hover:bg-slate-900">
              Tambahkan
            </button>
          </div>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={manualWhitelistConfirmOpen}
        title="Tambahkan pemilih ini?"
        description="Pastikan alamat wallet sudah benar sebelum ditambahkan ke whitelist."
        confirmLabel="Tambahkan Pemilih"
        onCancel={() => setManualWhitelistConfirmOpen(false)}
        onConfirm={handleConfirmManualWhitelistSave}
      />

      <ModalShell
        open={uploadModalOpen}
        title="Unggah Daftar Pemilih"
        description="Unggah file CSV untuk menambahkan whitelist pemilih secara massal."
        onClose={() => setUploadModalOpen(false)}
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-slate-800">File CSV Whitelist <RequiredAsterisk /></label>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setUploadFileName(file.name)
                const reader = new FileReader()
                reader.onload = (e) => {
                  const content = e.target?.result as string
                  setUploadCsvContent(content)
                }
                reader.readAsText(file)
              }}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-[13px] file:font-medium file:text-slate-700 hover:file:bg-slate-200 outline-none"
            />
            <p className="mt-2 text-[12px] leading-6 text-slate-500">Gunakan format CSV sederhana: satu baris per wallet, opsional diikuti nama setelah koma.</p>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-[13px] leading-6 text-slate-500">
            File akan diproses setelah Anda melanjutkan unggahan. Baris wallet yang tidak valid akan diabaikan.
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setUploadModalOpen(false)} className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-700 hover:bg-slate-200">
              Batal
            </button>
            <button type="button" onClick={handleUploadCsv} disabled={createWhitelistEntriesBulk.isPending} className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white hover:bg-slate-900 disabled:opacity-60">
              {createWhitelistEntriesBulk.isPending ? 'Memproses...' : 'Proses Unggahan'}
            </button>
          </div>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={uploadConfirmOpen}
        title="Proses file whitelist ini?"
        description="Pastikan file CSV yang dipilih sudah benar sebelum diproses ke whitelist."
        confirmLabel="Proses File"
        onCancel={() => setUploadConfirmOpen(false)}
        onConfirm={handleConfirmUploadCsv}
      />

      <ConfirmDialog
        open={syncOnchainConfirmOpen}
        title="Sinkronisasi ke Blockchain?"
        description="Data proposal (kandidat, parameter, dan whitelist) akan disinkronisasikan ke blockchain. Proses ini akan memakan biaya gas dan data tidak dapat diubah lagi."
        confirmLabel={(isWritePending || isConfirming) ? "Memproses..." : "Ya, Sinkronisasikan"}
        onCancel={() => {
          if (!isWritePending && !isConfirming) {
            setSyncOnchainConfirmOpen(false)
            setIsSyncing(false)
          }
        }}
        onConfirm={handleConfirmSyncOnchain}
      />

      <ConfirmDialog
        open={nextPhaseConfirmOpen}
        title="Buka Fase Berikutnya?"
        description="Aksi ini akan mengubah fase pemilihan di blockchain. Pastikan seluruh persiapan fase saat ini sudah selesai karena fase tidak dapat dikembalikan ke sebelumnya."
        confirmLabel={(isWritePending || isConfirming) ? "Memproses..." : "Ya, Lanjutkan"}
        onCancel={() => {
          if (!isWritePending && !isConfirming) {
            setNextPhaseConfirmOpen(false)
          }
        }}
        onConfirm={handleConfirmNextPhase}
      />
    </AdminShell>
  )
}
