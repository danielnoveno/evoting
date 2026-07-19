import type { ProposalDraftRecord, ProposalListItem, ProposalListStatus } from '@/lib/repositories/types'
import { shortenHash } from '@/lib/voter-helpers'

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
    case 'archived':
      return 'DIBATALKAN'
    case 'draft':
    default:
      return 'DRAF'
  }
}

export function mapProposalDraftToListItem(item: ProposalDraftRecord, whitelistCount?: number): ProposalListItem {
  return {
    id: item.id,
    title: item.title,
    category: item.organizationName ?? item.creatorOrganizationName ?? 'Organisasi',
    date: formatDateLabel(item.createdAt),
    votersEstimate: String(whitelistCount ?? 0),
    hash: shortenHash(item.proposalTxHash ?? item.deploymentTxHash),
    status: mapStatus(item.status),
  }
}
