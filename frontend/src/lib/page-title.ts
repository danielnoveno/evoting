function normalizePath(pathname: string): string {
  if (!pathname) return '/'
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function getPageTitle(pathname: string): string {
  const path = normalizePath(pathname)

  const exactTitles: Record<string, string> = {
    '/': 'Beranda',
    '/beranda': 'Beranda',
    '/cara-kerja': 'Cara Kerja',
    '/pemilihan': 'Daftar Pemilihan',
    '/login': 'Login',
    '/login/email': 'Login Email',
    '/login/google': 'Login Google',
    '/login/metamask': 'Login MetaMask',
    '/login/smart-wallet': 'Login Smart Wallet',
    '/space/create': 'Buat Space',
    '/superadmin/beranda': 'Beranda Superadmin',
    '/admin/beranda': 'Beranda Admin',
    '/admin/manajemen-pemilihan': 'Manajemen Pemilihan',
    '/admin/daftar-proposal': 'Daftar Proposal',
    '/admin/bantuan': 'Bantuan Admin',
    '/voter': 'Beranda Pemilih',
    '/voter/beranda': 'Beranda Pemilih',
    '/voter/bukti': 'Bukti Saya',
    '/voter/bukti/riwayat': 'Riwayat Bukti',
    '/voter/bantuan': 'Bantuan',
    '/voter/profil/sunting': 'Sunting Profil',
    '/voter/setingg': 'Sunting Profil',
    '/voter/voting/commit': 'Voting - Commit',
    '/voter/voting/commit/sukses': 'Voting - Konfirmasi',
    '/voter/voting/konfirmasi': 'Voting - Konfirmasi',
    '/voter/voting/reveal': 'Voting - Reveal',
    '/voter/voting/result': 'Voting - Hasil',
    '/voter/konfirmasi/reveal': 'Voting - Reveal',
  }

  if (exactTitles[path]) {
    return `Votein - ${exactTitles[path]}`
  }

  if (/^\/pemilihan\/[^/]+\/hasil$/.test(path)) {
    return 'Votein - Hasil Pemilihan'
  }

  if (/^\/space\/[^/]+\/admin$/.test(path)) {
    return 'Votein - Beranda Admin'
  }

  if (/^\/space\/[^/]+\/vote$/.test(path)) {
    return 'Votein - Voting Commit'
  }

  if (/^\/space\/[^/]+\/reveal$/.test(path)) {
    return 'Votein - Konfirmasi Reveal'
  }

  if (/^\/space\/[^/]+\/results$/.test(path)) {
    return 'Votein - Hasil Voting'
  }

  if (/^\/voter\/bukti\/[^/]+$/.test(path)) {
    return 'Votein - Detail Bukti'
  }

  return 'Votein'
}
