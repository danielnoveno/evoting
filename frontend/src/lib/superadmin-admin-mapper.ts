import type { AdminDirectoryRecord } from '@/lib/repositories/types'
import type { SuperadminAdminRecord, SuperadminStatus } from '@/lib/superadmin-data'

export function getAdminInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD'
}

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function mapDirectoryAdmin(record: AdminDirectoryRecord): SuperadminAdminRecord {
  const name = record.profile?.displayName?.trim()
    || record.displayName?.trim()
    || record.organizationName?.trim()
    || record.email.split('@')[0]
    || 'Admin'
  const isSuperAdmin = record.role === 'super_admin'
  const status: SuperadminStatus = record.registryStatus === 'inactive'
    ? 'Nonaktif'
    : record.profile || record.registryStatus === 'active'
      ? 'Aktif'
      : 'Menunggu'
  const accessLabel = isSuperAdmin ? 'Super Admin' : 'Admin Organisasi'
  const accessDetail = record.description
    ?? (isSuperAdmin ? 'Akses Platform' : 'Pemilihan sendiri')

  // ponytail: access is automatic — admin only sees proposals they created.
  // No manual space assignment needed.
  const finalSpaces = isSuperAdmin
    ? [{ id: 'superadmin', title: 'Akses Penuh', subtitle: 'Superadmin dapat mengakses seluruh pemilihan', role: 'Super Admin' }]
    : [{ id: record.email, title: record.organizationName || 'Admin Organisasi', subtitle: 'Hanya mengelola pemilihan sendiri', role: accessLabel }]

  return {
    id: record.email,
    initials: getAdminInitials(name),
    name,
    email: record.email,
    accessLabel,
    accessDetail,
    status,
    lastSeen: record.profile ? formatAdminDate(record.profile.updatedAt) : '-',
    lastIp: '-',
    joinedAt: formatAdminDate(record.createdAt),
    lastLoginText: record.profile ? 'Profil aktif' : record.registryStatus === 'inactive' ? 'Akses dinonaktifkan' : 'Menunggu aktivasi',
    lastLoginRelative: record.profile ? 'Wallet sudah tertaut ke akun ini' : 'Email sudah didaftarkan super admin',
    blockchainIdentity: record.walletAddress ?? record.profile?.walletAddress ?? 'Wallet belum ditautkan',
    spaces: finalSpaces,
    recentActivity: [],
  }
}
