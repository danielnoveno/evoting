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
    },
    header: {
      search: 'Cari data...',
      logout: 'Keluar Sesi',
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
    },
    header: {
      search: 'Search data...',
      logout: 'Logout Session',
    },
    profile: {
      title: 'User Profile',
      save: 'Save Changes',
      cancel: 'Cancel',
    }
  }
} as const

export type Locale = keyof typeof dictionaries
export type Dictionary = typeof dictionaries['Bahasa Indonesia']
