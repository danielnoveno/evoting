'use client'

import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import type { AdminDirectoryRecord, AdminRegistryInput, AdminRegistryRecord, AppProfileRecord, ProfileUpsertInput } from '@/lib/repositories/types'
import { RepositoryError } from '@/lib/repositories/errors'

type ProfileRow = Database['app']['Tables']['app_profiles']['Row']
type AdminRegistryRow = Database['app']['Tables']['admin_registry']['Row']
type SupabaseErrorLike = {
  code?: string
  message?: string
  details?: string
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getSupabaseErrorLike(error: unknown): SupabaseErrorLike {
  if (!isObjectRecord(error)) return {}
  return {
    code: typeof error.code === 'string' ? error.code : undefined,
    message: typeof error.message === 'string' ? error.message : undefined,
    details: typeof error.details === 'string' ? error.details : undefined,
  }
}

function isUniqueConstraintError(error: unknown, fieldName: string): boolean {
  const { code, message, details } = getSupabaseErrorLike(error)
  const joined = `${message ?? ''} ${details ?? ''}`.toLowerCase()
  return code === '23505' && joined.includes(fieldName.toLowerCase())
}

function sameWalletAddress(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function mapProfileRow(row: ProfileRow): AppProfileRecord {
  return {
    id: row.id,
    userId: row.user_id,
    walletAddress: row.wallet_address,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    roleHint: row.role_hint,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAdminRegistryRow(row: AdminRegistryRow): AdminRegistryRecord {
  return {
    email: row.email,
    assignedRole: row.assigned_role,
    displayName: row.display_name,
    organizationName: row.organization_name,
    accessScope: row.access_scope,
    status: row.status,
    description: row.description,
    walletAddress: row.wallet_address,
    activationExpiresAt: row.activation_expires_at,
    activationAcceptedAt: row.activation_accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getRegisteredAdminAccessForEmail(email: string | null | undefined): Promise<AdminRegistryRow | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const normalizedEmail = normalizeEmail(email ?? '')
  if (!normalizedEmail) return null

  const { data, error } = await client
    .schema('app')
    .from('admin_registry')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memeriksa undangan role admin. Coba lagi.')
  if (!data || data.status === 'inactive') return null
  if (data.assigned_role === 'super_admin' && data.status !== 'active') return null

  return data
}

async function requireUser(): Promise<User> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new RepositoryError('Sesi kamu belum aktif untuk memuat profil.')

  return data.user
}

export async function getCurrentProfile(): Promise<AppProfileRecord | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const user = await requireUser()
  const { data, error } = await client
    .schema('app')
    .from('app_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memuat profil. Coba lagi.')
  return data ? mapProfileRow(data) : null
}

async function getCurrentProfileId(): Promise<string | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const user = await requireUser()
  const { data, error } = await client
    .schema('app')
    .from('app_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memuat profil super admin. Coba lagi.')
  return data?.id ?? null
}

export async function getCurrentProfileRole(): Promise<AppProfileRecord['role'] | null> {
  const profile = await getCurrentProfile()
  return profile?.role ?? null
}

export async function getProfileByWalletAddress(walletAddress: string): Promise<AppProfileRecord | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const normalizedWallet = walletAddress.trim()
  if (!normalizedWallet) return null

  const { data, error } = await client
    .schema('app')
    .from('app_profiles')
    .select('*')
    .ilike('wallet_address', normalizedWallet)
    .limit(1)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memuat profil. Coba lagi.')
  return data ? mapProfileRow(data) : null
}

export async function upsertCurrentProfile(input: ProfileUpsertInput): Promise<AppProfileRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const user = await requireUser()
  const currentProfile = await getCurrentProfile()
  const registeredAccess = await getRegisteredAdminAccessForEmail(input.email ?? user.email ?? null)
  if (registeredAccess?.wallet_address && !sameWalletAddress(registeredAccess.wallet_address, input.walletAddress)) {
    throw new RepositoryError('Wallet tersambung tidak sesuai dengan wallet yang didaftarkan pada undangan admin.')
  }

  const assignedRole = registeredAccess?.assigned_role ?? 'voter'
  const nextRole = currentProfile?.role === 'super_admin' && assignedRole === 'voter' ? 'super_admin' : assignedRole
  const payload: Database['app']['Tables']['app_profiles']['Insert'] = {
    user_id: user.id,
    wallet_address: input.walletAddress,
    display_name: input.displayName ?? null,
    email: input.email ?? user.email ?? null,
    role: nextRole,
    avatar_url: input.avatarUrl ?? null,
    role_hint: input.roleHint ?? null,
  }

  const { data, error } = await client
    .schema('app')
    .from('app_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw new RepositoryError('Gagal menyimpan profil. Coba lagi.')
  return mapProfileRow(data)
}

export async function bindCurrentUserWallet(input: ProfileUpsertInput): Promise<AppProfileRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const normalizedWallet = input.walletAddress.trim()
  if (!normalizedWallet) throw new RepositoryError('Wallet belum terhubung.')

  const user = await requireUser()

  const { data: currentProfile, error: currentProfileError } = await client
    .schema('app')
    .from('app_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (currentProfileError) throw new RepositoryError('Gagal memuat profil akun kampus. Coba lagi.')

  if (currentProfile && !sameWalletAddress(currentProfile.wallet_address, normalizedWallet)) {
    throw new RepositoryError('Akun kampus ini sudah tertaut ke wallet lain. Putuskan dompet tersambung, lalu sambungkan wallet yang sesuai.')
  }

  const { data: existingWalletOwner, error: ownerError } = await client
    .schema('app')
    .from('app_profiles')
    .select('*')
    .ilike('wallet_address', normalizedWallet)
    .limit(1)
    .maybeSingle()

  if (ownerError) throw new RepositoryError('Gagal memeriksa kepemilikan wallet. Coba lagi.')

  if (existingWalletOwner && existingWalletOwner.user_id !== user.id) {
    const ownerEmail = existingWalletOwner.email ? ` (${existingWalletOwner.email})` : ''
    throw new RepositoryError(`Wallet ini sudah ditautkan ke akun kampus lain${ownerEmail}. Putuskan dompet tersambung, lalu sambungkan wallet yang sesuai.`)
  }

  const registeredAccess = await getRegisteredAdminAccessForEmail(input.email ?? user.email ?? null)
  if (registeredAccess?.wallet_address && !sameWalletAddress(registeredAccess.wallet_address, input.walletAddress)) {
    throw new RepositoryError('Wallet tersambung tidak sesuai dengan wallet yang didaftarkan pada undangan admin.')
  }

  const assignedRole = registeredAccess?.assigned_role ?? 'voter'
  const nextRole = currentProfile?.role === 'super_admin' && assignedRole === 'voter' ? 'super_admin' : assignedRole

  const payload: Database['app']['Tables']['app_profiles']['Insert'] = {
    user_id: user.id,
    wallet_address: normalizedWallet,
    display_name: input.displayName ?? currentProfile?.display_name ?? null,
    email: input.email ?? currentProfile?.email ?? user.email ?? null,
    role: nextRole,
    avatar_url: input.avatarUrl ?? currentProfile?.avatar_url ?? null,
    role_hint: input.roleHint ?? currentProfile?.role_hint ?? 'microsoft-bound-wallet',
  }

  const { data, error } = await client
    .schema('app')
    .from('app_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    if (isUniqueConstraintError(error, 'wallet_address')) {
      throw new RepositoryError('Wallet ini sudah tercatat untuk akun kampus lain. Ganti wallet atau masuk dengan akun kampus yang sesuai.')
    }

    throw new RepositoryError('Gagal menautkan wallet ke akun kampus. Coba lagi.')
  }
  return mapProfileRow(data)
}

export async function resolveRegisteredRoleForEmail(email: string | null | undefined): Promise<AppProfileRecord['role']> {
  const registeredAccess = await getRegisteredAdminAccessForEmail(email)
  return registeredAccess?.assigned_role ?? 'voter'
}

export async function listProfilesByRole(role: AppProfileRecord['role']): Promise<AppProfileRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('app_profiles')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat daftar profil. Coba lagi.')
  return data.map(mapProfileRow)
}

export async function listAdminDirectory(): Promise<AdminDirectoryRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const [profilesResult, registryResult] = await Promise.all([
    client
      .schema('app')
      .from('app_profiles')
      .select('*')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false }),
    client
      .schema('app')
      .from('admin_registry')
      .select('*')
      .in('assigned_role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false }),
  ])

  if (profilesResult.error) throw new RepositoryError('Gagal memuat profil admin. Coba lagi.')
  if (registryResult.error) throw new RepositoryError('Gagal memuat registry admin. Coba lagi.')

  const registryByEmail = new Map<string, AdminRegistryRow>()
  registryResult.data.forEach((row) => {
    registryByEmail.set(row.email.toLowerCase(), row)
  })

  const directoryByEmail = new Map<string, AdminDirectoryRecord>()

  profilesResult.data.forEach((row) => {
    const profile = mapProfileRow(row)
    const email = profile.email?.trim() || profile.walletAddress
    const registry = profile.email ? registryByEmail.get(profile.email.toLowerCase()) : undefined

    directoryByEmail.set(email.toLowerCase(), {
      email,
      role: profile.role === 'super_admin' ? 'super_admin' : 'admin',
      displayName: registry?.display_name ?? profile.displayName,
      organizationName: registry?.organization_name ?? null,
      accessScope: registry?.access_scope ?? 'all',
      registryStatus: registry?.status ?? null,
      description: registry?.description ?? null,
      walletAddress: registry?.wallet_address ?? profile.walletAddress,
      createdAt: registry?.created_at ?? profile.createdAt,
      updatedAt: registry?.updated_at ?? profile.updatedAt,
      profile,
    })
  })

  registryResult.data.forEach((row) => {
    const key = row.email.toLowerCase()
    if (directoryByEmail.has(key)) return
    if (row.assigned_role !== 'admin' && row.assigned_role !== 'super_admin') return

    directoryByEmail.set(key, {
      email: row.email,
      role: row.assigned_role,
      displayName: row.display_name,
      organizationName: row.organization_name,
      accessScope: row.access_scope,
      registryStatus: row.status,
      description: row.description,
      walletAddress: row.wallet_address,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      profile: null,
    })
  })

  return Array.from(directoryByEmail.values()).sort((left, right) => {
    const leftTime = left.profile?.createdAt ?? left.createdAt ?? ''
    const rightTime = right.profile?.createdAt ?? right.createdAt ?? ''
    return rightTime.localeCompare(leftTime)
  })
}

async function syncProfileRoleForEmail(email: string, role: AppProfileRecord['role'], displayName?: string | null) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const payload: Database['app']['Tables']['app_profiles']['Update'] = {
    role,
  }

  if (displayName !== undefined) {
    payload.display_name = displayName
  }

  const { error } = await client
    .schema('app')
    .from('app_profiles')
    .update(payload)
    .ilike('email', email)

  if (error) throw new RepositoryError('Gagal menyinkronkan role profil admin. Coba lagi.')
}

export async function createAdminRegistry(input: AdminRegistryInput): Promise<AdminRegistryRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const email = normalizeEmail(input.email)
  if (!email) throw new RepositoryError('Email admin wajib diisi.')

  const actorProfileId = await getCurrentProfileId()
  const payload: Database['app']['Tables']['admin_registry']['Insert'] = {
    email,
    assigned_role: 'admin',
    display_name: input.displayName?.trim() || null,
    organization_name: input.organizationName?.trim() || null,
    access_scope: input.accessScope ?? 'all',
    status: input.status ?? 'pending',
    description: input.description?.trim() || null,
    wallet_address: input.walletAddress?.trim() || null,
    created_by: actorProfileId,
    updated_by: actorProfileId,
  }

  const { data, error } = await client
    .schema('app')
    .from('admin_registry')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    if (isUniqueConstraintError(error, 'email')) {
      throw new RepositoryError('Email ini sudah terdaftar sebagai admin organisasi.')
    }
    throw new RepositoryError('Gagal menambahkan admin organisasi. Coba lagi.')
  }

  if (payload.status !== 'inactive') {
    await syncProfileRoleForEmail(email, 'admin', payload.display_name)
  }

  return mapAdminRegistryRow(data)
}

export async function updateAdminRegistry(currentEmail: string, input: AdminRegistryInput): Promise<AdminRegistryRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const oldEmail = normalizeEmail(currentEmail)
  const nextEmail = normalizeEmail(input.email)
  if (!oldEmail || !nextEmail) throw new RepositoryError('Email admin wajib diisi.')

  const actorProfileId = await getCurrentProfileId()
  const payload: Database['app']['Tables']['admin_registry']['Update'] = {
    email: nextEmail,
    assigned_role: 'admin',
    display_name: input.displayName?.trim() || null,
    organization_name: input.organizationName?.trim() || null,
    access_scope: input.accessScope ?? 'all',
    status: input.status ?? 'pending',
    description: input.description?.trim() || null,
    wallet_address: input.walletAddress?.trim() || null,
    updated_by: actorProfileId,
  }

  const { data, error } = await client
    .schema('app')
    .from('admin_registry')
    .update(payload)
    .eq('email', oldEmail)
    .select('*')
    .single()

  if (error) throw new RepositoryError('Gagal memperbarui admin organisasi. Coba lagi.')

  if (oldEmail !== nextEmail) {
    await syncProfileRoleForEmail(oldEmail, 'voter')
  }

  await syncProfileRoleForEmail(nextEmail, payload.status === 'inactive' ? 'voter' : 'admin', payload.display_name)

  return mapAdminRegistryRow(data)
}

export async function deleteAdminRegistry(email: string): Promise<void> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) throw new RepositoryError('Email admin wajib diisi.')

  const { error } = await client
    .schema('app')
    .from('admin_registry')
    .delete()
    .eq('email', normalizedEmail)

  if (error) throw new RepositoryError('Gagal menghapus admin organisasi. Coba lagi.')

  await syncProfileRoleForEmail(normalizedEmail, 'voter')
}

export async function updateDirectoryRegistryStatus(email: string, status: 'pending' | 'active' | 'inactive'): Promise<void> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) throw new RepositoryError('Email akses wajib diisi.')

  const { data: current, error: fetchError } = await client
    .schema('app')
    .from('admin_registry')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (fetchError) throw new RepositoryError('Gagal memuat registry akses. Coba lagi.')
  if (!current) throw new RepositoryError('Registry akses tidak ditemukan untuk email ini.')

  const actorProfileId = await getCurrentProfileId()
  const payload: Database['app']['Tables']['admin_registry']['Update'] = {
    status,
    updated_by: actorProfileId,
  }

  const { error } = await client
    .schema('app')
    .from('admin_registry')
    .update(payload)
    .eq('email', normalizedEmail)

  if (error) throw new RepositoryError('Gagal memperbarui status akses. Coba lagi.')

  const nextRole = status === 'inactive' ? 'voter' : current.assigned_role
  await syncProfileRoleForEmail(normalizedEmail, nextRole, current.display_name)
}
