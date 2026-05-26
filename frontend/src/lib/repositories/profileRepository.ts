'use client'

import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import type { AppProfileRecord, ProfileUpsertInput } from '@/lib/repositories/types'
import { RepositoryError } from '@/lib/repositories/errors'

type ProfileRow = Database['app']['Tables']['app_profiles']['Row']

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
    .eq('wallet_address', normalizedWallet)
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

  const { data: existingWalletOwner, error: ownerError } = await client
    .schema('app')
    .from('app_profiles')
    .select('*')
    .eq('wallet_address', normalizedWallet)
    .maybeSingle()

  if (ownerError) throw new RepositoryError('Gagal memeriksa kepemilikan wallet. Coba lagi.')

  if (existingWalletOwner && existingWalletOwner.user_id !== user.id) {
    throw new RepositoryError('Wallet ini sudah ditautkan ke akun kampus lain.')
  }

  const { data: currentProfile, error: currentProfileError } = await client
    .schema('app')
    .from('app_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (currentProfileError) throw new RepositoryError('Gagal memuat profil akun kampus. Coba lagi.')

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

  if (error) throw new RepositoryError('Gagal menautkan wallet ke akun kampus. Coba lagi.')
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
