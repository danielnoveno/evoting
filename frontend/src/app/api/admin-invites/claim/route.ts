import { createHash } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type InviteRole = 'admin' | 'super_admin'

type InviteRow = {
  email: string
  assigned_role: InviteRole
  organization_name: string | null
  status: 'pending' | 'active' | 'inactive'
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError('Format permintaan tidak valid.', 400)
  }

  if (!isRecord(payload)) return jsonError('Data klaim tidak valid.', 400)

  const token = typeof payload.token === 'string' ? payload.token.trim() : ''
  if (!token) return jsonError('Token undangan tidak ditemukan.', 400)

  // Get current session user to verify email
  const authorization = request.headers.get('authorization')
  const authHeaderToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!authHeaderToken) return jsonError('Sesi login SSO tidak ditemukan. Silakan masuk terlebih dahulu.', 401)

  const { data: userData, error: userError } = await client.auth.getUser(authHeaderToken)
  if (userError || !userData.user) {
    return jsonError('Sesi login tidak valid atau sudah berakhir.', 401)
  }

  const userEmail = userData.user.email?.toLowerCase()
  if (!userEmail) return jsonError('Email tidak ditemukan pada sesi login SSO.', 400)

  // Find invite
  const tokenHash = hashToken(token)
  const { data, error } = await client
    .from('admin_registry')
    .select('email,assigned_role,organization_name,status')
    .eq('activation_token_hash', tokenHash)
    .maybeSingle()

  if (error) return jsonError(`Gagal memeriksa undangan: ${error.message}`, 500)
  if (!data) return jsonError('Undangan tidak valid atau sudah digunakan.', 404)

  const invite = data as InviteRow
  if (invite.status === 'inactive') return jsonError('Undangan ini sudah dinonaktifkan.', 410)
  if (invite.status === 'active') return jsonError('Akun ini sudah aktif.', 409)
  
  if (invite.email.toLowerCase() !== userEmail) {
    return jsonError(`Email login (${userEmail}) tidak sesuai dengan email yang diundang (${invite.email}). Gunakan akun kampus yang sesuai.`, 403)
  }

  // Claim invite
  const { error: updateError } = await client
    .from('admin_registry')
    .update({
      status: 'active',
      activation_accepted_at: new Date().toISOString(),
      activation_token_hash: null,
    })
    .eq('email', invite.email)

  if (updateError) return jsonError(`Gagal mengaktifkan undangan: ${updateError.message}`, 500)

  // Update profile role
  const { error: profileError } = await client
    .from('app_profiles')
    .update({ 
      role: invite.assigned_role,
      display_name: invite.organization_name || undefined
    })
    .eq('user_id', userData.user.id)

  if (profileError) {
    console.error('[Admin Claim] Failed to update profile role:', profileError)
    // Non-fatal error for the user, as the registry is updated
  }

  return NextResponse.json({
    success: true,
    email: invite.email,
    role: invite.assigned_role,
    organizationName: invite.organization_name
  })
}
