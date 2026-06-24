'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listProposalDrafts } from '@/lib/repositories/proposalRepository'
import { mapProposalDraftToListItem } from '@/lib/mappers/proposalMapper'
import type { AdminElectionRecord } from '@/lib/admin-election-data'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'
import type { Database } from '@/lib/supabase/database.types'
import { getInitials } from '@/lib/repositories/helpers'

type ProposalDraft = NonNullable<Awaited<ReturnType<typeof listProposalDrafts>>>[number]
type WhitelistRow = Pick<Database['app']['Tables']['proposal_whitelist_entries']['Row'], 'id' | 'proposal_draft_id' | 'wallet_address' | 'voter_name'>

export function useAdminProposalList() {
  const query = useQuery({
    queryKey: ['admin', 'proposal-drafts'],
    queryFn: listProposalDrafts,
    retry: false,
  })

  const rows = useMemo(() => {
    return (query.data ?? []).map(mapProposalDraftToListItem)
  }, [query.data])

  const stats = useMemo(() => {
    const data = query.data ?? []
    const total = data.length
    const waiting = data.filter((item) => item.status === 'submitted').length
    const running = data.filter((item) => item.status === 'deployed').length
    const finished = data.filter((item) => item.endedAt).length

    return [
      { label: 'TOTAL PROPOSAL', value: String(total), iconKey: 'bar-chart' },
      { label: 'MENUNGGU REVIEW', value: String(waiting), iconKey: 'hourglass' },
      { label: 'BERJALAN', value: String(running), iconKey: 'rocket' },
      { label: 'SELESAI', value: String(finished), iconKey: 'check-circle' },
    ]
  }, [query.data])

  return {
    ...query,
    rows,
    stats,
    isUsingFallback: false,
  }
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(date) + ' WIB'
}

function makeEmptyDetail(p: ProposalDraft, voterTarget: string): AdminElectionRecord['detail'] {
  const tx = p.deploymentTxHash ?? p.proposalTxHash ?? 'Belum ada transaksi'
  return {
    statusPill: p.status === 'deployed' ? 'Sedang Berjalan' : 'Siap Sinkronisasi',
    candidates: [],
    blockchainAnchor: tx,
    blockchainNetworkLabel: p.deploymentTxHash ? 'Base Sepolia Testnet' : 'Belum terhubung on-chain',
    turnout: { total: '0', target: voterTarget, percentage: '0%', progressWidthClassName: 'w-[0%]', note: 'Data partisipasi menunggu indexer atau transaksi nyata.' },
    quickActions: [{ label: 'Download Laporan', icon: 'download' }, { label: 'Share Link', icon: 'share' }],
    whitelist: {
      total: '0', target: voterTarget, integrityTitle: 'Data Supabase', integrityDescription: 'Daftar pemilih dimuat dari tabel proposal_whitelist_entries.', evidence: p.proposalTxHash ?? 'Belum ada transaksi whitelist', evidenceStatus: p.proposalTxHash ? 'Ada Tx Hash' : 'Belum on-chain', records: [], uploadSupport: 'CSV, Manual',
    },
    parameterVoting: {
      phaseTitle: 'Jadwal Pemilihan', phaseDescription: 'Admin cukup memantau jadwal pencoblosan dan konfirmasi suara. Tahap persiapan berjalan sebelum pencoblosan dibuka.',
      phaseOne: { label: 'Pencoblosan', start: formatDate(p.commitStartAt), end: formatDate(p.revealStartAt) },
      phaseTwo: { label: 'Konfirmasi Suara', start: formatDate(p.revealStartAt), end: formatDate(p.endedAt) },
      consensus: { method: 'Commit-Reveal', quorum: 'Belum ditetapkan', quorumProgressWidthClassName: 'w-[0%]', protectionTitle: 'Anti double-vote', protectionDescription: 'Validasi akhir bergantung pada smart contract ElectionSpace.' },
      contract: { address: p.deployedSpaceAddress ?? 'Belum deploy', network: 'Base Sepolia', version: 'ElectionSpace', currentHash: p.deploymentTxHash ?? 'Belum ada tx' },
      privacy: { headline: 'Commit-Reveal', items: [{ title: 'Hash komitmen', description: 'Pilihan disimpan sebagai hash saat fase commit lalu dibuka saat reveal.' }], ctaLabel: 'Lihat audit' },
    },
    realtime: {
      connectedLabel: 'Menunggu Indexer', totalVotes: '0', totalTarget: voterTarget, participation: '0%', remaining: { hours: '00', minutes: '00', seconds: '00', label: 'Menunggu data' }, networkStatus: { title: 'Belum ada sinkronisasi hasil', subtitle: 'Tidak menampilkan angka palsu' }, results: [], feed: [], guarantee: { title: 'Tanpa data palsu', description: 'Hasil akan tampil setelah transaksi reveal terindeks.' },
    },
    monitoring: {
      title: 'Monitoring transaksi', description: 'Log akan tampil dari tabel audit saat tersedia.', currentPhase: 'Belum dihitung', timeRemaining: '-', totalWhitelist: voterTarget, totalCommits: '0', commitProgress: '0%', totalReveals: '0', totalLogs: '0', dateRange: '-', categories: [], selectedCategory: '', actorSearchPlaceholder: 'Cari actor...', logRows: [], functionPayload: '{}', metadata: { browserAgent: '-', ipAddress: '-', security: '-' }, guarantee: { title: 'Audit', description: 'Tidak ada log palsu.' },
    },
    candidateForm: {
      breadcrumbParent: 'Manajemen Pemilihan', breadcrumbCurrent: 'Kandidat', title: 'Kandidat', description: 'Data kandidat tersimpan di Supabase.', uploadLabel: 'Unggah foto', uploadHint: 'Opsional', uploadSupport: 'JPG, PNG', identityLabel: 'ID/NPM', identityPlaceholder: 'Masukkan ID kandidat', hashPreviewLabel: 'Hash belum tersedia', fullNameLabel: 'Nama lengkap', fullNamePlaceholder: 'Masukkan nama lengkap', bioLabel: 'Bio', bioPlaceholder: 'Tulis bio singkat', visionLabel: 'Visi', visionPlaceholder: 'Tulis visi', missionLabel: 'Misi', missionPlaceholder: 'Tulis misi', validationTitle: 'Validasi Supabase', validationDescription: 'Data akan divalidasi saat disimpan.', validationStatus: 'Menunggu input',
    },
  }
}

async function listProposalDraftsWithWhitelist() {
  const proposals = await listProposalDrafts()
  const deployedIds = proposals.filter((proposal) => proposal.status === 'deployed').map((proposal) => proposal.id)

  if (deployedIds.length === 0) return { proposals, whitelistByProposalId: new Map<string, WhitelistRow[]>() }

  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .select('id,proposal_draft_id,wallet_address,voter_name')
    .in('proposal_draft_id', deployedIds)

  if (error) throw new RepositoryError('Gagal memuat data whitelist pemilihan.')

  const whitelistByProposalId = new Map<string, WhitelistRow[]>()
  for (const row of (data ?? []) as WhitelistRow[]) {
    const rows = whitelistByProposalId.get(row.proposal_draft_id) ?? []
    rows.push(row)
    whitelistByProposalId.set(row.proposal_draft_id, rows)
  }

  return { proposals, whitelistByProposalId }
}

export function useAdminElectionList() {
  const query = useQuery({
    queryKey: ['admin', 'elections'],
    queryFn: listProposalDraftsWithWhitelist,
    retry: false,
  })

  const elections = useMemo<AdminElectionRecord[]>(() => {
    if (!query.data || query.data.proposals.length === 0) return []
    
    return query.data.proposals
      .filter(p => p.status === 'deployed')
      .map((p, index) => {
        const whitelistRows = query.data.whitelistByProposalId.get(p.id) ?? []
        const voterTarget = String(whitelistRows.length)
        const whitelistPreview = whitelistRows.slice(0, 3).map((row) => ({
          id: row.id,
          label: getInitials(row.voter_name, row.wallet_address),
          name: row.voter_name ?? row.wallet_address,
        }))

        return {
          id: p.id,
          title: p.title,
          code: `VC-${p.id.slice(0, 4).toUpperCase()}`,
          status: p.status === 'deployed' ? 'aktif' : 'selesai',
          badge: p.status === 'deployed' ? 'Active' : 'Approved',
          meta: p.description ?? 'Ruang pemilihan blockchain.',
          iconTone: p.status === 'deployed' ? 'emerald' : 'blue',
          actionLabel: p.status === 'deployed' ? 'Monitoring' : 'Review Draft',
          secondaryActionLabel: whitelistRows.length > 0 ? `${whitelistRows.length} pemilih` : 'Belum ada pemilih',
          actionTone: 'blue',
          periodLabel: 'Mei - Juni 2026',
          turnoutLabel: p.deployedSpaceAddress ? `${whitelistRows.length} pemilih whitelist` : 'Belum deploy',
          whitelistCount: whitelistRows.length,
          whitelistPreview,
          schedule: {
            commitStartAt: p.commitStartAt,
            revealStartAt: p.revealStartAt,
            endedAt: p.endedAt,
          },
          detail: makeEmptyDetail(p, voterTarget),
          commits: p.status === 'deployed' ? {
            total: '0',
            target: voterTarget,
            hash: p.deploymentTxHash ? `${p.deploymentTxHash.slice(0, 10)}...` : 'Belum ada tx',
            revealStart: p.revealStartAt ? new Date(p.revealStartAt).toLocaleDateString() : '-',
            integrity: p.deploymentTxHash ? 'Ada Tx Hash' : 'Belum on-chain'
          } : undefined
        }
      })
  }, [query.data])

  return {
    ...query,
    elections,
    isUsingFallback: false
  }
}
