export type AdminModuleKey =
  | 'beranda'
  | 'proposal'
  | 'fase'
  | 'kandidat'
  | 'whitelist'
  | 'monitoring'
  | 'hasil'
  | 'tambah'

type ElectionVariant = 'active' | 'draft' | 'final'

type ElectionIconKey = 'briefcase' | 'document' | 'shield'

type SidebarIconKey = 'layout-grid' | 'gauge' | 'file-text' | 'circle-help'

interface SidebarItem {
  href: string
  label: string
  iconKey: SidebarIconKey
}

interface FooterLink {
  label: string
  href: string
}

interface DashboardModule {
  key: AdminModuleKey
  title: string
  description: string
  dark?: boolean
  cta?: string
}

interface RecentActivity {
  block: string
  text: string
  time: string
  status: string
}

interface MetricCardContent {
  label: string
  value: string
  change: string
  progressLabel: string
  progressValue: string
  progressWidthClassName: string
}

interface ElectionStat {
  label: string
  value: string
  subValue?: string
  tone?: 'info' | 'success'
}

interface ElectionAction {
  label: string
  style: 'primary-soft' | 'secondary-soft'
}

interface BaseElection {
  id: string
  iconKey: ElectionIconKey
  iconClassName: string
  title: string
  meta: string
  badge: string
  badgeClassName: string
  variant: ElectionVariant
}

interface ActiveElection extends BaseElection {
  variant: 'active'
  voters: string[]
  extraVotersLabel: string
  stats: ElectionStat[]
  actions: ElectionAction[]
}

interface DraftElection extends BaseElection {
  variant: 'draft'
  setupButton: string
  progress: number
  progressLabel: string
}

interface FinalElection extends BaseElection {
  variant: 'final'
  reportButton: string
}

interface AdminShellContent {
  sidebarItems: SidebarItem[]
  brandTagline: string
  headerLabel: string
  searchPlaceholder: string
  profile: {
    name: string
    wallet: string
    editLabel: string
    logoutLabel: string
  }
  footer: {
    copyright: string
    links: FooterLink[]
  }
}

interface AdminDashboardContent {
  hero: {
    badge: string
    title: string
    description: string
    primaryCta: string
    secondaryCta: string
  }
  section: {
    title: string
    description: string
  }
  modules: DashboardModule[]
  activitySection: {
    title: string
    statusLabel: string
  }
  recentActivities: RecentActivity[]
  metricCard: MetricCardContent
}

interface AdminElectionManagementContent {
  header: {
    title: string
    description: string
    primaryCta: string
  }
  filters: string[]
  sortLabel: string
  elections: [ActiveElection, DraftElection, FinalElection, FinalElection]
  createCard: {
    title: string
    description: string
  }
}

export const adminShellContent: AdminShellContent = {
  sidebarItems: [
    { href: '/admin', label: 'Beranda', iconKey: 'layout-grid' },
    { href: '/admin/manajemen-pemilihan', label: 'Manajemen Pemilihan', iconKey: 'gauge' },
    { href: '/admin/daftar-proposal', label: 'Daftar Proposal', iconKey: 'file-text' },
    { href: '/admin/bantuan', label: 'Bantuan', iconKey: 'circle-help' },
  ],
  // brandTagline: 'E-Voting with blockchain system',
  brandTagline: '',
  headerLabel: 'Dashboard admin',
  searchPlaceholder: 'Cari data pemilihan...',
  profile: {
    name: 'Admin',
    wallet: 'Belum terhubung',
    editLabel: 'Sunting Profil',
    logoutLabel: 'Keluar Sesi',
  },
  footer: {
    copyright: '© 2026 VoteIn · Base Sepolia Testnet',
    links: [
      { label: 'Kebijakan Privasi', href: '/kebijakan-privasi' },
      { label: 'Ketentuan Layanan', href: '/ketentuan-layanan' },
    ],
  },
}

export const adminDashboardContent: AdminDashboardContent = {
  hero: {
    badge: 'Sistem e-voting aman',
    title: 'Kelola Pemilihan dengan Transparansi Blockchain',
    description:
      'Panel admin Votein untuk memantau fase Registration → Commit → Reveal → Ended, mengelola whitelist pemilih, dan menyiapkan bukti audit Basescan.',
    primaryCta: 'Buka Ruang Aktif',
    secondaryCta: 'Unduh Ringkasan',
  },
  section: {
    title: 'Manajemen Sistem',
    description: 'Pilih modul untuk mengelola siklus pemilihan organisasi mahasiswa secara aman.',
  },
  modules: [
    {
      key: 'beranda',
      title: 'Beranda',
      description: 'Pantau statistik utama, partisipasi pemilih, dan status ruang voting aktif dalam satu tampilan.',
    },
    {
      key: 'proposal',
      title: 'Proposal Saya',
      description: 'Lihat daftar proposal ruang voting yang diajukan untuk pemilihan internal organisasi.',
    },
    {
      key: 'fase',
      title: 'Manajemen Fase',
      description: 'Kontrol urutan Registration, Commit, Reveal, dan Ended tanpa melanggar guard keamanan commit-reveal.',
    },
    {
      key: 'kandidat',
      title: 'Kandidat',
      description: 'Kelola profil kandidat, visi singkat, dan identitas peserta yang akan tampil di halaman voting.',
    },
    {
      key: 'whitelist',
      title: 'Whitelist',
      description: 'Atur daftar wallet pemilih yang berhak commit dan reveal sesuai data resmi organisasi.',
    },
    {
      key: 'monitoring',
      title: 'Monitoring',
      description: 'Pantau commit, reveal, dan aktivitas transaksi agar mudah diverifikasi melalui Basescan.',
    },
    {
      key: 'hasil',
      title: 'Hasil',
      description: 'Lihat tabulasi akhir serta kesiapan bukti publik untuk evaluasi implementasi skripsi.',
    },
    {
      key: 'tambah',
      title: 'Tambah Pemilihan Baru',
      description: 'Mulai inisialisasi ruang voting baru untuk pemilihan ketua, koordinator, atau bendahara.',
      dark: true,
      cta: 'Inisialisasi',
    },
  ],
  activitySection: {
    title: 'Aktivitas Blockchain Terkini',
    statusLabel: '• Live node',
  },
  recentActivities: [
  ],
  metricCard: {
    label: 'Total suara masuk',
    value: '0',
    change: 'Menunggu data indexer',
    progressLabel: 'Belum ada hasil live',
    progressValue: '0%',
    progressWidthClassName: 'w-[0%]',
  },
}

const adminElectionManagementContent: AdminElectionManagementContent = {
  header: {
    title: 'Manajemen Pemilihan',
    description: 'Kelola dan pantau seluruh ruang pemilihan dari data Supabase.',
    primaryCta: 'Buat Pemilihan Baru',
  },
  filters: ['Semua', 'Aktif', 'Selesai', 'Draft'],
  sortLabel: 'Urutkan: Terbaru',
  elections: [
    {
      id: 'empty-active',
      iconKey: 'briefcase',
      iconClassName: 'bg-slate-100 text-slate-600',
      title: 'Belum ada pemilihan aktif',
      meta: 'Data aktif akan dimuat dari Supabase.',
      badge: 'Kosong',
      badgeClassName: 'bg-slate-100 text-slate-600',
      variant: 'active',
      voters: [],
      extraVotersLabel: '',
      stats: [
        { label: 'Total Commit', value: '0', subValue: ' / 0' },
        { label: 'Contract', value: 'Belum deploy', tone: 'info' },
        { label: 'Reveal Dibuka', value: '-' },
        { label: 'Integritas', value: 'Menunggu data', tone: 'success' },
      ],
      actions: [
        { label: 'Buka Supabase', style: 'primary-soft' },
        { label: 'Tambah Data', style: 'secondary-soft' },
      ],
    },
    {
      id: 'empty-draft',
      iconKey: 'document',
      iconClassName: 'bg-slate-100 text-slate-600',
      title: 'Belum ada draft',
      meta: 'Draft akan muncul setelah proposal dibuat di Supabase.',
      badge: 'Kosong',
      badgeClassName: 'bg-slate-100 text-slate-600',
      variant: 'draft',
      setupButton: 'Buat Proposal',
      progress: 0,
      progressLabel: '0% complete',
    },
    {
      id: 'empty-final-1',
      iconKey: 'shield',
      iconClassName: 'bg-slate-100 text-slate-600',
      title: 'Belum ada pemilihan selesai',
      meta: 'Hasil final akan muncul setelah fase ended dan indexer tersedia.',
      badge: 'Kosong',
      badgeClassName: 'bg-slate-100 text-slate-600',
      variant: 'final',
      reportButton: 'Belum tersedia',
    },
    {
      id: 'empty-final-2',
      iconKey: 'shield',
      iconClassName: 'bg-slate-100 text-slate-600',
      title: 'Belum ada laporan audit',
      meta: 'Laporan audit akan muncul setelah ada transaksi nyata.',
      badge: 'Kosong',
      badgeClassName: 'bg-slate-100 text-slate-600',
      variant: 'final',
      reportButton: 'Belum tersedia',
    },
  ],
  createCard: {
    title: 'Buat Ruang Pemilihan Baru',
    description: 'Konfigurasi ruang voting baru untuk kebutuhan internal organisasi.',
  },
}
