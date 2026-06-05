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
    ?? (isSuperAdmin ? 'Akses Platform' : record.accessScope === 'all' ? 'Semua Pemilihan' : 'Pemilihan Tertentu')

  // Map assigned spaces from database if available
  const mappedSpaces = record.assignedSpaces?.map(access => ({
    id: access.proposalDraftId,
    title: access.proposalTitle || 'Pemilihan Terbatas',
    subtitle: 'Akses pengelolaan pemilihan spesifik',
    role: accessLabel
  })) || []

  // If scope is 'all' or no specific assignments, use the default organization-based display
  const finalSpaces = record.accessScope === 'all' || mappedSpaces.length === 0
    ? (record.organizationName ? [{ id: record.organizationName, title: record.organizationName, subtitle: record.accessScope === 'all' ? 'Akses semua ruang pemilihan organisasi' : 'Belum ada ruang pemilihan spesifik ditugaskan', role: accessLabel }] : [])
    : mappedSpaces

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
