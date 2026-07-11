'use client'

import { ArrowLeft, CalendarDays, CirclePlus, Download, ExternalLink, FileText, Link2, ListChecks, Loader2, Pencil, RefreshCw, Share2, ShieldCheck, Trash2, Upload, Users, Clock, ChevronRight, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AdminShell } from '@/components/admin/admin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ModalShell } from '@/components/ui/modal-shell'
import { useToast } from '@/components/ui/toast-provider'
import { adminElectionDetailTabs, AdminElectionDetailTabId, AdminElectionRecord } from '@/lib/admin-election-data'
import { ScrollReveal } from '@/components/public/parallax'
import { useCreateWhitelistEntriesBulk, useCreateWhitelistEntry, useDeleteWhitelistEntry, useUpdateWhitelistSyncStatus, useWhitelistEntries } from '@/hooks/use-whitelist-status'
import { listWhitelistImportJobs } from '@/lib/repositories/whitelistRepository'
import { useWhitelistImportSignedUrl } from '@/hooks/use-whitelist-import-file'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { countInvalidWhitelistCsvRows, parseWhitelistCsv } from '@/lib/whitelist-csv'
import { useProposalCandidates } from '@/hooks/use-proposal-relations'
import { useElectionContract } from '@/hooks/use-election-contract'
import { getElectionResultsFromIndexer, listPonderAuditLogs } from '@/lib/repositories/electionRepository'
import { RequiredAsterisk } from '@/components/ui/required-asterisk'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'
import { PilihDariMasterVoterModal } from '@/components/admin/pilih-dari-master-voter-modal'
import { useMasterVoterByWallet } from '@/hooks/use-master-voters'
import type { PublicElectionCandidateResultRecord, WhitelistEntryRecord } from '@/lib/repositories/types'
import { resolveSchedulePhase } from '@/lib/election-phase'
import { useAccount, useConnect } from 'wagmi'

function QuickActionIcon({ icon }: { icon: 'download' | 'share' | 'audit' | 'report' }) {
  if (icon === 'download') return <Download className="h-5 w-5" />
  if (icon === 'share') return <Share2 className="h-5 w-5" />
  if (icon === 'audit') return <ListChecks className="h-5 w-5" />
  return <FileText className="h-5 w-5" />
}

function CandidateImage({ alt, src, tone }: { alt: string; src?: string | null; tone: 'dark' | 'neutral' }) {
  return (
    <div className={`relative flex h-[280px] w-full items-center justify-center overflow-hidden rounded-2xl ${tone === 'dark' ? 'bg-slate-100' : 'bg-slate-100'} sm:h-[300px]`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          <UserRound className="h-12 w-12" />
        </div>
      )}
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

function getWalletConnectionErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ''

  if (/user rejected|request rejected|user denied|user closed modal|accounts received is empty/i.test(message)) {
    return 'Penyambungan dompet dibatalkan. Coba lagi saat Anda siap.'
  }

  return 'Dompet admin belum berhasil tersambung. Sambungkan ulang Base Account sebelum mengirim transaksi.'
}

export function AdminElectionDetailView({ election, activeTab }: { election: AdminElectionRecord; activeTab: AdminElectionDetailTabId }) {
  const { showToast } = useToast()
  const { isConnected } = useAccount()
  const { connect, connectors, isPending: isConnectPending } = useConnect()

  // Blockchain Hook
  const deployedAddress = election.detail.parameterVoting.contract.address
  const isAddressValid = deployedAddress && deployedAddress.startsWith('0x') && deployedAddress.length === 42
  
  const { 
    registerVoters, 
    unregisterVoterAsync,
    transitionToNextPhase,
    isWritePending, 
    isConfirming, 
    isConfirmed, 
    hash: txHash,
    writeError,
    resetWrite,
    currentPhase: onChainPhase,
    refetchPhase,
    registryAddress: onChainRegistry,
    spaceAdminAddress: onChainSpaceAdmin,
    onChainSpaceId,
    onChainCandidateCount,
  } = useElectionContract(isAddressValid ? deployedAddress : undefined)

  // Indexer Hooks
  const resultsQuery = useQuery({
    queryKey: ['election', 'results', isAddressValid ? deployedAddress : 'unknown'],
    queryFn: () => getElectionResultsFromIndexer(deployedAddress!),
    enabled: Boolean(isAddressValid && deployedAddress && deployedAddress.startsWith('0x')),
    refetchInterval: 1000 * 10,
    retry: false,
  })
  const auditLogsQuery = useQuery({
    queryKey: ['election', 'audit-logs', isAddressValid ? deployedAddress : 'unknown', 6],
    queryFn: () => listPonderAuditLogs(deployedAddress!, 6),
    enabled: Boolean(isAddressValid && deployedAddress && deployedAddress.startsWith('0x')),
    refetchInterval: 1000 * 15,
    retry: false,
  })

  const [candidates, setCandidates] = useState(election.detail.candidates)
  const [candidateToDelete, setCandidateToDelete] = useState<{ id: string; name: string } | null>(null)
  const [manualWhitelistOpen, setManualWhitelistOpen] = useState(false)
  const [manualWhitelistConfirmOpen, setManualWhitelistConfirmOpen] = useState(false)
  const [manualWallet, setManualWallet] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualNameAutoFilled, setManualNameAutoFilled] = useState(false)
  const [debouncedWallet, setDebouncedWallet] = useState('')
  const masterVoterLookup = useMasterVoterByWallet(debouncedWallet)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false)
  const [uploadFileName, setUploadFileName] = useState('daftar-pemilih.csv')
  const [uploadCsvContent, setUploadCsvContent] = useState('')
  const [syncOnchainConfirmOpen, setSyncOnchainConfirmOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMode, setSyncMode] = useState<'manual' | 'auto' | null>(null)
  const [whitelistSearch, setWhitelistSearch] = useState('')
  const [masterVoterModalOpen, setMasterVoterModalOpen] = useState(false)

  const [nowMs, setNowMs] = useState(Date.now())
  const whitelistQuery = useWhitelistEntries(election.id)
  const createWhitelistEntry = useCreateWhitelistEntry()
  const deleteWhitelistEntry = useDeleteWhitelistEntry(election.id)
  const createWhitelistEntriesBulk = useCreateWhitelistEntriesBulk(election.id)
  const updateWhitelistSyncStatus = useUpdateWhitelistSyncStatus(election.id)
  const whitelistImportJobsQuery = useQuery({
    queryKey: ['whitelist-import-jobs', election.id ?? 'unknown'],
    queryFn: () => listWhitelistImportJobs(election.id ?? ''),
    enabled: Boolean(election.id),
    retry: false,
  })
  const whitelistImportSignedUrl = useWhitelistImportSignedUrl()
  const candidatesQuery = useProposalCandidates(election.id)

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Debounce wallet address lookup for auto-fill name
  const walletDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (walletDebounceRef.current) clearTimeout(walletDebounceRef.current)
    const trimmed = manualWallet.trim()
    if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      walletDebounceRef.current = setTimeout(() => setDebouncedWallet(trimmed.toLowerCase()), 500)
    } else {
      setDebouncedWallet('')
    }
    return () => { if (walletDebounceRef.current) clearTimeout(walletDebounceRef.current) }
  }, [manualWallet])

  // Auto-fill name when master voter lookup finds a match
  useEffect(() => {
    if (masterVoterLookup.data) {
      // Auto-fill if name is empty or was previously auto-filled (user hasn't manually typed)
      if (!manualName || manualNameAutoFilled) {
        setManualName(masterVoterLookup.data.fullName)
        setManualNameAutoFilled(true)
      }
    } else if (!masterVoterLookup.data && manualNameAutoFilled) {
      // Clear only if it was auto-filled (not manually typed)
      setManualName('')
      setManualNameAutoFilled(false)
    }
  }, [masterVoterLookup.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const lastProcessedSyncHash = useRef<string | null>(null)
  const pendingSyncAddressesRef = useRef<string[]>([])
  const syncInFlightKeyRef = useRef<string | null>(null)
  const lastAutoSyncKeyRef = useRef<string | null>(null)

  const normalizeWhitelistAddresses = (addresses: string[]) => {
    return Array.from(new Set(
      addresses
        .map((address) => address.trim().toLowerCase())
        .filter((address) => /^0x[a-f0-9]{40}$/.test(address))
    )).sort()
  }

  const onChainPhaseNumber = typeof onChainPhase === 'number' || typeof onChainPhase === 'bigint'
    ? Number(onChainPhase)
    : null
  // ponytail: candidates are set before deployment; no editing after deploy
  const canAddCandidate = false
  // ponytail: whitelist is managed at deploy-time only; no post-deploy editing
  const canManageWhitelist = false
  const phaseLabels = ['Pencoblosan', 'Konfirmasi Suara', 'Selesai'] as const
  const onChainPhaseLabel = onChainPhaseNumber !== null && onChainPhaseNumber >= 0 && onChainPhaseNumber < phaseLabels.length
    ? phaseLabels[onChainPhaseNumber]
    : 'Belum terbaca'
  const dbPhaseInfo = resolveSchedulePhase({
    status: election.status === 'aktif' ? 'deployed' : 'archived',
    commitStartAt: election.schedule?.commitStartAt ?? null,
    revealStartAt: election.schedule?.revealStartAt ?? null,
    endedAt: election.schedule?.endedAt ?? null,
  }, nowMs)
  const getUnsyncedValidAddresses = (extraAddresses: string[] = []) => getUnsyncedValidAddressesFromRecords(whitelistQuery.data ?? [], extraAddresses)
  const getUnsyncedValidAddressesFromRecords = (records: WhitelistEntryRecord[], extraAddresses: string[] = []) => normalizeWhitelistAddresses([
    ...records
      .filter((record) => record.syncStatus !== 'synced' && record.validationStatus === 'valid')
      .map((record) => record.walletAddress),
    ...extraAddresses,
  ])

  const requestWalletConnection = (description: string) => {
    const connector = connectors.find((item) => item.id === 'baseAccount') ?? connectors[0]

    if (!connector) {
      showToast({
        tone: 'error',
        title: 'Dompet belum siap',
        description: 'Connector Base Account belum tersedia. Coba muat ulang halaman.',
      })
      return
    }

    connect(
      { connector },
      {
        onSuccess: () => {
          showToast({
            tone: 'info',
            title: 'Dompet Tersambung',
            description,
          })
        },
        onError: (error) => {
          showToast({
            tone: 'error',
            title: 'Gagal Menyambungkan Dompet',
            description: getWalletConnectionErrorMessage(error),
          })
        },
      },
    )
  }

  const startWhitelistSync = (addresses: string[], mode: 'manual' | 'auto') => {
    const normalizedAddresses = normalizeWhitelistAddresses(addresses)
    const batchKey = normalizedAddresses.join('|')

    if (normalizedAddresses.length === 0) {
      if (mode === 'manual') {
        showToast({
          tone: 'info',
          title: 'Sudah Sinkron',
          description: 'Seluruh daftar pemilih valid sudah terdaftar on-chain.',
        })
        setSyncOnchainConfirmOpen(false)
      }
      return
    }

    if (!isAddressValid) {
      showToast({
        tone: 'error',
        title: 'Alamat Kontrak Tidak Valid',
        description: 'Pemilihan ini belum dideploy ke blockchain.',
      })
      setSyncOnchainConfirmOpen(false)
      return
    }

    if (isWritePending || isConfirming || isSyncing || updateWhitelistSyncStatus.isPending) {
      if (mode === 'manual') {
        showToast({
          tone: 'info',
          title: 'Transaksi Masih Diproses',
          description: 'Tunggu transaksi sinkronisasi sebelumnya selesai sebelum mencoba lagi.',
        })
      }
      return
    }

    if (!isConnected) {
      requestWalletConnection('Dompet admin sudah tersambung. Klik lagi tombol sinkronisasi untuk mengirim transaksi on-chain.')
      setSyncOnchainConfirmOpen(false)
      return
    }

    if (syncInFlightKeyRef.current === batchKey || (mode === 'auto' && lastAutoSyncKeyRef.current === batchKey)) {
      return
    }

    pendingSyncAddressesRef.current = normalizedAddresses
    syncInFlightKeyRef.current = batchKey
    if (mode === 'auto') lastAutoSyncKeyRef.current = batchKey
    setSyncMode(mode)
    setIsSyncing(true)
    registerVoters(normalizedAddresses)

    if (mode === 'auto') {
      showToast({
        tone: 'info',
        title: 'Sinkronisasi On-Chain Dimulai',
        description: 'Konfirmasi transaksi di wallet admin untuk mendaftarkan pemilih ke smart contract.',
      })
    }
  }

  // Track transaction success for whitelist sync
  useEffect(() => {
    if (isConfirmed && txHash && isSyncing && lastProcessedSyncHash.current !== txHash) {
      const unsyncedAddresses = pendingSyncAddressesRef.current

      if (unsyncedAddresses.length > 0) {
        lastProcessedSyncHash.current = txHash
        updateWhitelistSyncStatus.mutate({
          proposalDraftId: election.id,
          txHash: txHash,
          walletAddresses: unsyncedAddresses
        }, {
          onSuccess: () => {
            setIsSyncing(false)
            setSyncMode(null)
            setSyncOnchainConfirmOpen(false)
            pendingSyncAddressesRef.current = []
            syncInFlightKeyRef.current = null
            resetWrite()
            showToast({
              tone: 'success',
              title: 'Sinkronisasi Berhasil',
              description: 'Daftar pemilih telah berhasil didaftarkan on-chain.',
            })
          },
          onError: (error) => {
            lastProcessedSyncHash.current = null // Allow retry
            setIsSyncing(false)
            setSyncMode(null)
            syncInFlightKeyRef.current = null
            showToast({
              tone: 'error',
              title: 'Status Sinkronisasi Gagal Disimpan',
              description: error instanceof Error ? error.message : 'Transaksi sudah selesai, tetapi status database belum berhasil diperbarui. Coba sinkron manual atau periksa koneksi admin.',
            })
          }
        })
      } else {
        setIsSyncing(false)
        setSyncMode(null)
        setSyncOnchainConfirmOpen(false)
        syncInFlightKeyRef.current = null
      }
    }
  }, [isConfirmed, txHash, isSyncing, election.id, whitelistQuery.data, updateWhitelistSyncStatus, showToast, resetWrite])

  // Handle Error
  useEffect(() => {
    if (writeError) {
      setIsSyncing(false)
      setSyncMode(null)
      pendingSyncAddressesRef.current = []
      syncInFlightKeyRef.current = null
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
      syncStatus: record.syncStatus,
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
      avatarPath: candidate.avatarPath ?? null,
      identityNumber: candidate.studentId ?? '-',
      bio: candidate.bio ?? '-',
      vision: candidate.vision ?? '-',
      mission: candidate.mission.join('\n'),
    })))
  }, [candidatesQuery.data])

  const filteredWhitelistRecords = useMemo(() => {
    const keyword = whitelistSearch.trim().toLowerCase()
    if (!keyword) return whitelistRecords
    return whitelistRecords.filter((record) => {
      return record.wallet.toLowerCase().includes(keyword) || record.name.toLowerCase().includes(keyword)
    })
  }, [whitelistRecords, whitelistSearch])

  const unsyncedValidAddresses = getUnsyncedValidAddresses()
  const whitelistSyncStatus = isSyncing || isWritePending || isConfirming
    ? {
        tone: 'blue' as const,
        title: syncMode === 'auto' ? 'Sinkronisasi otomatis berjalan' : 'Sinkronisasi manual berjalan',
        description: isWritePending
          ? 'Menunggu konfirmasi dompet admin untuk mendaftarkan daftar pemilih.'
          : isConfirming
            ? 'Transaksi sudah dikirim dan sedang menunggu konfirmasi Base Sepolia.'
            : 'Menyiapkan transaksi pendaftaran daftar pemilih ke kontrak.',
      }
    : !canManageWhitelist
      ? {
          tone: 'emerald' as const,
          title: 'Whitelist dikunci',
          description: 'Pemilihan sudah terdeploy. Daftar pemilih tidak dapat diubah untuk menjaga konsistensi data on-chain.',
        }
      : unsyncedValidAddresses.length === 0
        ? {
            tone: 'emerald' as const,
            title: 'Daftar pemilih sudah terdaftar',
            description: 'Semua dompet valid di database sudah ditandai terdaftar di kontrak.',
          }
        : !isAddressValid
          ? {
              tone: 'amber' as const,
              title: 'Belum bisa sinkron otomatis',
              description: 'Alamat kontrak belum valid. Finalisasi pemilihan terlebih dahulu, lalu daftarkan daftar pemilih.',
            }
          : {
              tone: 'amber' as const,
              title: 'Ada pemilih belum terdaftar di kontrak',
              description: `${unsyncedValidAddresses.length} dompet valid siap didaftarkan. Sistem akan mencoba otomatis setelah penambahan data, tombol manual tetap tersedia.`,
            }

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
          const addedWallet = manualWallet.trim().toLowerCase()
          setManualWhitelistOpen(false)
          showToast({
            tone: 'success',
            title: 'Pemilih berhasil ditambahkan',
            description: `Wallet ${addedWallet} telah ditambahkan ke whitelist database. Sistem akan mencoba sinkronisasi on-chain otomatis.`,
          })
          setManualWallet('')
          setManualName('')
          startWhitelistSync(getUnsyncedValidAddresses([addedWallet]), 'auto')
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

  const handleDeleteWhitelistEntry = async (recordId: string, wallet: string, isFallback: boolean, syncStatus?: string) => {
    if (isFallback) {
      showToast({
        tone: 'info',
        title: 'Mode transisi aktif',
        description: `Hapus whitelist live untuk ${wallet} belum tersedia karena data masih lokal.`,
      })
      return
    }

    if (!canManageWhitelist) {
      showToast({
        tone: 'error',
        title: 'Whitelist sudah dikunci',
        description: 'Pemilih hanya dapat dihapus saat tahap persiapan, sebelum pencoblosan dimulai.',
      })
      return
    }

    let unregisterTxHash: string | null = null
    if (syncStatus === 'synced') {
      if (!isAddressValid) {
        showToast({ tone: 'error', title: 'Kontrak tidak valid', description: 'Pemilih tersinkron on-chain harus dihapus melalui kontrak pemilihan.' })
        return
      }

      if (!isConnected) {
        requestWalletConnection('Dompet admin tersambung. Klik hapus lagi untuk mengirim transaksi unregister on-chain.')
        return
      }

      try {
        unregisterTxHash = await unregisterVoterAsync(deployedAddress, wallet)
      } catch (error) {
        showToast({
          tone: 'error',
          title: 'Unregister on-chain gagal',
          description: error instanceof Error ? error.message : 'Transaksi penghapusan pemilih di kontrak gagal.',
        })
        return
      }
    }

    deleteWhitelistEntry.mutate({ id: recordId, unregisterTxHash }, {
      onSuccess: () => {
        showToast({
          tone: 'success',
          title: 'Pemilih dihapus',
          description: syncStatus === 'synced'
            ? `Wallet ${wallet} berhasil dihapus dari kontrak dan database whitelist.`
            : `Wallet ${wallet} berhasil dihapus dari whitelist database.`,
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
        onSuccess: (result) => {
          setUploadConfirmOpen(false)
          setUploadModalOpen(false)
          setUploadCsvContent('')
          showToast({
            tone: 'success',
            title: 'File whitelist diunggah',
              description: `File ${uploadFileName} berhasil diproses. ${entries.length} wallet valid ditambahkan${invalidCount > 0 ? `, ${invalidCount} baris diabaikan.` : '.'}`,
          })
          startWhitelistSync(getUnsyncedValidAddresses(result.entries.map((entry) => entry.walletAddress)), 'auto')
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
    startWhitelistSync(getUnsyncedValidAddresses(), 'manual')
  }

  const syncPendingWhitelistAfterMasterAdd = async () => {
    const result = await whitelistQuery.refetch()
    const pendingAddresses = getUnsyncedValidAddressesFromRecords(result.data ?? [])
    startWhitelistSync(pendingAddresses, 'auto')
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
    <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {candidates.map((candidate) => (
            <article key={candidate.id} className={`flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 ${canAddCandidate ? 'cursor-pointer transition-colors hover:border-slate-300' : ''}`} onClick={canAddCandidate ? () => window.location.assign(`/admin/manajemen-pemilihan/${election.id}/kandidat/${candidate.id}/edit`) : undefined}>
              <div className="relative">
                <div className="absolute left-3 top-3 z-10 rounded-lg bg-slate-900 px-2 py-1 font-mono text-[10px] font-semibold text-white">
                  {candidate.number}
                </div>
                <CandidateImage alt={`Foto ${candidate.name}`} src={candidate.avatarPath} tone={candidate.imageTone} />
              </div>
              <div className="flex min-h-[300px] flex-1 flex-col pt-4">
                <p className="font-mono text-[11px] text-slate-400">ID {candidate.id}</p>
                <h2 className="mt-2 text-[18px] font-semibold leading-tight text-slate-900">{candidate.name}</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  {candidate.identityNumber ? <span className="rounded-lg bg-slate-50 px-2 py-1 font-mono">{candidate.identityNumber}</span> : null}
                  {candidate.faculty ? <span className="rounded-lg bg-slate-50 px-2 py-1">{candidate.faculty}</span> : null}
                </div>

                <div className="mt-4 space-y-3 text-[12px] leading-5 text-slate-700">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Visi</p>
                    <RichTextRenderer value={candidate.vision} emptyFallback="Visi belum diisi." className="mt-1" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Misi</p>
                    {candidate.mission.trim() ? (
                      <RichTextRenderer value={candidate.mission} emptyFallback="Misi belum diisi." className="mt-1" />
                    ) : <p className="mt-1 text-slate-500">Misi belum diisi.</p>}
                  </div>
                </div>

                {canAddCandidate ? (
                  <div className="mt-auto flex items-center justify-end gap-2 pt-4">
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
          ) : null}
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
      {!canManageWhitelist && isAddressValid ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[13px] leading-7 text-amber-800">
          <p className="font-semibold">Whitelist dikunci</p>
          <p className="mt-1">Pencoblosan sudah dimulai di blockchain. Daftar pemilih tidak dapat diubah untuk menjaga konsistensi data on-chain.</p>
        </div>
      ) : null}
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
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900">Daftar Pemilih Tetap (Whitelist)</h2>
              <p className="mt-2 text-[13px] text-slate-500">
                {canManageWhitelist
                  ? 'Status database dan kontrak dipantau terpisah agar admin tahu dompet mana yang masih perlu didaftarkan.'
                  : 'Daftar pemilih sudah final. Data ditampilkan untuk referensi dan audit saja.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {canManageWhitelist && unsyncedValidAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSyncOnchainConfirmOpen(true)}
                  disabled={isWritePending || isConfirming || isSyncing || updateWhitelistSyncStatus.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 text-[13px] font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {(isWritePending || isConfirming || isSyncing) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Daftarkan Pemilih
                </button>
              )}
              {canManageWhitelist && !isAddressValid ? (
                <button
                  type="button"
                  onClick={() => { setManualWhitelistOpen(true); setManualNameAutoFilled(false); setManualWallet(''); setManualName(''); setDebouncedWallet('') }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-[13px] font-semibold text-slate-900 hover:bg-slate-200"
                >
                  <CirclePlus className="h-4 w-4" />
                  Tambah Manual
                </button>
              ) : null}
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
          </div>
          <div className={`border-b px-6 py-4 text-[13px] ${whitelistSyncStatus.tone === 'emerald' ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : whitelistSyncStatus.tone === 'blue' ? 'border-blue-100 bg-blue-50 text-blue-800' : 'border-amber-100 bg-amber-50 text-amber-900'}`} role="status">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{whitelistSyncStatus.title}</p>
                <p className="mt-1 leading-6">{whitelistSyncStatus.description}</p>
              </div>
              {unsyncedValidAddresses.length > 0 && (
                <span className="inline-flex w-fit rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                  {unsyncedValidAddresses.length} belum terdaftar di kontrak
                </span>
              )}
            </div>
          </div>
          {whitelistQuery.error ? (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-[13px] text-amber-800" role="status">
              {getRepositoryErrorMessage(whitelistQuery.error, 'Daftar pemilih live belum tersedia dari Supabase.')}
            </div>
          ) : null}
          {!whitelistQuery.isLoading && whitelistRecords.length === 0 ? (
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-3 text-[13px] text-slate-600">
              Belum ada daftar pemilih di Supabase untuk proposal ini. Tambahkan manual atau unggah CSV.
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
                  {canManageWhitelist && <th className="px-6 py-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {whitelistQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={`whitelist-loading-${index}`} className="border-b border-slate-100">
                      <td className="px-6 py-5" colSpan={canManageWhitelist ? 5 : 4}>
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
                      {canManageWhitelist && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteWhitelistEntry(record.id, record.wallet, record.isFallback, record.syncStatus)}
                          disabled={deleteWhitelistEntry.isPending || isWritePending || isConfirming}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
                          aria-label={`Hapus pemilih ${record.wallet}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!whitelistQuery.isLoading && filteredWhitelistRecords.length === 0 ? (
                  <tr>
                    <td className="px-6 py-8 text-center text-[14px] text-slate-500" colSpan={canManageWhitelist ? 5 : 4}>Tidak ada data whitelist yang ditampilkan.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-5 text-[14px] text-slate-500">
            <p>Menampilkan {filteredWhitelistRecords.length} dari {whitelistRecords.length} pemilih</p>
            {whitelistRecords.length > 10 && (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => showToast({ tone: 'info', title: 'Pagination', description: 'Navigasi halaman sedang disiapkan.' })} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">‹</button>
                <button type="button" onClick={() => showToast({ tone: 'info', title: 'Pagination', description: 'Navigasi halaman sedang disiapkan.' })} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">›</button>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[30px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[20px] font-semibold text-slate-900">
                {canManageWhitelist ? 'Whitelisting Pemilih' : 'Whitelisting Dikunci'}
              </h2>
              <p className="mt-3 max-w-[300px] text-[15px] leading-7 text-slate-500">
                {canManageWhitelist
                  ? (isAddressValid
                      ? 'Pemilihan sudah terdeploy. Tambah pemilih baru hanya dari master voter agar identitas tetap terkontrol.'
                      : 'Unggah berkas, tambah manual, atau pilih dari data master voter untuk mendaftarkan identitas digital pemilih.')
                  : 'Whitelist sudah dikunci karena pemilihan sudah terdeploy. Pemilih tidak dapat ditambahkan atau diubah untuk menjaga konsistensi on-chain.'}
              </p>
            </div>
            {canManageWhitelist && (
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => setMasterVoterModalOpen(true)} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-[14px] font-medium text-white hover:bg-slate-800">
                  <Users className="h-4 w-4" />
                  Pilih dari Master Voter
                </button>
                {!isAddressValid ? (
                  <button type="button" onClick={() => { setManualWhitelistOpen(true); setManualNameAutoFilled(false); setManualWallet(''); setManualName(''); setDebouncedWallet('') }} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
                    <CirclePlus className="h-4 w-4" />
                    Tambah Manual
                  </button>
                ) : null}
              </div>
            )}
          </div>
          {canManageWhitelist && !isAddressValid ? (
            <button type="button" onClick={() => setUploadModalOpen(true)} className="mt-8 block w-full rounded-[28px] border border-dashed border-slate-300 p-8 text-center hover:border-slate-400">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <Upload className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-[28px] font-semibold text-slate-900">Unggah Daftar Pemilih (.csv)</h3>
              <p className="mt-3 text-[15px] leading-7 text-slate-500">Maksimal 10.000 alamat wallet per unggahan.</p>
              <span className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{election.detail.whitelist.uploadSupport}</span>
            </button>
          ) : null}

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Riwayat Import</p>
                <p className="mt-2 text-[14px] text-slate-700">Pantau file CSV yang pernah diproses untuk pemilihan ini.</p>
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

  const handleTransitionPhase = async () => {
    try {
      transitionToNextPhase()
      showToast({ tone: 'info', title: 'Transisi fase dikirim', description: 'Menunggu konfirmasi blockchain...' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal beralih fase.'
      showToast({ tone: 'error', title: 'Gagal beralih fase', description: message })
    }
  }

  const formatScheduleTime = (value?: string | null) => {
    if (!value) return 'Belum diatur'
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  }

  const phaseScheduleItems = [
    { label: 'Mulai Pencoblosan', value: formatScheduleTime(election.schedule?.commitStartAt), active: dbPhaseInfo.phase === 'commit' },
    { label: 'Mulai Konfirmasi Suara', value: formatScheduleTime(election.schedule?.revealStartAt), active: dbPhaseInfo.phase === 'reveal' },
    { label: 'Pemilihan Selesai', value: formatScheduleTime(election.schedule?.endedAt), active: dbPhaseInfo.phase === 'ended' },
  ]

  const renderFaseTab = () => (
    <section className="mt-8 space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Phase Status */}
        <article className="rounded-[28px] border border-slate-200 bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Fase Saat Ini</p>
          <div className="mt-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[28px] font-semibold text-slate-900">{dbPhaseInfo.label}</p>
                <p className="text-[13px] text-slate-500">Sumber: jadwal database aplikasi</p>
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-6 text-slate-600">
              {dbPhaseInfo.phase === 'registration'
                ? 'Pemilih belum bisa mencoblos. Sistem akan membuka pencoblosan otomatis sesuai jadwal mulai.'
                : dbPhaseInfo.phase === 'commit'
                  ? 'Pemilih sudah bisa mencoblos. Setelah waktu konfirmasi suara tiba, sistem otomatis masuk tahap pengesahan.'
                  : dbPhaseInfo.phase === 'reveal'
                    ? 'Masa mencoblos sudah berakhir. Pemilih sedang mengonfirmasi pilihan sebelum dihitung.'
                    : 'Pemilihan selesai. Hasil hanya dapat diaudit jika bukti transaksi commit/reveal tersedia.'}
            </p>
          </div>
        </article>

        {/* Contract Status */}
        <article className="rounded-[28px] border border-slate-200 bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Status Kontrak</p>
          <div className="mt-5 space-y-4">
            <p className="text-[13px] leading-6 text-slate-600">
              Status kontrak saat ini: <span className="font-semibold text-slate-900">{onChainPhaseLabel}</span>. Fase berjalan otomatis sesuai jadwal yang diatur.
            </p>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] leading-6 text-slate-600">
              Tidak ada tombol transisi manual. Semua fase berganti otomatis berdasarkan waktu yang telah ditentukan saat proposal disetujui.
            </div>
            {isAddressValid && (
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://sepolia.basescan.org/address/${deployedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Buka di Basescan
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    if (!deployedAddress) return
                    showToast({ tone: 'info', title: 'Memverifikasi kontrak', description: 'Mengirim permintaan verifikasi ke Basescan...' })
                    try {
                      const res = await fetch(`/api/verify-contract?address=${deployedAddress}`)
                      const data = await res.json()
                      if (data.verified) {
                        showToast({ tone: 'success', title: 'Kontrak Terverifikasi', description: 'Kontrak sudah terverifikasi di Basescan. Read/Write Contract tersedia.' })
                      } else {
                        if (!onChainRegistry) {
                          showToast({ tone: 'error', title: 'Data Belum Siap', description: 'Alamat registry belum terbaca dari kontrak. Tunggu sebentar lalu coba lagi.' })
                          return
                        }
                        // Try to verify
                        const verifyRes = await fetch('/api/verify-contract', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            contractAddress: deployedAddress,
                            contractType: 'election-space',
                            registry: onChainRegistry,
                            spaceAdmin: onChainSpaceAdmin,
                            spaceId: onChainSpaceId,
                            candidateCount: onChainCandidateCount,
                            title: election.title,
                            metadataURI: election.detail.blockchainAnchor || '',
                            initialActor: deployedAddress,
                            commitStartsAt: election.schedule?.commitStartAt ? Math.floor(new Date(election.schedule.commitStartAt).getTime() / 1000) : 0,
                            commitEndsAt: election.schedule?.revealStartAt ? Math.floor(new Date(election.schedule.revealStartAt).getTime() / 1000) : 0,
                            revealStartsAt: election.schedule?.revealStartAt ? Math.floor(new Date(election.schedule.revealStartAt).getTime() / 1000) : 0,
                            revealEndsAt: election.schedule?.endedAt ? Math.floor(new Date(election.schedule.endedAt).getTime() / 1000) : 0,
                          }),
                        })
                        const verifyData = await verifyRes.json()
                        if (verifyData.verified) {
                          showToast({ tone: 'success', title: 'Kontrak Terverifikasi', description: 'Kontrak berhasil diverifikasi di Basescan.' })
                        } else if (verifyData.pending) {
                          showToast({ tone: 'info', title: 'Verifikasi Diproses', description: 'Kontrak sedang dalam antrian verifikasi Basescan. Coba lagi dalam beberapa menit.' })
                        } else {
                          showToast({ tone: 'error', title: 'Verifikasi Gagal', description: verifyData.message || 'Gagal memverifikasi kontrak. Coba lagi nanti.' })
                        }
                      }
                    } catch {
                      showToast({ tone: 'error', title: 'Gagal Memeriksa', description: 'Tidak dapat menghubungi server verifikasi.' })
                    }
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-4 text-[13px] font-semibold text-white hover:bg-[#1E293B]"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verifikasi di Basescan
                </button>
              </div>
            )}
          </div>
        </article>
      </div>

      {/* Phase Schedule */}
      <article className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Jadwal Pemilihan</p>
          <p className="mt-2 text-[13px] text-slate-500">Jadwal database ini menjadi acuan tampilan admin, superadmin, dan pemilih.</p>
        </div>
        <div className="mt-6 space-y-4">
          {phaseScheduleItems.map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-slate-900">{item.label}</p>
                <p className="text-[13px] text-slate-500">{item.value}</p>
              </div>
              {item.active && (
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                  Aktif
                </span>
              )}
            </div>
          ))}
        </div>
      </article>
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
              <a
                href={`https://sepolia.basescan.org/address/${deployedAddress}#events`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 text-[14px] font-semibold uppercase tracking-[0.08em] text-slate-700 hover:text-slate-900"
              >
                Lihat Semua Transaksi
                <ExternalLink className="h-4 w-4" />
              </a>
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
          {/* Fase & Kontrak — jadwal DB adalah acuan UI, kontrak sebagai guard transaksi */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
            {isAddressValid && (
              <a
                href={`https://sepolia.basescan.org/address/${deployedAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                title="Lihat smart contract di Basescan"
              >
                <Link2 className="h-3.5 w-3.5" />
                {deployedAddress.slice(0, 10)}…{deployedAddress.slice(-8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 font-medium text-indigo-700">
              <CalendarDays className="h-3.5 w-3.5" />
              Jadwal: {dbPhaseInfo.label}
            </span>
            {isAddressValid && (
              <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium ${
                onChainPhaseNumber === 2
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Kontrak: {onChainPhaseLabel}
              </span>
            )}
          </div>
        </div>

        {activeTab === 'kandidat' && canAddCandidate ? (
          <Link href={`/admin/manajemen-pemilihan/${election.id}/tambah-kandidat`} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900">
            <CirclePlus className="h-4 w-4" />
            Tambah Kandidat
          </Link>
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
      {activeTab === 'fase' ? renderFaseTab() : null}
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
        description="Masukkan alamat wallet. Jika wallet terdaftar di master data, nama pemilih akan terisi otomatis."
        onClose={() => { setManualWhitelistOpen(false); setManualNameAutoFilled(false); setDebouncedWallet('') }}
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-[12px] font-semibold text-slate-800">Alamat Wallet <RequiredAsterisk /></label>
            <input
              type="text"
              value={manualWallet}
              onChange={(event) => {
                setManualWallet(event.target.value)
                setManualNameAutoFilled(false)
              }}
              placeholder="0x..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[12px] font-semibold text-slate-800">Nama (Opsional)</label>
              {masterVoterLookup.isLoading && debouncedWallet && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" /> Mencari di master data...
                </span>
              )}
              {manualNameAutoFilled && masterVoterLookup.data && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                  <Users className="h-3 w-3" /> Otomatis dari master data
                </span>
              )}
            </div>
            <input
              type="text"
              value={manualName}
              onChange={(event) => {
                setManualName(event.target.value)
                setManualNameAutoFilled(false)
              }}
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
        title="Daftarkan Pemilih ke Kontrak?"
        description={`Sebanyak ${unsyncedValidAddresses.length} dompet valid akan didaftarkan sebagai daftar pemilih di kontrak. Proses ini membutuhkan konfirmasi dompet admin dan hanya bisa dilakukan saat tahap persiapan, sebelum pencoblosan dibuka.`}
        confirmLabel={(isWritePending || isConfirming || isSyncing || updateWhitelistSyncStatus.isPending) ? "Memproses..." : "Ya, Daftarkan Pemilih"}
        disabled={isWritePending || isConfirming || isSyncing || updateWhitelistSyncStatus.isPending}
        onCancel={() => {
          if (!isWritePending && !isConfirming) {
            setSyncOnchainConfirmOpen(false)
            setIsSyncing(false)
            setSyncMode(null)
          }
        }}
        onConfirm={handleConfirmSyncOnchain}
      />

      <PilihDariMasterVoterModal
        open={masterVoterModalOpen}
        onClose={() => setMasterVoterModalOpen(false)}
        proposalDraftId={election.id}
        existingWallets={new Set(whitelistRecords.map((r) => r.wallet.toLowerCase()))}
        existingWhitelistStatus={new Map(whitelistRecords.map((r) => [r.wallet.toLowerCase(), r.syncStatus]))}
        pendingOnChainCount={unsyncedValidAddresses.length}
        onSuccess={() => { void syncPendingWhitelistAfterMasterAdd() }}
      />
    </AdminShell>
  )
}
