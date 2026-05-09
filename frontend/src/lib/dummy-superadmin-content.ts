export type SuperadminModuleKey =
  | 'beranda'
  | 'manajemen-admin'
  | 'manajemen-pemilihan'
  | 'manajemen-proposal'
  | 'risk-activity'
  | 'pengaturan-platform'
  | 'bantuan'

type SuperadminSidebarIconKey =
  | 'layout-dashboard'
  | 'users'
  | 'vote'
  | 'file-text'
  | 'alert-triangle'
  | 'settings'
  | 'life-buoy'

interface SuperadminSidebarItem {
  href: string
  label: string
  iconKey: SuperadminSidebarIconKey
}

export const superadminShellContent = {
  sidebarItems: [
    { href: '/superadmin', label: 'Beranda', iconKey: 'layout-dashboard' },
    { href: '/superadmin/manajemen-admin', label: 'Manajemen Admin', iconKey: 'users' },
    { href: '/superadmin/manajemen-pemilihan', label: 'Manajemen Pemilihan', iconKey: 'vote' },
    { href: '/superadmin/manajemen-proposal', label: 'Manajemen Proposal', iconKey: 'file-text' },
    { href: '/superadmin/risk-activity', label: 'Risk Activity', iconKey: 'alert-triangle' },
    { href: '/superadmin/pengaturan-platform', label: 'Pengaturan Platform', iconKey: 'settings' },
  ] as SuperadminSidebarItem[],
  brandTagline: 'Superadmin Console',
  headerLabel: 'Pusat Kendali Superadmin',
  searchPlaceholder: 'Cari log, instansi, atau pemilihan...',
  profile: {
    name: 'Master Superadmin',
    wallet: '0x99A...b810',
    editLabel: 'Sunting Profil',
    logoutLabel: 'Keluar Sesi',
  },
  footer: {
    copyright: '© 2026 VoteIn Platform · Superadmin Access',
    links: [
      { label: 'Platform Status', href: '#' },
      { label: 'Audit Log', href: '#' },
    ],
  },
}

export const superadminDashboardContent = {
  hero: {
    badge: 'Overview Sistem Global',
    title: 'Kendali Penuh Atas Ekosistem VoteIn',
    description: 'Pantau seluruh aktivitas dari institusi yang terdaftar, tinjau proposal pemilihan baru, dan pantau aktivitas berisiko pada level smart contract dan platform.',
    primaryCta: 'Review Proposal Baru',
    secondaryCta: 'Laporan Sistem',
  },
  metricCards: [
    { label: 'Total Pemilihan (Aktif)', value: '14', change: '+2 bulan ini', tone: 'success' },
    { label: 'Admin Terdaftar', value: '42', change: 'Tersebar di 8 instansi', tone: 'info' },
    { label: 'Proposal Pending', value: '5', change: 'Butuh review segera', tone: 'warning' },
    { label: 'Risk Flags', value: '2', change: 'Cek log aktivitas', tone: 'danger' },
  ],
  modules: [
    {
      key: 'manajemen-admin',
      title: 'Manajemen Admin',
      description: 'Kelola akun admin organisasi atau instansi yang terdaftar untuk membuat pemilihan.',
    },
    {
      key: 'manajemen-proposal',
      title: 'Review Proposal',
      description: 'Verifikasi pengajuan penggunaan platform untuk menjamin validitas ruang pemilihan.',
    },
    {
      key: 'risk-activity',
      title: 'Risk Activity',
      description: 'Monitor error blockchain, force close pemilihan, atau perilaku mencurigakan lainnya.',
    },
    {
      key: 'pengaturan-platform',
      title: 'Pengaturan Global',
      description: 'Konfigurasi paramater base system, gas limit margin, dan whitelist master.',
      dark: true,
      cta: 'Ubah Parameter',
    },
  ],
  recentRiskActivities: [
    {
      block: '#48,291,105',
      text: 'Upaya pembuatan pemilihan dengan batas waktu tidak wajar (melewati max_duration).',
      time: '1 jam lalu',
      status: 'Terblokir (Contract Level)',
      severity: 'high',
    },
    {
      block: '#48,290,001',
      text: 'Pendaftaran admin baru dari wallet tidak dikenal mencoba bypass verifikasi.',
      time: 'Kemarin',
      status: 'Akses Ditolak',
      severity: 'medium',
    },
  ]
}

export const superadminManajemenAdminContent = {
  header: {
    title: 'Daftar Admin Institusi',
    description: 'Seluruh akun administrator yang memiliki akses untuk membuat dan mengelola pemilihan pada platform.',
    primaryCta: 'Tambah Admin Baru',
  },
  admins: [
    {
      id: 'adm-001',
      name: 'HIMAFORKA FTI UAJY',
      wallet: '0x71C...4f21',
      status: 'Aktif',
      totalElections: 4,
      joinedAt: '12 Jan 2026',
    },
    {
      id: 'adm-002',
      name: 'BEM UGM',
      wallet: '0x32B...9c82',
      status: 'Aktif',
      totalElections: 12,
      joinedAt: '05 Mar 2025',
    },
    {
      id: 'adm-003',
      name: 'KPU Daerah Simulasi',
      wallet: '0x88F...1e11',
      status: 'Suspended',
      totalElections: 1,
      joinedAt: '20 Feb 2026',
    },
  ]
}

export const superadminManajemenPemilihanContent = {
  header: {
    title: 'Monitor Pemilihan Global',
    description: 'Lacak semua ruang pemilihan yang berjalan di atas platform lintas instansi.',
  },
  elections: [
    {
      id: 'el-01',
      title: 'Pemilihan Ketua HIMAFORKA 2026',
      instansi: 'HIMAFORKA FTI UAJY',
      status: 'Aktif (Commit Phase)',
      voters: 124,
      txCount: 87,
    },
    {
      id: 'el-02',
      title: 'Pemilihan Presiden BEM 2026',
      instansi: 'BEM UGM',
      status: 'Draft',
      voters: 0,
      txCount: 0,
    },
    {
      id: 'el-03',
      title: 'Simulasi Pilkada 2026',
      instansi: 'KPU Daerah Simulasi',
      status: 'Ended (Force Closed)',
      voters: 500,
      txCount: 312,
    },
  ]
}

export const superadminManajemenProposalContent = {
  header: {
    title: 'Review Proposal Masuk',
    description: 'Daftar pengajuan dari instansi untuk menyelenggarakan e-voting di platform ini.',
  },
  proposals: [
    {
      id: 'prop-01',
      instansi: 'Senat Mahasiswa FTI',
      title: 'Pemilihan Ketua Senat 2026',
      submittedAt: '08 Mei 2026',
      status: 'Pending Review',
      urgency: 'Tinggi',
    },
    {
      id: 'prop-02',
      instansi: 'HIMAARS',
      title: 'Pemilihan Ketua Himpunan Arsitektur',
      submittedAt: '05 Mei 2026',
      status: 'Approved',
      urgency: 'Normal',
    },
    {
      id: 'prop-03',
      instansi: 'Organisasi Eksternal ABC',
      title: 'Pemilihan Direktur Eksternal',
      submittedAt: '01 Mei 2026',
      status: 'Rejected',
      urgency: 'Rendah',
    },
  ]
}

export const superadminRiskActivityContent = {
  header: {
    title: 'Log Risiko Keamanan',
    description: 'Anomali transaksi dan aktivitas mencurigakan yang ditangkap oleh monitor sistem.',
  },
  logs: [
    {
      id: 'log-001',
      timestamp: '09 Mei 2026, 14:32:00',
      event: 'Force Close Contract',
      actor: '0x88F...1e11 (KPU Daerah Simulasi)',
      description: 'Admin memaksa menutup pemilihan sebelum waktu reveal berakhir. Kuorum tidak terpenuhi.',
      severity: 'Critical',
      status: 'Investigating'
    },
    {
      id: 'log-002',
      timestamp: '08 Mei 2026, 09:15:22',
      event: 'Multiple Failed Commits',
      actor: 'Unknown Wallet (0x123...abc)',
      description: 'Terjadi 50+ percobaan pengiriman commit invalid ke contract pemilihan HIMAFORKA.',
      severity: 'High',
      status: 'Mitigated'
    },
    {
      id: 'log-003',
      timestamp: '05 Mei 2026, 10:00:00',
      event: 'Contract Deployment Failed',
      actor: '0x32B...9c82 (BEM UGM)',
      description: 'Kehabisan gas limit saat inisialisasi ruang pemilihan baru. Parameter terlalu besar.',
      severity: 'Medium',
      status: 'Resolved'
    }
  ]
}

export const superadminPlatformSettingsContent = {
  settings: {
    baseGasFeeMargin: '1.5x',
    maxVotersPerElection: '5000',
    requireKycForAdmins: true,
    platformMaintenanceMode: false,
    smartContractAddress: '0xAA8...99bb',
    rpcUrl: 'https://sepolia.base.org',
  }
}
