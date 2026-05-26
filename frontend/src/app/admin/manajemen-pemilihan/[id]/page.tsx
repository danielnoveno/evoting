'use client'

import { notFound } from 'next/navigation'
import { AdminElectionDetailView } from '@/components/admin/admin-election-detail-view'
import { AdminElectionDetailTabId, adminElectionData, adminElectionDetailTabs, getAdminElectionById, AdminElectionRecord } from '@/lib/admin-election-data'
import { useProposalDraft } from '@/hooks/use-proposal-draft'
import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'

export default function AdminElectionDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { tab?: string }
}) {
  const proposalQuery = useProposalDraft(params.id)
  const fallbackElection = getAdminElectionById(params.id)

  const election = useMemo<AdminElectionRecord | null>(() => {
    const p = proposalQuery.data
    if (!p) return fallbackElection ?? null
    const baseElection = fallbackElection ?? adminElectionData[0]
    if (!baseElection) return null
    const voterTarget = String(p.candidateCount * 10)

    return {
      ...baseElection,
      id: p.id,
      title: p.title,
      code: `VC-${p.id.slice(0, 4).toUpperCase()}`,
      status: p.status === 'deployed' ? 'aktif' : 'selesai',
      badge: p.status === 'deployed' ? 'Active' : 'Approved',
      meta: p.description ?? 'Ruang pemilihan blockchain.',
      iconTone: p.status === 'deployed' ? 'emerald' : 'blue',
      actionLabel: p.status === 'deployed' ? 'Monitoring' : 'Review Draft',
      secondaryActionLabel: 'Statistik',
      actionTone: 'blue',
      periodLabel: 'Mei - Juni 2026',
      turnoutLabel: `${voterTarget} pemilih terdaftar`,
      detail: {
        ...baseElection.detail,
        statusPill: p.status === 'deployed' ? 'Sedang Berjalan' : 'Siap Sinkronisasi',
        blockchainAnchor: p.deploymentTxHash ?? 'Menunggu deployment...',
        blockchainNetworkLabel: 'Base Sepolia Testnet',
        turnout: {
          total: '0',
          target: voterTarget,
          percentage: '0%',
          progressWidthClassName: 'w-[0%]',
          note: 'Data partisipasi akan diperbarui secara realtime dari indexer.'
        },
        candidates: [], // This will be loaded in the view component via hooks
        quickActions: [
          { label: 'Download Laporan', icon: 'download' },
          { label: 'Share Link', icon: 'share' },
        ],
        whitelist: {
          total: '0',
          target: '0',
          integrityTitle: 'Database Terkunci',
          integrityDescription: 'Daftar pemilih telah di-hash dan diamankan di blockchain.',
          evidence: p.proposalTxHash ?? 'N/A',
          evidenceStatus: 'Verified On-Chain',
          records: [],
          uploadSupport: 'CSV, Manual'
        },
        parameterVoting: {
          phaseTitle: 'Parameter Waktu',
          phaseDescription: 'Jadwal fase pemilihan yang telah dikunci di blockchain.',
          phaseOne: { label: 'Fase Commit', start: p.commitStartAt ? new Date(p.commitStartAt).toLocaleString() : '-', end: p.revealStartAt ? new Date(p.revealStartAt).toLocaleString() : '-' },
          phaseTwo: { label: 'Fase Reveal', start: p.revealStartAt ? new Date(p.revealStartAt).toLocaleString() : '-', end: p.endedAt ? new Date(p.endedAt).toLocaleString() : '-' },
          consensus: {
            method: 'Commit-Reveal',
            quorum: '50% + 1',
            quorumProgressWidthClassName: 'w-[51%]',
            protectionTitle: 'Double-Spending Protection',
            protectionDescription: 'Sistem menjamin satu wallet hanya dapat memberikan satu suara yang sah.'
          },
          contract: {
            address: p.deployedSpaceAddress ?? 'N/A',
            network: 'Base Sepolia',
            version: 'v1.0.2-unified',
            currentHash: p.deploymentTxHash ?? '0x...'
          },
          privacy: {
            headline: 'Privasi Terjamin',
            items: [
              { title: 'Commit-Reveal', description: 'Pilihan disimpan sebagai hash saat fase commit, lalu diverifikasi pada fase reveal.' }
            ],
            ctaLabel: 'Verifikasi Keamanan'
          }
        },
        realtime: {
          ...baseElection.detail.realtime,
          connectedLabel: 'Live Sync',
          totalVotes: '0',
          totalTarget: voterTarget,
          participation: '0%',
          remaining: { hours: '00', minutes: '00', seconds: '00', label: 'Waktu Habis' },
          networkStatus: { title: 'Jaringan Stabil', subtitle: 'Syncing with Base Sepolia' },
          results: [],
          feed: [],
          guarantee: { title: 'Immutability', description: 'Data tidak dapat diubah.' }
        }
      }
    }
  }, [proposalQuery.data, fallbackElection])

  if (proposalQuery.isLoading) return <div className="p-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-slate-400" /></div>
  if (!election) {
    notFound()
  }

  const allowedTabs = new Set(adminElectionDetailTabs.map((tab) => tab.id))
  const requestedTab = searchParams.tab
  const activeTab: AdminElectionDetailTabId = requestedTab && allowedTabs.has(requestedTab as AdminElectionDetailTabId)
    ? (requestedTab as AdminElectionDetailTabId)
    : 'kandidat'

  return <AdminElectionDetailView election={election} activeTab={activeTab} />
}
