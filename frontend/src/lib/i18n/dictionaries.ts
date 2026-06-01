export const dictionaries = {
  'Bahasa Indonesia': {
    sidebar: {
      dashboard: 'Beranda',
      superadmin: 'Manajemen Superadmin',
      admin: 'Manajemen Admin',
      election: 'Manajemen Pemilihan',
      proposal: 'Manajemen Proposal',
      audit: 'Audit Log',
      voter: 'Data Master Voter',
      risk: 'Risk Activity',
      profile: 'Profil',
      help: 'Pusat Bantuan',
      voter_home: 'Beranda Pemilih',
      voter_elections: 'Pemilihan Aktif',
      voter_history: 'Riwayat Suara',
    },
    header: {
      search: 'Cari data...',
      logout: 'Keluar Sesi',
      connect_wallet: 'Hubungkan Dompet',
    },
    voter: {
      welcome: 'Selamat Datang di VoteIn',
      description: 'Gunakan hak suara Anda dengan aman melalui teknologi blockchain.',
      start_voting: 'Mulai Memilih',
    },
    profile: {
      title: 'Profil Pengguna',
      save: 'Simpan Perubahan',
      cancel: 'Batal',
    }
  },
  'English': {
    sidebar: {
      dashboard: 'Home',
      superadmin: 'Superadmin Management',
      admin: 'Admin Management',
      election: 'Election Management',
      proposal: 'Proposal Management',
      audit: 'Audit Log',
      voter: 'Voter Master Data',
      risk: 'Risk Activity',
      profile: 'Profile',
      help: 'Help Center',
      voter_home: 'Voter Dashboard',
      voter_elections: 'Active Elections',
      voter_history: 'Voting History',
    },
    header: {
      search: 'Search data...',
      logout: 'Logout Session',
      connect_wallet: 'Connect Wallet',
    },
    voter: {
      welcome: 'Welcome to VoteIn',
      description: 'Exercise your voting rights securely via blockchain technology.',
      start_voting: 'Start Voting',
    },
    profile: {
      title: 'User Profile',
      save: 'Save Changes',
      cancel: 'Cancel',
    }
  }
}

export type Locale = keyof typeof dictionaries
export type Dictionary = typeof dictionaries['Bahasa Indonesia']
