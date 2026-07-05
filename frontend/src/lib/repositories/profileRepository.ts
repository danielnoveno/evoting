'use client'

import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import type { AdminDirectoryRecord, AdminRegistryInput, AdminRegistryRecord, AppProfileRecord, AppRole, CurrentAdminRegistryStatus, ProfileUpsertInput } from '@/lib/repositories/types'
import { RepositoryError } from '@/lib/repositories/errors'
import { clearLocalAuthSession, isInvalidStoredSession, sameWalletAddress } from './helpers'

type ProfileRow = Database['app']['Tables']['app_profiles']['Row']
type AdminRegistryRow = Database['app']['Tables']['admin_registry']['Row']
type SupabaseErrorLike = {
  code?: string
  status?: number
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
    status: typeof error.status === 'number' ? error.status : undefined,
    message: typeof error.message === 'string' ? error.message : undefined,
    details: typeof error.details === 'string' ? error.details : undefined,
  }
}

function isUniqueConstraintError(error: unknown, fieldName: string): boolean {
  const { code, message, details } = getSupabaseErrorLike(error)
  const joined = `${message ?? ''} ${details ?? ''}`.toLowerCase()
  return code === '23505' && joined.includes(fieldName.toLowerCase())
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function firstNonEmptyText(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }

  return null
}

function getVerifiedProfileEmail(user: User, currentProfile: { email: string | null } | null | undefined, fallbackEmail: string | null | undefined): string | null {
  const email = firstNonEmptyText(user.email, currentProfile?.email, fallbackEmail)
  return email ? normalizeEmail(email) : null
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
  if ((data.assigned_role === 'admin' || data.assigned_role === 'super_admin') && data.status !== 'active') {
    throw new RepositoryError('Undangan admin organisasi belum aktif. Minta super admin mengirim/menyetujui aktivasi sebelum login sebagai admin.')
  }

  return data
}

async function claimActivationToken(input: ProfileUpsertInput, role: 'voter' | 'admin' | 'super_admin' = 'voter') {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const activationToken = input.activationToken?.trim()
  if (!activationToken) throw new RepositoryError('Token aktivasi tidak ditemukan. Gunakan link aktivasi terbaru dari admin.')

  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.access_token) throw new RepositoryError('Sesi login belum aktif. Silakan masuk ulang dari link aktivasi.')

  const response = await fetch('/api/activation-tokens/claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({
      token: activationToken,
      walletAddress: input.walletAddress,
      role,
    }),
  })

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message = isObjectRecord(payload) && typeof payload.error === 'string'
      ? payload.error
      : 'Token aktivasi tidak valid atau sudah kedaluwarsa.'
    throw new RepositoryError(message)
  }
}

async function claimAdminInviteWithWallet(input: ProfileUpsertInput) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const activationToken = input.activationToken?.trim()
  if (!activationToken) throw new RepositoryError('Token aktivasi admin tidak ditemukan. Gunakan link undangan terbaru dari superadmin.')

  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.access_token) throw new RepositoryError('Sesi login admin belum aktif. Silakan masuk ulang dari link aktivasi.')

  const response = await fetch('/api/admin-invites/claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({
      token: activationToken,
      walletAddress: input.walletAddress,
    }),
  })

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message = isObjectRecord(payload) && typeof payload.error === 'string'
      ? payload.error
      : 'Aktivasi admin tidak valid atau sudah kedaluwarsa.'
    throw new RepositoryError(message)
  }
}

async function requireUser(): Promise<User> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    if (error && isInvalidStoredSession(error)) {
      await clearLocalAuthSession()
      throw new RepositoryError('Sesi login lama sudah tidak valid. Silakan masuk ulang dengan akun yang aktif.')
    }

    throw new RepositoryError('Sesi kamu belum aktif untuk memuat profil.')
  }

  return data.user
}

export async function getCurrentProfile(): Promise<AppProfileRecord | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  // Check if session exists in storage first to avoid unnecessary getUser() calls and 403 logs for guest users
  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session) return null

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

export async function getCurrentAdminRegistryStatus(): Promise<CurrentAdminRegistryStatus | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const currentProfile = await getCurrentProfile()
  const email = normalizeEmail(currentProfile?.email ?? '')
  if (!email || currentProfile?.role !== 'admin') return null

  const { data: registry, error } = await client
    .schema('app')
    .from('admin_registry')
    .select('email,status,updated_by')
    .eq('email', email)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memeriksa status akses admin. Coba lagi.')
  if (!registry) return null

  let updatedByEmail: string | null = null
  let updatedByName: string | null = null

  if (registry.updated_by) {
    const { data: updater } = await client
      .schema('app')
      .from('app_profiles')
      .select('email,display_name')
      .eq('id', registry.updated_by)
      .maybeSingle()

    updatedByEmail = updater?.email ?? null
    updatedByName = updater?.display_name ?? null
  }

  return {
    email: registry.email,
    status: registry.status,
    updatedByEmail,
    updatedByName,
  }
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

// ponytail: cek admin_registry langsung by wallet_address — admin mungkin belum punya app_profiles
export async function getAdminRegistryByWalletAddress(walletAddress: string): Promise<{ role: AppRole; organizationName: string | null } | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const normalizedWallet = walletAddress.trim()
  if (!normalizedWallet) return null

  const { data, error } = await client
    .schema('app')
    .from('admin_registry')
    .select('assigned_role, organization_name, status')
    .ilike('wallet_address', normalizedWallet)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) return null
  if (!data) return null

  return {
    role: data.assigned_role as AppRole,
    organizationName: data.organization_name,
  }
}

export async function upsertCurrentProfile(input: ProfileUpsertInput): Promise<AppProfileRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const user = await requireUser()
  const currentProfile = await getCurrentProfile()
  const profileEmail = getVerifiedProfileEmail(user, currentProfile, input.email)
  const registeredAccess = await getRegisteredAdminAccessForEmail(profileEmail)
  if (!currentProfile && !registeredAccess && input.roleHint === 'voter-activation') {
    await claimActivationToken(input, 'voter')
  } else if (!currentProfile && !registeredAccess) {
    throw new RepositoryError('Akun belum diaktivasi. Gunakan tautan aktivasi dari admin sebelum menghubungkan wallet.')
  }
  if (registeredAccess?.wallet_address && !sameWalletAddress(registeredAccess.wallet_address, input.walletAddress)) {
    throw new RepositoryError('Wallet tersambung tidak sesuai dengan wallet yang didaftarkan pada undangan admin.')
  }

  const assignedRole = registeredAccess?.assigned_role ?? 'voter'
  const nextRole = currentProfile?.role === 'super_admin' && assignedRole === 'voter' ? 'super_admin' : assignedRole
  const payload: Database['app']['Tables']['app_profiles']['Insert'] = {
    user_id: user.id,
    wallet_address: input.walletAddress,
    display_name: input.displayName ?? null,
    email: profileEmail,
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

  const profileEmail = getVerifiedProfileEmail(user, currentProfile, input.email)
  const isAdminActivation = input.roleHint === 'admin-activation'
  const activationToken = input.activationToken?.trim()
  if (isAdminActivation && activationToken) {
    await claimAdminInviteWithWallet({ ...input, walletAddress: normalizedWallet })
  }

  const registeredAccess = await getRegisteredAdminAccessForEmail(profileEmail)
  if (!currentProfile && !registeredAccess && input.roleHint === 'voter-activation') {
    await claimActivationToken(input, 'voter')
  } else if (!currentProfile && !registeredAccess) {
    throw new RepositoryError('Akun belum diaktivasi. Gunakan tautan aktivasi dari admin sebelum menghubungkan wallet.')
  }
  if (registeredAccess?.wallet_address && !sameWalletAddress(registeredAccess.wallet_address, input.walletAddress)) {
    throw new RepositoryError('Wallet tersambung tidak sesuai dengan wallet yang didaftarkan pada undangan admin.')
  }

  const assignedRole = registeredAccess?.assigned_role ?? 'voter'
  const nextRole = currentProfile?.role === 'super_admin' && assignedRole === 'voter' ? 'super_admin' : assignedRole

  const payload: Database['app']['Tables']['app_profiles']['Insert'] = {
    user_id: user.id,
    wallet_address: normalizedWallet,
    display_name: input.displayName ?? currentProfile?.display_name ?? null,
    email: profileEmail,
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
    const lowerEmail = email.toLowerCase()
    const registry = profile.email ? registryByEmail.get(lowerEmail) : undefined

    directoryByEmail.set(lowerEmail, {
      email,
      role: profile.role === 'super_admin' ? 'super_admin' : 'admin',
      displayName: firstNonEmptyText(profile.displayName, registry?.organization_name, email.split('@')[0]),
      organizationName: registry?.organization_name ?? null,
      accessScope: registry?.access_scope ?? 'specific',
      registryStatus: registry?.status ?? null,
      description: registry?.description ?? null,
      walletAddress: firstNonEmptyText(profile.walletAddress, registry?.wallet_address),
      activationExpiresAt: registry?.activation_expires_at ?? null,
      activationAcceptedAt: registry?.activation_accepted_at ?? null,
      createdAt: profile.createdAt ?? registry?.created_at ?? '',
      updatedAt: profile.updatedAt ?? registry?.updated_at ?? null,
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
      displayName: row.organization_name,
      organizationName: row.organization_name,
      accessScope: row.access_scope,
      registryStatus: row.status,
      description: row.description,
      walletAddress: row.wallet_address,
      activationExpiresAt: row.activation_expires_at,
      activationAcceptedAt: row.activation_accepted_at,
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
  const displayName = input.displayName?.trim() || input.organizationName?.trim() || null
  const payload: Database['app']['Tables']['admin_registry']['Insert'] = {
    email,
    assigned_role: 'admin',
    organization_name: input.organizationName?.trim() || input.displayName?.trim() || null,
    access_scope: 'specific',
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
    await syncProfileRoleForEmail(email, 'admin', displayName)
  }

  return mapAdminRegistryRow(data)
}

export async function updateAdminRegistry(currentEmail: string, input: AdminRegistryInput): Promise<AdminRegistryRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const oldEmail = normalizeEmail(currentEmail)
  const nextEmail = normalizeEmail(input.email)
  if (!oldEmail || !nextEmail) throw new RepositoryError('Email admin wajib diisi.')

  const { data: currentRecord, error: currentError } = await client
    .schema('app')
    .from('admin_registry')
    .select('*')
    .eq('email', oldEmail)
    .single()

  if (currentError || !currentRecord) throw new RepositoryError('Data admin yang ingin diperbarui tidak ditemukan.')

  const actorProfileId = await getCurrentProfileId()
  const displayName = input.displayName?.trim() || input.organizationName?.trim() || null
  const payload: Database['app']['Tables']['admin_registry']['Update'] = {
    email: nextEmail,
    organization_name: input.organizationName?.trim() || input.displayName?.trim() || null,
    access_scope: 'specific',
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

  await syncProfileRoleForEmail(nextEmail, currentRecord.assigned_role, displayName)

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

  await syncProfileRoleForEmail(normalizedEmail, current.assigned_role)
}
