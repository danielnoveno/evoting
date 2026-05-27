'use client'

import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import type { AdminDirectoryRecord, AppProfileRecord, ProfileUpsertInput } from '@/lib/repositories/types'
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
  const payload: Database['app']['Tables']['app_profiles']['Insert'] = {
    user_id: user.id,
    wallet_address: input.walletAddress,
    display_name: input.displayName ?? null,
    email: input.email ?? user.email ?? null,
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
    throw new RepositoryError(`Akun kampus ini sudah tertaut ke wallet ${currentProfile.wallet_address}. Sambungkan wallet tersebut atau hubungi admin bila perlu mengganti wallet.`)
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
    throw new RepositoryError(`Wallet ini sudah ditautkan ke akun kampus lain${ownerEmail}. Sambungkan wallet yang sesuai dengan akun kamu.`)
  }

  const payload: Database['app']['Tables']['app_profiles']['Insert'] = {
    user_id: user.id,
    wallet_address: normalizedWallet,
    display_name: input.displayName ?? currentProfile?.display_name ?? null,
    email: input.email ?? currentProfile?.email ?? user.email ?? null,
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
      description: registry?.description ?? null,
      createdAt: registry?.created_at ?? profile.createdAt,
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
      description: row.description,
      createdAt: row.created_at,
      profile: null,
    })
  })

  return Array.from(directoryByEmail.values()).sort((left, right) => {
    const leftTime = left.profile?.createdAt ?? left.createdAt ?? ''
    const rightTime = right.profile?.createdAt ?? right.createdAt ?? ''
    return rightTime.localeCompare(leftTime)
  })
}
