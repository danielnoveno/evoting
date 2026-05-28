import { createHash, randomBytes } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { sendSuperadminActivationEmail } from '@/lib/email/send'

export const runtime = 'nodejs'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function createActivationToken() {
  return randomBytes(32).toString('base64url')
}

function getRequestOrigin(request: NextRequest) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL
  if (configuredOrigin?.trim()) return configuredOrigin.trim().replace(/\/$/, '')
  return request.nextUrl.origin.replace(/\/$/, '')
}

function requireSuperadmin(request: NextRequest) {
  return (async () => {
    const client = getSupabaseServiceRoleClient()
    if (!client) return { error: jsonError('Service role Supabase belum dikonfigurasi.', 503), profileId: null, client: null }

    const authorization = request.headers.get('authorization')
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) return { error: jsonError('Sesi superadmin tidak ditemukan.', 401), profileId: null, client }

    const { data: userData, error: userError } = await client.auth.getUser(token)
    if (userError || !userData.user) return { error: jsonError('Sesi superadmin tidak valid atau sudah berakhir.', 401), profileId: null, client }

    const { data: profile, error: profileError } = await client
      .schema('app')
      .from('app_profiles')
      .select('id,role')
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (profileError) return { error: jsonError('Gagal memeriksa otoritas superadmin.', 500), profileId: null, client }
    if (!profile || profile.role !== 'super_admin') return { error: jsonError('Hanya superadmin aktif yang dapat mengirim ulang undangan.', 403), profileId: null, client }

    return { error: null, profileId: profile.id, client }
  })()
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperadmin(request)
  if (auth.error) return auth.error
  if (!auth.client || !auth.profileId) return jsonError('Sesi superadmin tidak dapat diverifikasi.', 401)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError('Format permintaan tidak valid.', 400)
  }

  if (!isRecord(payload)) return jsonError('Data undangan tidak valid.', 400)

  const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : ''
  if (!email) return jsonError('Email wajib diisi.', 400)

  const { data: invite, error: fetchError } = await auth.client
    .schema('app')
    .from('admin_registry')
    .select('email,assigned_role,display_name,wallet_address,activation_token_hash,activation_expires_at,activation_accepted_at,status')
    .eq('email', email)
    .maybeSingle()

  if (fetchError) return jsonError('Gagal memeriksa undangan.', 500)
  if (!invite) return jsonError('Undangan tidak ditemukan untuk email ini.', 404)
  if (invite.status === 'inactive') return jsonError('Undangan sudah dinonaktifkan.', 410)
  if (invite.activation_accepted_at) return jsonError('Undangan ini sudah digunakan dan tidak bisa dikirim ulang.', 409)

  // Generate new token & expiry
  const newToken = createActivationToken()
  const newTokenHash = hashToken(newToken)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

  const { error: updateError } = await auth.client
    .schema('app')
    .from('admin_registry')
    .update({
      activation_token_hash: newTokenHash,
      activation_sent_at: new Date().toISOString(),
      activation_expires_at: expiresAt,
      activation_accepted_at: null,
      updated_by: auth.profileId,
    })
    .eq('email', email)

  if (updateError) return jsonError('Gagal memperbarui undangan.', 500)

  const activationLink = `${getRequestOrigin(request)}/portal-admin?invite=${encodeURIComponent(newToken)}`

  const emailResult = await sendSuperadminActivationEmail({
    displayName: invite.display_name ?? email.split('@')[0],
    email: invite.email,
    activationLink,
  })

  if (!emailResult.success) {
    return NextResponse.json({
      activationLink,
      emailStatus: 'failed',
      emailError: emailResult.error ?? 'Email gagal dikirim.',
    })
  }

  return NextResponse.json({
    activationLink,
    emailStatus: 'sent',
    emailId: emailResult.emailId,
  })
}
