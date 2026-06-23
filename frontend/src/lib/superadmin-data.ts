export type SuperadminStatus = 'Aktif' | 'Menunggu' | 'Nonaktif'
type SuperadminProposalStatus = 'Menunggu Review' | 'Disetujui' | 'Perlu Revisi' | 'Berjalan'
export type SuperadminElectionState = 'Aktif' | 'Selesai' | 'Ditangguhkan'

interface SuperadminMetric { id: string; label: string; value: string; delta: string; hint: string; tone?: 'default' | 'warning' }
interface SuperadminActivity { id: string; title: string; description: string; time: string; tone: 'success' | 'info' | 'warning' }
export interface SuperadminAdminRecord {
  id: string
  initials: string
  name: string
  email: string
  accessLabel: string
  accessDetail: string
  status: SuperadminStatus
  lastSeen: string
  lastIp: string
  joinedAt: string
  lastLoginText: string
  lastLoginRelative: string
  blockchainIdentity: string
  spaces: Array<{ id: string; title: string; subtitle: string; role: string }>
  recentActivity: Array<{ id: string; action: string; meta: string; time: string; status: string; hash: string }>
}
export interface SuperadminElectionRecord { id: string; code: string; title: string; phaseLabel: string; status: SuperadminElectionState; totalVoters: string; participation: string; note: string }
export interface SuperadminProposalRecord { id: string; organizationName: string; proposalType: string; submittedAt: string; status: SuperadminProposalStatus }
export interface SuperadminProposalDetail {
  id: string
  badge: string
  proposalCode: string
  title: string
  organizationName: string
  submittedAt: string
  summary: string[]
  networkConfig: { contractAddress: string; consensus: string }
  objectives: Array<{ id: string; title: string; description: string; tone: 'success' | 'danger' }>
  riskProfile: { level: string; note: string; items: Array<{ label: string; status: string }> }
  timeline: Array<{ id: string; title: string; actor: string; time: string }>
  documents: Array<{ id: string; name: string; meta: string; path?: string; contentType?: string; documentType?: string; sizeLabel?: string; uploadedAt?: string }>
}
export interface SuperadminRiskAlert { 
  id: string; 
  title: string; 
  description: string; 
  actorLabel: string; 
  actorValue: string; 
  time: string; 
  tone: 'danger' | 'warning';
  status: 'active' | 'resolved' | 'blocked';
}
export interface SuperadminPlatformSession { id: string; device: string; meta: string; status: string }
export interface SuperadminAuditLogItem { id: string; block: string; eventLabel: string; title: string; timestamp: string; txHash: string; status: string; statusTone: 'verified' | 'syncing'; icon: 'proposal' | 'vote' | 'validator' }

export const superadminShellContent = {
  headerLabel: 'Dashboard super admin',
  searchPlaceholder: 'Cari data pemilihan...',
  profile: { name: 'Super Admin', wallet: 'Belum terhubung', editLabel: 'Sunting Profil', logoutLabel: 'Keluar Sesi' },
  footer: {
    copyright: '© 2026 Votein · Audit Pemilihan Mahasiswa',
    links: [{ label: 'Kebijakan Privasi', href: '/kebijakan-privasi' }, { label: 'Ketentuan Layanan', href: '/ketentuan-layanan' }],
  },
} as const

export const superadminDashboardData = {
  title: 'Beranda Ringkasan',
  description: 'Tinjauan lintas ruang e-voting berdasarkan data backend yang tersedia.',
  metrics: [
    { id: 'admins', label: 'Total Admin', value: '0', delta: 'Supabase', hint: 'belum ada data' },
    { id: 'spaces', label: 'Ruang Aktif', value: '0', delta: 'Supabase', hint: 'belum ada data' },
    { id: 'proposals', label: 'Proposal Menunggu', value: '0', delta: 'Supabase', hint: 'belum ada data', tone: 'warning' },
    { id: 'voters', label: 'Total Pemilih', value: '0', delta: 'Supabase', hint: 'belum ada data' },
  ] satisfies SuperadminMetric[],
  chart: {
    title: 'Aktivitas Jaringan',
    description: 'Data grafik menunggu integrasi audit/indexer.',
    ranges: ['7H', '30H'] as const,
    series: { '7H': [0, 0, 0, 0, 0, 0, 0], '30H': [0, 0, 0, 0, 0, 0, 0] },
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
  },
  activities: [] satisfies SuperadminActivity[],
  blockchainStatus: { title: 'Status Blockchain', description: 'Menunggu data indexer.', hash: 'Belum tersedia', status: 'Menunggu data Supabase' },
}

export const superadminAdminStatuses = ['Semua Status', 'Aktif', 'Menunggu', 'Nonaktif'] as const
export const superadminAdminTabs = [
  { key: 'daftar', label: 'Daftar Admin' },
  { key: 'tambah', label: 'Tambah Admin' },
] as const
export const superadminElectionFilters = ['Semua', 'Aktif', 'Selesai', 'Ditangguhkan'] as const

export const superadminRiskData = {
  title: 'Risk Activity',
  description: 'Belum ada alert risiko dari backend.',
  metrics: [
    { id: 'alerts', label: 'Alert aktif', value: '0', suffix: '', accent: '', note: 'Supabase belum memiliki alert', tone: 'default' },
    { id: 'spaces', label: 'Ruang dipantau', value: '0', suffix: '', accent: '', note: 'Menunggu data ruang', tone: 'default' },
    { id: 'incidents', label: 'Insiden', value: '0', suffix: '', accent: '', note: 'Belum ada insiden', tone: 'success' },
  ],
  neuralSummary: { status: 'Menunggu data', confidence: '0%', description: 'Belum ada data risiko live untuk dianalisis.' },
  regionProfile: { region: 'Belum tersedia', description: 'Profil risiko akan muncul setelah data audit tersedia.' },
  alerts: [] satisfies SuperadminRiskAlert[],
}

export const superadminPlatformData = {
  profile: { name: 'Super Admin', fullName: 'Super Admin', email: '', avatarUrl: '' },
  blockchain: { network: 'Base Sepolia', networkStatus: 'Menunggu konfigurasi', ownerAddress: 'Belum tersedia', gasLimit: '0' },
  system: { platformName: 'Votein', defaultLanguage: 'id-ID', uploadNote: 'Data konfigurasi backend belum tersedia.' },
  sessions: [] satisfies SuperadminPlatformSession[],
}

const superadminProposalDetails: Record<string, SuperadminProposalDetail> = {}

const superadminAuditLogData = {
  title: 'Audit Log',
  description: 'Log audit akan tampil setelah ada transaksi atau operasi backend yang tercatat.',
  summary: {
    integrityLabel: 'Integritas',
    integrityStatus: 'Menunggu data',
    integrityValue: '0%',
    integrityNote: 'Belum ada bukti audit.',
    latestProofId: 'Belum tersedia',
    lastUpdated: '-',
    activeNodes: '0 node',
    averageLatency: '0 ms',
    blockTime: '0 s',
  },
  filters: ['Semua', 'Proposal', 'Vote', 'Validator'] as const,
  logs: [] satisfies SuperadminAuditLogItem[],
}
