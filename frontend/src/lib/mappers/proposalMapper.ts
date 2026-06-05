import type { ProposalDraftRecord, ProposalListItem, ProposalListStatus } from '@/lib/repositories/types'

function formatDateLabel(value: string | null): string {
  if (!value) return 'Tanggal belum diatur'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Tanggal belum diatur'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function mapStatus(status: ProposalDraftRecord['status']): ProposalListStatus {
  switch (status) {
    case 'approved':
    case 'deployed':
      return 'DISETUJUI'
    case 'submitted':
      return 'MENUNGGU REVIEW'
    case 'revision_requested':
      return 'PERLU REVISI'
    case 'rejected':
      return 'DITOLAK'
    case 'draft':
    case 'archived':
    default:
      return 'DRAF'
  }
}

function shortenHash(hash: string | null): string {
  if (!hash) return 'Belum di-hash'
  return `${hash.slice(0, 5)}...${hash.slice(-4)}`
}

export function mapProposalDraftToListItem(item: ProposalDraftRecord): ProposalListItem {
  return {
    id: item.id,
    title: item.title,
    category: item.organizationName ?? 'Organisasi',
    date: formatDateLabel(item.createdAt),
    votersEstimate: String(item.candidateCount),
    hash: shortenHash(item.proposalTxHash ?? item.deploymentTxHash),
    status: mapStatus(item.status),
  }
}
