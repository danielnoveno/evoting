export type SuperadminStatus = 'Aktif' | 'Menunggu' | 'Nonaktif'
export type SuperadminProposalStatus = 'Menunggu Review' | 'Disetujui' | 'Perlu Revisi'
export type SuperadminElectionState = 'Aktif' | 'Selesai' | 'Ditangguhkan'

export interface SuperadminMetric {
  id: string
  label: string
  value: string
  delta: string
  hint: string
  tone?: 'default' | 'warning'
}

export interface SuperadminActivity {
  id: string
  title: string
  description: string
  time: string
  tone: 'success' | 'info' | 'warning'
}

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
  spaces: Array<{
    id: string
    title: string
    subtitle: string
    role: string
  }>
  recentActivity: Array<{
    id: string
    action: string
    meta: string
    time: string
    status: string
    hash: string
  }>
}

export interface SuperadminElectionRecord {
  id: string
  code: string
  title: string
  phaseLabel: string
  status: SuperadminElectionState
  totalVoters: string
  participation: string
  note: string
}

export interface SuperadminProposalRecord {
  id: string
  organizationName: string
  proposalType: string
  submittedAt: string
  status: SuperadminProposalStatus
}

export interface SuperadminProposalDetail {
  id: string
  badge: string
  proposalCode: string
  title: string
  organizationName: string
  submittedAt: string
  summary: string[]
  networkConfig: {
    contractAddress: string
    consensus: string
  }
  objectives: Array<{
    id: string
    title: string
    description: string
    tone: 'success' | 'danger'
  }>
  riskProfile: {
    level: string
    note: string
    items: Array<{
      label: string
      status: string
    }>
  }
  timeline: Array<{
    id: string
    title: string
    actor: string
    time: string
  }>
  documents: Array<{
    id: string
    name: string
    meta: string
  }>
}

export interface SuperadminRiskAlert {
  id: string
  title: string
  description: string
  actorLabel: string
  actorValue: string
  time: string
  tone: 'danger' | 'warning'
}

export interface SuperadminPlatformSession {
  id: string
  device: string
  meta: string
  status: string
}

export interface SuperadminAuditLogItem {
  id: string
  block: string
  eventLabel: string
  title: string
  timestamp: string
  txHash: string
  status: string
  statusTone: 'verified' | 'syncing'
  icon: 'proposal' | 'vote' | 'validator'
}

export const superadminShellContent = {
  brandTagline: 'E-Voting with /blockchain system',
  headerLabel: 'Dashboard utama super admin',
  searchPlaceholder: 'Cari data pemilihan...',
  profile: {
    name: 'TU FTI UAJY',
    wallet: '0x71C...4f21',
    editLabel: 'Sunting Profil',
    logoutLabel: 'Keluar Sesi',
  },
  footer: {
    copyright: '© 2026 E-Voting Indonesia · Keamanan Tingkat Tinggi',
    links: [
      { label: 'Kebijakan Privasi', href: '#' },
      { label: 'Ketentuan Layanan', href: '#' },
    ],
  },
} as const

export const superadminDashboardData = {
  title: 'Beranda Ringkasan',
  description: `Tinjauan global sistem e-voting untuk ruang utama ${sharedDummyContext.organizationShort}.`,
  metrics: [
    { id: 'admins', label: 'Total Admin', value: '142', delta: '+3%', hint: 'dari bulan lalu' },
    { id: 'spaces', label: 'Ruang Aktif', value: '85', delta: '+12', hint: 'minggu ini' },
    { id: 'proposals', label: 'Proposal Menunggu', value: '24', delta: 'Butuh tinjauan admin', hint: '', tone: 'warning' },
    { id: 'voters', label: 'Total Pemilih', value: '45.2K', delta: '+1.2K', hint: 'pemilih terverifikasi baru' },
  ] satisfies SuperadminMetric[],
  chart: {
    title: 'Aktivitas Jaringan Global',
    description: 'Volume transaksi (suara & proposal) 7 hari terakhir.',
    ranges: ['7H', '30H'] as const,
    series: {
      '7H': [18, 29, 22, 46, 38, 43, 32],
      '30H': [16, 24, 20, 33, 30, 37, 28],
    },
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
  },
  activities: [
    {
      id: 'a1',
      title: 'Admin Baru Ditambahkan',
      description: 'Admin 0x7F...2B9a ditambahkan oleh superadmin.',
      time: '2 menit yang lalu',
      tone: 'success',
    },
    {
      id: 'a2',
      title: 'Proposal Ruang Disetujui',
      description: `Proposal “${sharedDummyContext.proposalTitle}” telah disetujui.`,
      time: '45 menit yang lalu',
      tone: 'info',
    },
    {
      id: 'a3',
      title: 'Aktivitas Mencurigakan',
      description: 'Deteksi lonjakan suspend pada satu ruang pemilihan.',
      time: '1 jam yang lalu',
      tone: 'warning',
    },
  ] satisfies SuperadminActivity[],
  blockchainStatus: {
    title: 'Status Root Blockchain Saat Ini',
    description: 'Hash state global terbaru diverifikasi oleh sistem.',
    hash: '0x8a3f9b2...e4c1',
    status: 'Sinkronisasi Aktif',
  },
}

export const superadminAdmins: SuperadminAdminRecord[] = [
  {
    id: 'admin-cw',
    initials: 'CW',
    name: 'Citra Wijaya',
    email: 'citra.wijaya@votein.id',
    accessLabel: 'Read-Only',
    accessDetail: 'Semua Pemilihan',
    status: 'Aktif',
    lastSeen: 'Hari ini, 09:41',
    lastIp: '192.168.1.104',
    joinedAt: '14 Oktober 2023',
    lastLoginText: 'Sekarang',
    lastLoginRelative: 'Saat ini aktif di dashboard',
    blockchainIdentity: 'vtn_adm_992_4492_cw_x01',
    spaces: [
      { id: 's1', title: sharedDummyContext.proposalTitle, subtitle: 'UKM Mahasiswa • 3 Kandidat', role: 'All Access' },
      { id: 's2', title: 'Seleksi Kepala Divisi Riset Internal', subtitle: 'Manajemen whitelist • 2 kandidat', role: 'Editor' },
    ],
    recentActivity: [
      { id: 'r1', action: 'Approved Candidate', meta: 'Candidate: Arya Damar (ID: 02)', time: '2 jam yang lalu', status: 'Sukses', hash: '0x7a...f92b' },
      { id: 'r2', action: 'Updated Whitelist', meta: 'Added 120 internal voters', time: '5 jam yang lalu', status: 'Sukses', hash: '0x2d...11ac' },
      { id: 'r3', action: 'Login Attempt', meta: 'Device: MacOS - Chrome', time: '6 jam yang lalu', status: 'Info', hash: '0x1e...c03e' },
      { id: 'r4', action: 'Created New Election', meta: `"${sharedDummyContext.proposalTitle}"`, time: 'Kemarin, 14:20', status: 'Sukses', hash: '0x9b...44ff' },
    ],
  },
  {
    id: 'admin-dr',
    initials: 'DR',
    name: 'Dian Sastrowardoyo',
    email: 'dian.s@evote.id',
    accessLabel: 'Global Access',
    accessDetail: 'Semua Pemilihan',
    status: 'Aktif',
    lastSeen: 'Hari ini, 09:41',
    lastIp: '192.168.1.1',
    joinedAt: '20 September 2023',
    lastLoginText: 'Hari ini, 09:41',
    lastLoginRelative: '2 perangkat aktif',
    blockchainIdentity: 'vtn_adm_102_8832_dr_a99',
    spaces: [
      { id: 's3', title: 'Global Access', subtitle: 'Semua pemilihan organisasi', role: 'Super Editor' },
    ],
    recentActivity: [
      { id: 'r5', action: 'Reviewed Proposal', meta: sharedDummyContext.proposalTitle, time: '30 menit yang lalu', status: 'Sukses', hash: '0x4a...19c2' },
    ],
  },
  {
    id: 'admin-bs',
    initials: 'BS',
    name: 'Budi Santoso',
    email: 'b.santoso@evote.id',
    accessLabel: 'Koordinator Regional UKM',
    accessDetail: '+2 Space Internal',
    status: 'Aktif',
    lastSeen: 'Kemarin, 14:20',
    lastIp: '10.0.0.45',
    joinedAt: '05 Agustus 2023',
    lastLoginText: 'Kemarin, 14:20',
    lastLoginRelative: 'Terakhir sinkron 18 jam lalu',
    blockchainIdentity: 'vtn_adm_211_5101_bs_a11',
    spaces: [
      { id: 's4', title: 'Pemilihan Sekretaris UKM Riset 2026', subtitle: 'Manajemen whitelist dan hasil', role: 'Editor' },
      { id: 's5', title: 'Voting Kebijakan Publikasi Karya UKM Riset', subtitle: 'Reveal verification', role: 'Reviewer' },
    ],
    recentActivity: [
      { id: 'r6', action: 'Updated Panel', meta: 'Menambah 3 panelis pengawas', time: 'Kemarin, 10:11', status: 'Sukses', hash: '0x28...a122' },
    ],
  },
  {
    id: 'admin-mr',
    initials: 'MR',
    name: 'Maya Rahma',
    email: 'maya.r@evote.id',
    accessLabel: 'Audit Log',
    accessDetail: 'Pemantauan regional',
    status: 'Menunggu',
    lastSeen: '-',
    lastIp: '-',
    joinedAt: '02 November 2023',
    lastLoginText: 'Belum login',
    lastLoginRelative: 'Akun belum diaktivasi',
    blockchainIdentity: 'vtn_adm_044_1882_mr_p03',
    spaces: [
      { id: 's6', title: 'Audit Regional', subtitle: 'Akses laporan dan proposal', role: 'Pending' },
    ],
    recentActivity: [],
  },
  {
    id: 'admin-na',
    initials: 'NA',
    name: 'Nadia Anugrah',
    email: 'nadia.anugrah@votein.id',
    accessLabel: 'Regional Access',
    accessDetail: '4 Pemilihan Aktif',
    status: 'Nonaktif',
    lastSeen: '12 Jan 2026, 08:10',
    lastIp: '172.16.2.20',
    joinedAt: '10 Juli 2023',
    lastLoginText: '12 Jan 2026',
    lastLoginRelative: 'Dinonaktifkan sementara',
    blockchainIdentity: 'vtn_adm_778_0012_na_q10',
    spaces: [
      { id: 's7', title: 'Pemilu Fakultas Hukum', subtitle: 'Suspend sementara', role: 'Regional' },
    ],
    recentActivity: [
      { id: 'r7', action: 'Status Suspended', meta: 'Akun dihentikan sementara oleh superadmin', time: '12 Jan 2026', status: 'Warning', hash: '0x88...320d' },
    ],
  },
]

export const superadminElections: SuperadminElectionRecord[] = [
  {
    id: sharedDummyContext.electionId,
    code: sharedDummyContext.electionCode,
    title: sharedDummyContext.proposalTitle,
    phaseLabel: 'Fase Komitmen',
    status: 'Aktif',
    totalVoters: String(sharedDummyContext.voterEstimate),
    participation: '68%',
    note: 'Online',
  },
  {
    id: 'ukm-riset-publikasi-2026',
    code: 'UKM-2026-RI-02',
    title: 'Voting Kebijakan Publikasi Karya UKM Riset',
    phaseLabel: 'Fase Pemungutan',
    status: 'Aktif',
    totalVoters: '3,200',
    participation: '85%',
    note: 'Online',
  },
  {
    id: 'ukm-riset-sekretaris-2026',
    code: 'UKM-2026-RI-03',
    title: 'Pemilihan Sekretaris UKM Riset 2026',
    phaseLabel: 'Ditangguhkan (Anomali)',
    status: 'Ditangguhkan',
    totalVoters: '540',
    participation: '12%',
    note: 'Halted',
  },
  {
    id: 'ukm-riset-divisi-inovasi-2025',
    code: 'UKM-2025-RI-04',
    title: 'Pemilihan Kepala Divisi Inovasi UKM Riset 2025',
    phaseLabel: 'Selesai & Teraudit',
    status: 'Selesai',
    totalVoters: '1,280',
    participation: '91%',
    note: 'Final',
  },
]

export const superadminProposals: SuperadminProposalRecord[] = [
  {
    id: sharedDummyContext.proposalId,
    organizationName: sharedDummyContext.organizationShort,
    proposalType: 'Pemilihan Koordinator',
    submittedAt: '18 Okt 2023',
    status: 'Disetujui',
  },
  {
    id: 'p-ukm-riset-divisi',
    organizationName: sharedDummyContext.organizationShort,
    proposalType: 'Pemilihan Kepala Divisi Program',
    submittedAt: '12 Okt 2023',
    status: 'Menunggu Review',
  },
  {
    id: 'p-ukm-riset-publikasi',
    organizationName: sharedDummyContext.organizationShort,
    proposalType: 'Voting Kebijakan Publikasi',
    submittedAt: '14 Okt 2023',
    status: 'Menunggu Review',
  },
  {
    id: 'p-ukm-riset-logo',
    organizationName: sharedDummyContext.organizationShort,
    proposalType: 'Sayembara Logo Inovasi',
    submittedAt: '15 Okt 2023',
    status: 'Menunggu Review',
  },
  {
    id: 'p-ukm-riset-sekretaris',
    organizationName: sharedDummyContext.organizationShort,
    proposalType: 'Pemilihan Sekretaris',
    submittedAt: '17 Okt 2023',
    status: 'Disetujui',
  },
]

export const superadminAdminStatuses = ['Semua Status', 'Aktif', 'Menunggu', 'Nonaktif'] as const
export const superadminAdminTabs = [
  { key: 'daftar', label: 'Daftar Admin' },
  { key: 'tambah', label: 'Tambah Admin Baru' },
] as const
export const superadminElectionFilters = ['Semua', 'Aktif', 'Selesai', 'Ditangguhkan'] as const

export const superadminRiskData = {
  title: 'Real-time Threat Monitoring',
  description: 'Sistem deteksi neural aktif. Memantau anomali jaringan dan perilaku validator.',
  metrics: [
    { id: 'alerts', label: 'High Risk Alerts', value: '14', note: 'Pembaruan: 2 detik lalu', accent: '+3', tone: 'danger' },
    { id: 'flows', label: 'Unusual Token Flows', value: '2.4M', suffix: 'SVT', note: 'Ambang batas: 1.0M SVT/jam', tone: 'default' },
    { id: 'divergence', label: 'Validator Divergence', value: '0.02', suffix: '%', note: 'Status: Optimal', tone: 'success' },
  ],
  alerts: [
    {
      id: 'ra1',
      title: 'Sybil Attack Pattern Detected',
      description: 'Lonjakan pembuatan identitas dari node yang sama. Tindakan mitigasi disarankan.',
      actorLabel: 'Actor ID',
      actorValue: '0x7a...4e2d',
      time: '10:42:15 WIB',
      tone: 'danger',
    },
    {
      id: 'ra2',
      title: 'Unusual Withdrawal Velocity',
      description: 'Kecepatan penarikan melebihi rata-rata harian sebesar 400% pada pool validator Gamma.',
      actorLabel: 'Pool',
      actorValue: '0x92...f1b4',
      time: '10:28:03 WIB',
      tone: 'warning',
    },
  ] satisfies SuperadminRiskAlert[],
  neuralSummary: {
    status: 'Aktif',
    confidence: '94.2%',
    description: 'Model mendeteksi anomali terdistribusi yang terpusat pada 3 node utama. Pola menunjukkan upaya koordinasi tingkat rendah.',
  },
  regionProfile: {
    region: 'Asia Tenggara - Node 44',
    description: 'Konsentrasi aktivitas mencurigakan tertinggi dalam 1 jam terakhir.',
  },
}

export const superadminPlatformData = {
  title: 'Pengaturan Sistem',
  description: 'Kelola konfigurasi platform, keamanan, dan identitas Superadmin.',
  profile: {
    name: 'Admin utama',
    email: 'superadmin@votein.id',
    fullName: 'Admin Utama',
  },
  blockchain: {
    network: 'Base Sepolia Testnet',
    networkStatus: 'Terhubung',
    ownerAddress: '0x71C...976F',
    gasLimit: '50',
  },
  system: {
    platformName: 'Votein E-Voting',
    defaultLanguage: 'Bahasa Indonesia',
    uploadNote: 'Format: PNG, SVG (Max 2MB)',
  },
  sessions: [
    { id: 'ss1', device: 'MacBook Pro - Safari', meta: 'Jakarta, ID • Saat ini', status: 'Aktif' },
    { id: 'ss2', device: 'iPhone 13 - Chrome', meta: 'Bandung, ID • 2 jam lalu', status: 'Cabut' },
  ] satisfies SuperadminPlatformSession[],
}

export const superadminProposalDetails: Record<string, SuperadminProposalDetail> = {
  [sharedDummyContext.proposalId]: {
    id: sharedDummyContext.proposalId,
    badge: 'Disetujui',
    proposalCode: sharedDummyContext.proposalCode,
    title: sharedDummyContext.proposalTitle,
    organizationName: sharedDummyContext.organization,
    submittedAt: '18 Okt 2023',
    summary: [...sharedDummyContext.proposalSummary],
    networkConfig: {
      contractAddress: `${sharedDummyContext.contractAddress.slice(0, 5)}...${sharedDummyContext.contractAddress.slice(-4)}`,
      consensus: 'Commit-Reveal + Whitelist',
    },
    objectives: [
      {
        id: 'ori-1',
        title: 'Whitelist anggota aktif UKM',
        description: 'Daftar anggota aktif semester berjalan sudah tersedia dan siap disinkronkan ke smart contract.',
        tone: 'success',
      },
      {
        id: 'ori-2',
        title: 'Mekanisme commit-reveal',
        description: 'Alur commit, reveal, dan audit publik sudah disesuaikan dengan kebijakan keamanan organisasi.',
        tone: 'success',
      },
      {
        id: 'ori-3',
        title: 'Durasi fase reveal',
        description: 'Durasi reveal masih perlu disingkat agar tidak terlalu panjang untuk pemilihan skala UKM.',
        tone: 'danger',
      },
    ],
    riskProfile: {
      level: 'Medium',
      note: 'Perlu penyesuaian durasi dan validasi final whitelist.',
      items: [
        { label: 'Replay Risk', status: 'Mitigated' },
        { label: 'Double Voting', status: 'Mitigated' },
        { label: 'Operational Timing', status: 'Elevated' },
      ],
    },
    timeline: [
      { id: 'tri-1', title: 'Proposal Diajukan', actor: 'Oleh: UKM Riset dan Inovasi', time: '18 Okt 2023, 13:15 WIB' },
      { id: 'tri-2', title: 'Draft Disiapkan', actor: 'Panitia Pemilihan Internal', time: '17 Okt 2023, 19:45 WIB' },
    ],
    documents: [
      { id: 'd-ri-1', name: 'Draft_SK_Panitia_UKM_RI.pdf', meta: '1.8 MB • PDF' },
      { id: 'd-ri-2', name: 'Whitelist_Anggota_Aktif_UKM_RI.csv', meta: '214 KB • CSV' },
    ],
  },
  'p-bem-ft': {
    id: 'p-bem-ft',
    badge: 'Menunggu Review',
    proposalCode: 'PR-2023-089A',
    title: 'Pemilihan Kepala Divisi Program UKM Riset 2026',
    organizationName: sharedDummyContext.organization,
    submittedAt: '12 Okt 2023',
    summary: [
      'Proposal ini diajukan untuk melaksanakan pemilihan Kepala Divisi Program UKM Riset dan Inovasi periode 2026-2027. Proses pemilihan menggunakan sistem e-voting berbasis blockchain untuk memastikan transparansi, keamanan, dan integritas suara.',
      'Target partisipan adalah seluruh anggota aktif UKM Riset dan Inovasi yang terdaftar pada semester berjalan, dengan estimasi DPT sebanyak 324 anggota.',
    ],
    networkConfig: {
      contractAddress: '0x71C...976F',
      consensus: 'Proof of Authority (PoA)',
    },
    objectives: [
      {
        id: 'o1',
        title: 'Integrasi database anggota aktif',
        description: 'Data anggota aktif UKM sudah tersedia dan diuji untuk validasi hak suara.',
        tone: 'success',
      },
      {
        id: 'o2',
        title: 'Skema autentikasi anggota',
        description: 'Menggunakan wallet anggota terdaftar dan validasi email organisasi.',
        tone: 'success',
      },
      {
        id: 'o3',
        title: 'SLA Waktu Pemungutan Suara',
        description: 'Durasi pemungutan 48 jam terdeteksi terlalu lama untuk mitigasi DDoS. Perlu direvisi menjadi 24 jam.',
        tone: 'danger',
      },
    ],
    riskProfile: {
      level: 'Medium',
      note: 'Dibutuhkan mitigasi tambahan',
      items: [
        { label: 'DDoS Vulnerability', status: 'Elevated' },
        { label: 'Sybil Attack', status: 'Mitigated' },
        { label: 'Data Privacy', status: 'Compliant' },
      ],
    },
    timeline: [
       { id: 't1', title: 'Proposal Diajukan', actor: `Oleh: ${sharedDummyContext.organization}`, time: '12 Okt 2023, 14:30 WIB' },
      { id: 't2', title: 'Draft Dibuat', actor: 'Disiapkan oleh panitia inti', time: '10 Okt 2023, 09:15 WIB' },
    ],
    documents: [
      { id: 'd1', name: 'Draft_SK_Panitia_2024.pdf', meta: '2.4 MB • PDF' },
       { id: 'd2', name: 'RAB_Program_Kerja_UKM_RI.pdf', meta: '1.1 MB • PDF' },
    ],
  },
}

export const superadminAuditLogData = {
  title: 'Audit Log',
  description: 'Lapisan transparansi real-time untuk meninjau event sistem yang tervalidasi di jaringan global.',
  summary: {
    integrityLabel: 'Status Integritas',
    integrityStatus: 'Terverifikasi',
    integrityValue: '100%',
    integrityNote: 'Konsensus node global',
    latestProofId: '0x7F2a...9b4C1e',
    lastUpdated: 'Baru saja (Block #12049)',
    activeNodes: '1,204 Nodes Aktif',
    averageLatency: '42ms',
    blockTime: '2.1s',
  },
  logs: [
    {
      id: 'log-1',
      block: '#12049',
      eventLabel: 'Proposal Executed',
      title: `Eksekusi: Sinkronisasi ${sharedDummyContext.proposalTitle}`,
      timestamp: '2023-10-27 14:32:01 UTC',
      txHash: '0x9a2...4f1d',
      status: 'Integrity Verified',
      statusTone: 'verified',
      icon: 'proposal',
    },
    {
      id: 'log-2',
      block: '#12048',
      eventLabel: 'New Vote Cast',
      title: `Suara anonim masuk - ${sharedDummyContext.proposalTitle}`,
      timestamp: '2023-10-27 14:31:45 UTC',
      txHash: '0x3b8...9c2a',
      status: 'Integrity Verified',
      statusTone: 'verified',
      icon: 'vote',
    },
    {
      id: 'log-3',
      block: '#12045',
      eventLabel: 'Validator Config',
      title: 'Update parameter konsensus node Asia-Pasifik',
      timestamp: '2023-10-27 14:28:10 UTC',
      txHash: '0x1f4...7e5b',
      status: 'Syncing (2/3)',
      statusTone: 'syncing',
      icon: 'validator',
    },
    {
      id: 'log-4',
      block: '#12044',
      eventLabel: 'New Vote Cast',
      title: `Suara anonim masuk - ${sharedDummyContext.proposalTitle}`,
      timestamp: '2023-10-27 14:27:55 UTC',
      txHash: '0x8d1...2a4f',
      status: 'Integrity Verified',
      statusTone: 'verified',
      icon: 'vote',
    },
    {
      id: 'log-5',
      block: '#12041',
      eventLabel: 'Whitelist Updated',
      title: 'Whitelist pemilih sinkron dengan data fakultas',
      timestamp: '2023-10-27 14:20:11 UTC',
      txHash: '0x4a1...88ce',
      status: 'Integrity Verified',
      statusTone: 'verified',
      icon: 'proposal',
    },
    {
      id: 'log-6',
      block: '#12039',
      eventLabel: 'Validator Config',
      title: 'Rotasi validator cadangan kawasan timur',
      timestamp: '2023-10-27 14:14:04 UTC',
      txHash: '0x2cd...91bf',
      status: 'Syncing (1/3)',
      statusTone: 'syncing',
      icon: 'validator',
    },
  ] satisfies SuperadminAuditLogItem[],
}
import { sharedDummyContext } from '@/lib/dummy-shared-context'
