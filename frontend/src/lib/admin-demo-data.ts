export type AdminPhase = 'registration' | 'commit' | 'reveal' | 'ended'

export interface AdminVoter {
  address: `0x${string}`
  status: 'verified' | 'pending'
  addedAt: string
}

export interface AdminCandidate {
  id: number
  name: string
  nim: string
  vision: string
  votes: number
}

export interface AdminAuditLog {
  id: string
  timeLabel: string
  eventLabel: string
  actorLabel: string
  txHash: `0x${string}`
  blockLabel: string
  status: 'confirmed' | 'pending'
}

export interface AdminSpaceState {
  id: string
  name: string
  networkLabel: string
  contractAddress: `0x${string}`
  phase: AdminPhase
  registeredCount: number
  committedCount: number
  revealedCount: number
  candidateTarget: number
  candidateMutableOnChain: boolean
  voters: AdminVoter[]
  candidates: AdminCandidate[]
  auditLogs: AdminAuditLog[]
}

const demoContract = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'

export function createAdminDemoState(spaceId: string): AdminSpaceState {
  return {
    id: spaceId,
    name: 'Ketua HIMAFORKA 2026',
    networkLabel: 'Base Sepolia',
    contractAddress: demoContract,
    phase: 'registration',
    registeredCount: 47,
    committedCount: 31,
    revealedCount: 18,
    candidateTarget: 2,
    candidateMutableOnChain: false,
    voters: [
      {
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        status: 'verified',
        addedAt: '12 Mei 2026',
      },
      {
        address: '0x3fA03A9f4fBDA15d2dE3aa8a10CD4421b1808dE2',
        status: 'verified',
        addedAt: '12 Mei 2026',
      },
      {
        address: '0x9217Ba6B2af69a3ecF762FAbf95F70B146Ee7C21',
        status: 'pending',
        addedAt: 'Baru saja',
      },
    ],
    candidates: [
      {
        id: 1,
        name: 'Bella Sari Putri',
        nim: '220711001',
        vision: 'Meningkatkan transparansi kegiatan dan kolaborasi antar bidang.',
        votes: 0,
      },
      {
        id: 2,
        name: 'Dion Pratama',
        nim: '220711112',
        vision: 'Memperkuat eksekusi program kerja dengan pelaporan yang terbuka.',
        votes: 0,
      },
    ],
    auditLogs: [
      {
        id: `${spaceId}-log-1`,
        timeLabel: '12 Mei 2026, 14:22',
        eventLabel: 'Whitelist diperbarui',
        actorLabel: 'Admin Space',
        txHash: '0x6d6e11fcb9738eaf5945f395cf5cbfd6ef4f8c7f7e8f1654f3b64f32d6aa1110',
        blockLabel: '14,823,917',
        status: 'confirmed',
      },
      {
        id: `${spaceId}-log-2`,
        timeLabel: '12 Mei 2026, 09:00',
        eventLabel: 'Transisi fase ke Commit',
        actorLabel: 'Admin Space',
        txHash: '0x81b95a4f51a2bc668f80f9074f6f331db850c9de9ff5b6b13c1a6c53cfbc2201',
        blockLabel: '14,821,301',
        status: 'confirmed',
      },
      {
        id: `${spaceId}-log-3`,
        timeLabel: '11 Mei 2026, 18:01',
        eventLabel: 'Reveal diterima',
        actorLabel: 'Pemilih',
        txHash: '0x4f5f6a3d91f6559f1634f7e87f6f2f7608b749b6a324f3b53adf3f74d3ed110a',
        blockLabel: '14,820,998',
        status: 'confirmed',
      },
    ],
  }
}

export function getPhaseBadgeVariant(phase: AdminPhase):
  | 'info'
  | 'commit'
  | 'reveal'
  | 'ended' {
  if (phase === 'registration') return 'info'
  if (phase === 'commit') return 'commit'
  if (phase === 'reveal') return 'reveal'
  return 'ended'
}

export function getPhaseLabel(phase: AdminPhase): string {
  if (phase === 'registration') return 'Registration'
  if (phase === 'commit') return 'Commit'
  if (phase === 'reveal') return 'Reveal'
  return 'Ended'
}

export function getNextPhase(phase: AdminPhase): AdminPhase | null {
  if (phase === 'registration') return 'commit'
  if (phase === 'commit') return 'reveal'
  if (phase === 'reveal') return 'ended'
  return null
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}
