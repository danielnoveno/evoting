export type AppRole = 'voter' | 'admin' | 'super_admin'

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

export interface AdminDirectoryRecord {
  email: string
  role: Extract<AppRole, 'admin' | 'super_admin'>
  displayName: string | null
  organizationName: string | null
  accessScope: 'all' | 'specific'
  registryStatus: 'pending' | 'active' | 'inactive' | null
  description: string | null
  walletAddress: string | null
  createdAt: string
  updatedAt: string | null
  profile: AppProfileRecord | null
}

export interface AdminRegistryRecord {
  email: string
  assignedRole: Extract<AppRole, 'admin' | 'super_admin'>
  displayName: string | null
  organizationName: string | null
  accessScope: 'all' | 'specific'
  status: 'pending' | 'active' | 'inactive'
  description: string | null
  walletAddress: string | null
  activationExpiresAt: string | null
  activationAcceptedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminRegistryInput {
  email: string
  displayName?: string | null
  organizationName?: string | null
  accessScope?: 'all' | 'specific'
  status?: 'pending' | 'active' | 'inactive'
  description?: string | null
  walletAddress?: string | null
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
  deployedSpaceId: number | null
  deployedSpaceAddress: string | null
  commitStartAt: string | null
  revealStartAt: string | null
  endedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type PublicElectionPhase = 'registration' | 'commit' | 'reveal' | 'ended'

export interface PublicElectionCandidateRecord {
  id: string
  candidateLocalId: string
  fullName: string
  studentId: string | null
  faculty: string | null
  bio: string | null
  vision: string | null
  mission: string[]
  avatarPath: string | null
  sortOrder: number
}

export interface PublicElectionRecord {
  id: string
  title: string
  description: string | null
  organizationName: string | null
  status: ProposalDraftStatus
  phase: PublicElectionPhase
  phaseLabel: string
  deadlineLabel: string
  commitStartAt: string | null
  revealStartAt: string | null
  endedAt: string | null
  candidateCount: number
  participantCount: number
  deployedSpaceId: number | null
  deployedSpaceAddress: string | null
  deploymentTxHash: string | null
  candidates: PublicElectionCandidateRecord[]
}

export interface PublicElectionCandidateResultRecord {
  candidateId: number
  voteCount: number
  lastRevealTx: string | null
  lastUpdatedBlock: number | null
}

export interface PublicElectionResultRecord {
  spaceAddress: string
  totalCommitted: number
  totalRevealed: number
  lastUpdatedBlock: number | null
  candidateResults: PublicElectionCandidateResultRecord[]
}

export interface TxAuditLogRecord {
  id: string
  spaceId: number | null
  proposalDraftId: string | null
  walletAddress: string
  actionType: string
  txHash: string
  blockNumber: number | null
  status: string
  source: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface VoterOnchainProofRecord {
  spaceAddress: string
  commitProof: {
    txHash: string
    blockNumber: number
    createdAt: string
    commitment: string
  } | null
  revealProof: {
    txHash: string
    blockNumber: number
    createdAt: string
    candidateId: number
  } | null
}

export interface NotificationJobRecord {
  id: string
  title: string
  description: string
  timeLabel: string
  type: 'info' | 'success' | 'warning'
  link?: string
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
