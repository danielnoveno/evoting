import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/database.types'

export type ServiceClient = NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>
export type AppProfileRow = Database['app']['Tables']['app_profiles']['Row']

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireProfile(request: NextRequest, allowedRoles: AppProfileRow['role'][]) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return { error: jsonError('Service role Supabase belum dikonfigurasi.', 503) }

  const authorization = request.headers.get('authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return { error: jsonError('Sesi pengguna tidak ditemukan.', 401) }

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) return { error: jsonError('Sesi pengguna tidak valid atau sudah berakhir.', 401) }

  const { data: profile, error: profileError } = await client
    .from('app_profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (profileError) return { error: jsonError('Gagal memuat profil pengguna.', 500) }
  if (!profile) return { error: jsonError('Profil pengguna belum terdaftar.', 403) }
  if (!allowedRoles.includes(profile.role)) return { error: jsonError('Akses tidak diizinkan untuk peran akun ini.', 403) }

  return { client, profile }
}

export async function ensureCanManageProposal(client: ServiceClient, profile: AppProfileRow, proposalDraftId: string) {
  if (profile.role === 'super_admin') return null

  const { data: proposal, error } = await client
    .from('proposal_drafts')
    .select('id, created_by')
    .eq('id', proposalDraftId)
    .maybeSingle()

  if (error) return jsonError('Gagal memeriksa hak akses proposal.', 500)
  if (!proposal) return jsonError('Proposal tidak ditemukan.', 404)
  if (proposal.created_by !== profile.id) return jsonError('Admin hanya dapat mengubah proposal miliknya.', 403)
  return null
}
