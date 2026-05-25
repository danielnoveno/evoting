export type AppRole = 'voter' | 'platform_admin' | 'super_admin'

export interface AppProfileRecord {
  id: string
  userId: string
  walletAddress: string
  displayName: string | null
  email: string | null
  role: AppRole
  roleHint: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export type ProposalDraftStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'deployed' | 'archived'
export type ProposalListStatus = 'DRAF' | 'MENUNGGU REVIEW' | 'DISETUJUI' | 'DITOLAK'

export interface ProposalDraftRecord {
  id: string
  title: string
  description: string | null
  organizationName: string | null
  candidateCount: number
  status: ProposalDraftStatus
  proposalTxHash: string | null
  reviewTxHash: string | null
  deploymentTxHash: string | null
  deployedSpaceAddress: string | null
  commitStartAt: string | null
  revealStartAt: string | null
  endedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ProposalListItem {
  id: string
  title: string
  category: string
  date: string
  votersEstimate: string
  hash: string
  status: ProposalListStatus
}
export interface ProposalDraftUpsertInput {
  id?: string
  title: string
  organizationName?: string | null
  description?: string | null
  candidateCount: number
  commitStartAt?: string | null
  revealStartAt?: string | null
  endedAt?: string | null
  status?: ProposalDraftStatus

  candidates?: Array<{
    name: string
    studentId?: string | null
    faculty?: string | null
    bio?: string | null
    vision?: string | null
    avatarPath?: string | null
  }>
  whitelistEntries?: Array<{
    walletAddress: string
    voterName?: string | null
  }>
}

export interface ProposalCandidateInput {
  name: string
  studentId?: string | null
  faculty?: string | null
  bio?: string | null
  vision?: string | null
  avatarPath?: string | null
}

export interface WhitelistImportJobRecord {
  id: string
  proposalDraftId: string
  createdBy: string
  filePath: string
  fileName: string
  rowCount: number
  invalidCount: number
  status: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface ProposalCandidateRecord {
  id: string
  proposalDraftId: string
  candidateLocalId: string
  fullName: string
  studentId: string | null
  faculty?: string | null
  bio?: string | null
  vision?: string | null
  avatarPath?: string | null
  sortOrder: number
}

export interface WhitelistEntryRecord {
  id: string
  proposalDraftId: string
  walletAddress: string
  voterName: string | null
  source: 'manual' | 'csv' | 'sync'
  validationStatus: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
  syncStatus: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
  latestSyncTxHash: string | null
  createdAt: string
  updatedAt: string
}

export interface ProfileUpsertInput {
  walletAddress: string
  displayName?: string | null
  email?: string | null
  avatarUrl?: string | null
  roleHint?: string | null
}
