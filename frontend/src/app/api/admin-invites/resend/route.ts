import { createHash, randomBytes } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { sendAdminActivationEmail } from '@/lib/email/send'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
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

function createActivationLink(request: NextRequest, token: string) {
  const origin = getRequestOrigin(request)
  const url = new URL('/auth/aktivasi-admin', origin)
  url.searchParams.set('invite', token)
  return url.toString()
}

async function requireSuperadmin(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) {
    console.error('[Admin Resend] Service role client is missing')
    return { error: jsonError('Service role Supabase belum dikonfigurasi.', 503), profileId: null, client: null }
  }

  const authorization = request.headers.get('authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return { error: jsonError('Sesi superadmin tidak ditemukan.', 401), profileId: null, client }

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) {
    console.error('[Admin Resend] Auth user check failed:', userError)
    return { error: jsonError('Sesi superadmin tidak valid atau sudah berakhir.', 401), profileId: null, client }
  }

  const userId = userData.user.id

  // We use the client directly since it's already configured with schema: 'app' in getSupabaseServiceRoleClient()
  // This avoids potential issues with redundant .schema() calls in some environments.
  const { data: profile, error: profileError } = await client
    .from('app_profiles')
    .select('id, role, email')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('[Admin Resend] Profile query error for user:', userId, profileError)
    return { 
      error: jsonError(`Gagal memeriksa otoritas superadmin: ${profileError.message}`, 500), 
      profileId: null, 
      client 
    }
  }

  if (!profile) {
    console.warn('[Admin Resend] No profile found for authenticated user:', userId)
    return { error: jsonError('Profil superadmin tidak ditemukan.', 403), profileId: null, client }
  }

  if (profile.role !== 'super_admin') {
    console.warn('[Admin Resend] Unauthorized role access attempt:', profile.role, 'by user:', profile.email)
    return { error: jsonError('Hanya superadmin aktif yang dapat mengirim ulang undangan.', 403), profileId: null, client }
  }

  return { error: null, profileId: profile.id, client }
}

export async function POST(request: NextRequest) {
  try {
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
      .from('admin_registry')
      .select('email,assigned_role,organization_name,wallet_address,activation_token_hash,activation_expires_at,activation_accepted_at,status')
      .eq('email', email)
      .maybeSingle()

    if (fetchError) return jsonError(`Gagal memeriksa undangan: ${fetchError.message}`, 500)
    if (!invite) return jsonError('Undangan tidak ditemukan untuk email ini.', 404)
    if (invite.status === 'inactive') return jsonError('Undangan sudah dinonaktifkan.', 410)
    if (invite.status === 'active' || invite.activation_accepted_at) {
      return jsonError('Akun ini sudah aktif. Gunakan login biasa atau kirim reset password, bukan email aktivasi.', 409)
    }

    // Generate new token & expiry
    const newToken = createActivationToken()
    const newTokenHash = hashToken(newToken)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

    const updatePayload: Record<string, unknown> = {
      activation_sent_at: new Date().toISOString(),
      activation_expires_at: expiresAt,
      updated_by: auth.profileId,
    }

    if (invite.assigned_role === 'super_admin' || !invite.activation_accepted_at) {
      updatePayload.activation_token_hash = newTokenHash
      updatePayload.activation_accepted_at = null
    }

    const { error: updateError } = await auth.client
      .from('admin_registry')
      .update(updatePayload)
      .eq('email', email)

    if (updateError) return jsonError(`Gagal memperbarui undangan: ${updateError.message}`, 500)

    const activationLink = createActivationLink(request, newToken)

    const emailResult = await sendAdminActivationEmail({
      displayName: invite.organization_name ?? email.split('@')[0],
      email: invite.email,
      activationLink,
      role: invite.assigned_role,
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
  } catch (err) {
    console.error('[Admin Resend] Unhandled error:', err)
    return jsonError('Terjadi kesalahan internal saat mengirim ulang undangan.', 500)
  }
}
