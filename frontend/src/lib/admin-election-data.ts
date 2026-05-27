export type AdminElectionStatus = 'aktif' | 'selesai'

export type AdminElectionRecord = {
  id: string
  title: string
  meta: string
  status: AdminElectionStatus
  badge: string
  iconTone: 'emerald' | 'orange' | 'blue'
  actionLabel: string
  actionTone: 'indigo' | 'slate' | 'blue'
  secondaryActionLabel?: string
  code: string
  periodLabel: string
  turnoutLabel: string
  commits?: { total: string; target: string; hash: string; revealStart: string; integrity: string }
  detail: {
    statusPill: string
    candidates: Array<{
      id: string
      number: string
      name: string
      faculty: string
      summary: string
      imageTone: 'dark' | 'neutral'
      identityNumber: string
      bio: string
      vision: string
      mission: string
    }>
    blockchainAnchor: string
    blockchainNetworkLabel: string
    turnout: { total: string; target: string; percentage: string; progressWidthClassName: string; note: string }
    quickActions: Array<{ label: string; icon: 'download' | 'share' | 'audit' | 'report' }>
    whitelist: {
      total: string
      target: string
      integrityTitle: string
      integrityDescription: string
      evidence: string
      evidenceStatus: string
      records: Array<{ wallet: string; name: string; status: 'verified' | 'pending'; addedAt: string }>
      uploadSupport: string
    }
    parameterVoting: {
      phaseTitle: string
      phaseDescription: string
      phaseOne: { label: string; start: string; end: string }
      phaseTwo: { label: string; start: string; end: string }
      consensus: { method: string; quorum: string; quorumProgressWidthClassName: string; protectionTitle: string; protectionDescription: string }
      contract: { address: string; network: string; version: string; currentHash: string }
      privacy: { headline: string; items: Array<{ title: string; description: string }>; ctaLabel: string }
    }
    realtime: {
      connectedLabel: string
      totalVotes: string
      totalTarget: string
      participation: string
      remaining: { hours: string; minutes: string; seconds: string; label: string }
      networkStatus: { title: string; subtitle: string }
      results: Array<{ candidateNumber: string; candidateName: string; votes: string; percentage: string; barWidthClassName: string; tone: 'primary' | 'secondary' }>
      feed: Array<{ tx: string; time: string; age: string }>
      guarantee: { title: string; description: string }
    }
    monitoring: {
      title: string
      description: string
      currentPhase: string
      timeRemaining: string
      totalWhitelist: string
      totalCommits: string
      commitProgress: string
      totalReveals: string
      totalLogs: string
      dateRange: string
      categories: string[]
      selectedCategory: string
      actorSearchPlaceholder: string
      logRows: Array<{
        time: string
        timeMeta: string
        rangeKey: 'hari-ini' | '7-hari' | '30-hari'
        category: string
        actorName: string
        actorWallet: string
        action: string
        actionTone: 'blue' | 'amber' | 'slate' | 'purple'
        objectTitle: string
        objectMeta: string
        status: 'selesai' | 'berlangsung' | 'menunggu'
        hash: string
      }>
      functionPayload: string
      metadata: { browserAgent: string; ipAddress: string; security: string }
      guarantee: { title: string; description: string }
    }
    candidateForm: {
      breadcrumbParent: string
      breadcrumbCurrent: string
      title: string
      description: string
      uploadLabel: string
      uploadHint: string
      uploadSupport: string
      identityLabel: string
      identityPlaceholder: string
      hashPreviewLabel: string
      fullNameLabel: string
      fullNamePlaceholder: string
      bioLabel: string
      bioPlaceholder: string
      visionLabel: string
      visionPlaceholder: string
      missionLabel: string
      missionPlaceholder: string
      validationTitle: string
      validationDescription: string
      validationStatus: string
    }
  }
}

export const adminElectionData: AdminElectionRecord[] = []

export const adminElectionFilters: Array<{ key: 'semua' | AdminElectionStatus; label: string }> = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Aktif' },
  { key: 'selesai', label: 'Selesai' },
]

export const adminElectionDetailTabs = [
  { id: 'kandidat', label: 'Kandidat' },
  { id: 'whitelist', label: 'Pemilih Whitelist' },
  { id: 'parameter', label: 'Parameter Voting' },
  { id: 'realtime', label: 'Real-time hasil' },
] as const

export type AdminElectionDetailTabId = (typeof adminElectionDetailTabs)[number]['id']

export function getAdminElectionById(_id: string): AdminElectionRecord | null {
  return null
}

export function getAdminElectionCandidateById(
  _electionId: string,
  _candidateId: string,
): AdminElectionRecord['detail']['candidates'][number] | null {
  return null
}
