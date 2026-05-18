'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const DEFAULT_TITLE = 'Votein - E-Voting Organisasi Mahasiswa'

function resolveTitle(pathname: string) {
  if (pathname === '/') return 'Votein - Beranda'
  if (pathname === '/hubungkan-dompet') return 'Votein - Login'
  if (pathname === '/cara-kerja') return 'Votein - Cara Kerja'
  if (pathname === '/pemilihan') return 'Votein - Daftar Pemilihan'

  if (pathname === '/admin') return 'Votein - Dashboard Admin'
  if (pathname.startsWith('/admin/manajemen-pemilihan')) return 'Votein - Manajemen Pemilihan Admin'
  if (pathname.startsWith('/admin/daftar-proposal')) return 'Votein - Daftar Proposal Admin'
  if (pathname === '/admin/bantuan') return 'Votein - Bantuan Admin'
  if (pathname === '/admin/profil') return 'Votein - Profil Admin'

  if (pathname === '/superadmin') return 'Votein - Dashboard Superadmin'
  if (pathname.startsWith('/superadmin/manajemen-admin')) return 'Votein - Manajemen Admin Superadmin'
  if (pathname.startsWith('/superadmin/manajemen-pemilihan')) return 'Votein - Manajemen Pemilihan Superadmin'
  if (pathname.startsWith('/superadmin/manajemen-proposal')) return 'Votein - Manajemen Proposal Superadmin'
  if (pathname === '/superadmin/risk-activity') return 'Votein - Risk Activity Superadmin'
  if (pathname === '/superadmin/pengaturan-platform') return 'Votein - Pengaturan Platform Superadmin'
  if (pathname === '/superadmin/audit-log') return 'Votein - Audit Log Superadmin'

  if (pathname === '/pemilih') return 'Votein - Dashboard Pemilih'
  if (pathname === '/pemilih/bantuan') return 'Votein - Bantuan Pemilih'
  if (pathname === '/pemilih/bukti-saya') return 'Votein - Bukti Saya'
  if (pathname === '/pemilih/profil') return 'Votein - Profil Pemilih'
  if (pathname.includes('/commit')) return 'Votein - Commit Suara'
  if (pathname.includes('/konfirmasi')) return 'Votein - Konfirmasi Suara'
  if (pathname.includes('/reveal')) return 'Votein - Reveal Suara'
  if (pathname.includes('/hasil')) return 'Votein - Hasil Pemilihan'

  return DEFAULT_TITLE
}

export function DynamicPageTitle() {
  const pathname = usePathname()

  useEffect(() => {
    document.title = resolveTitle(pathname)
  }, [pathname])

  return null
}
