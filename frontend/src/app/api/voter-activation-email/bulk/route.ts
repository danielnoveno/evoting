import { NextResponse, type NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { sendVoterActivationEmail } from '@/lib/email/send'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { isRecord } from '@/lib/repositories/helpers'
import { getRequestOrigin } from '@/lib/url'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RecipientInput = {
  email: string
  name: string
  nim: string
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function createActivationToken() {
  return randomBytes(32).toString('base64url')
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function requireSuperadmin(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return { error: jsonError('Service role Supabase belum dikonfigurasi.', 503), client: null }

  const authorization = request.headers.get('authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return { error: jsonError('Sesi superadmin tidak ditemukan.', 401), client }

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) return { error: jsonError('Sesi superadmin tidak valid atau sudah berakhir.', 401), client }

  const { data: profile, error: profileError } = await client
    .from('app_profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (profileError) return { error: jsonError('Gagal memeriksa otoritas superadmin.', 500), client }
  if (!profile || profile.role !== 'super_admin') return { error: jsonError('Hanya superadmin aktif yang dapat mengirim email aktivasi voter.', 403), client }

  return { error: null, client }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperadmin(request)
  if (auth.error) return auth.error

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError('Format permintaan tidak valid.', 400)
  }

  if (!isRecord(payload) || !Array.isArray(payload.recipients)) {
    return jsonError('Daftar penerima tidak valid.', 400)
  }

  const recipients = payload.recipients
    .filter(isRecord)
    .map((item): RecipientInput => ({
      email: typeof item.email === 'string' ? item.email.trim().toLowerCase() : '',
      name: typeof item.name === 'string' ? item.name.trim() : '',
      nim: typeof item.nim === 'string' ? item.nim.trim() : '',
    }))
    .filter((item) => item.email && item.name && item.nim)

  if (recipients.length === 0) {
    return jsonError('Pilih minimal satu voter dengan email valid.', 400)
  }

  const origin = getRequestOrigin(request)
  const dedupedRecipients = Array.from(new Map(recipients.map((item) => [item.email, item])).values())

  const results = await Promise.all(dedupedRecipients.map(async (recipient) => {
    if (!/^[a-zA-Z0-9._%+-]+@(students\.uajy\.ac\.id|uajy\.ac\.id)$/.test(recipient.email)) {
      return { email: recipient.email, success: false, error: 'Email institusi voter tidak valid.' }
    }

    const token = createActivationToken()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

    const { error: tokenError } = await auth.client!
      .from('activation_tokens')
      .insert({
        token_hash: hashToken(token),
        email: recipient.email,
        role: 'voter',
        status: 'pending',
        expires_at: expiresAt,
      })

    if (tokenError) {
      return { email: recipient.email, success: false, error: 'Gagal membuat token aktivasi voter.' }
    }

    const activationLink = `${origin}/auth/aktivasi-voter?token=${encodeURIComponent(token)}`
    const emailResult = await sendVoterActivationEmail({
      displayName: recipient.name,
      email: recipient.email,
      activationLink,
    })

    return {
      email: recipient.email,
      success: emailResult.success,
      error: emailResult.error,
    }
  }))

  const sentCount = results.filter((item) => item.success).length
  const failed = results.filter((item) => !item.success)

  return NextResponse.json({
    total: dedupedRecipients.length,
    sentCount,
    failedCount: failed.length,
    failures: failed,
  })
}
