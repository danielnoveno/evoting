import { sharedContext } from '@/lib/shared-context'

export type AdminModuleKey =
  | 'beranda'
  | 'proposal'
  | 'fase'
  | 'kandidat'
  | 'whitelist'
  | 'monitoring'
  | 'hasil'
  | 'tambah'

export type ElectionVariant = 'active' | 'draft' | 'final'

export type ElectionIconKey = 'briefcase' | 'document' | 'shield'

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
    name: sharedContext.organizationShort,
    wallet: '0x71C...4f21',
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
      `Panel admin VoteChain untuk ${sharedContext.organization}. Pantau fase Registration → Commit → Reveal → Ended, kelola whitelist pemilih, dan siapkan bukti audit Basescan untuk kebutuhan skripsi.`,
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
      description: `Lihat daftar proposal ruang voting yang diajukan untuk pemilihan internal ${sharedContext.organizationShort} dan kepengurusan unitnya.`,
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
      {
        block: '#48,291,012',
        text: `0x8f2a...d3e1 mengirim commit untuk ${sharedContext.proposalTitle}.`,
        time: '2 detik lalu',
        status: 'Sukses',
    },
    {
      block: '#48,290,998',
      text: `${sharedContext.organizationShort} menambahkan 120 wallet ke whitelist pemilih Base Sepolia.`,
      time: '12 menit lalu',
      status: 'Sukses',
    },
  ],
  metricCard: {
    label: 'Total suara masuk',
    value: '218',
    change: `+12% dari target minimum partisipasi (${sharedContext.voterEstimate})`,
    progressLabel: 'Kuorum Tercapai',
    progressValue: '67%',
    progressWidthClassName: 'w-[67%]',
  },
}

export const adminElectionManagementContent: AdminElectionManagementContent = {
  header: {
    title: 'Manajemen Pemilihan',
    description: `Kelola dan pantau seluruh ruang pemilihan ${sharedContext.organizationShort}`,
    primaryCta: 'Buat Pemilihan Baru',
  },
  filters: ['Semua', 'Aktif', 'Selesai', 'Draft'],
  sortLabel: 'Urutkan: Terbaru',
  elections: [
    {
      id: sharedContext.electionId,
      iconKey: 'briefcase',
      iconClassName: 'bg-emerald-50 text-emerald-700',
      title: sharedContext.proposalTitle,
      meta: `Commit dibuka 12–18 Juni 2026 • ${sharedContext.voterEstimate} pemilih terdaftar`,
      badge: 'Fase Aktif: Commit',
      badgeClassName: 'bg-emerald-100 text-emerald-700',
      variant: 'active',
      voters: ['NP', 'RM', 'SW'],
        extraVotersLabel: '+18',
        stats: [
        { label: 'Total Commit', value: '218', subValue: ` / ${sharedContext.voterEstimate}` },
        { label: 'Contract', value: '0x71c...a3e4', tone: 'info' },
        { label: 'Reveal Dibuka', value: '19 Juni 2026, 09.00' },
        { label: 'Integritas', value: 'Whitelist Aktif', tone: 'success' },
      ],
      actions: [
        { label: 'Monitor Fase', style: 'primary-soft' },
        { label: 'Kandidat', style: 'secondary-soft' },
      ],
    },
    {
      id: 'bendahara-ukm-riset-2026',
      iconKey: 'document',
      iconClassName: 'bg-orange-50 text-orange-600',
      title: 'Pemilihan Bendahara UKM Riset 2026',
      meta: 'Draft • Kandidat belum final • Menunggu unggah whitelist',
      badge: 'Status: Draft',
      badgeClassName: 'bg-orange-50 text-orange-600',
      variant: 'draft',
      setupButton: 'Edit Setup',
      progress: 40,
      progressLabel: '40% complete',
    },
    {
      id: 'sekretaris-ukm-riset-2025',
      iconKey: 'shield',
      iconClassName: 'bg-blue-50 text-blue-600',
      title: 'Pemilihan Sekretaris UKM Riset 2025',
      meta: 'Selesai 11 Mei 2026 • Partisipasi 91% • Bukti siap audit',
      badge: 'Final',
      badgeClassName: 'bg-blue-50 text-blue-600',
      variant: 'final',
      reportButton: 'Lihat Laporan',
    },
    {
      id: 'ketua-divisi-acara-ukm-riset-2025',
      iconKey: 'shield',
      iconClassName: 'bg-blue-50 text-blue-600',
      title: 'Pemilihan Ketua Divisi Acara UKM Riset 2025',
      meta: 'Selesai 20 Sep 2025 • 52 suara valid • Reveal 100% berhasil',
      badge: 'Final',
      badgeClassName: 'bg-blue-50 text-blue-600',
      variant: 'final',
      reportButton: 'Lihat Laporan',
    },
  ],
  createCard: {
    title: 'Buat Ruang Pemilihan Baru',
    description: `Konfigurasi ruang voting baru untuk kebutuhan internal ${sharedContext.organizationShort} dalam hitungan menit.`,
  },
}
