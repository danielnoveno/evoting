import { createHash, randomBytes } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { sendSuperadminActivationEmail } from '@/lib/email/send'

export const runtime = 'nodejs'

type InviteRole = 'admin' | 'super_admin'

type InviteRow = {
  email: string
  assigned_role: InviteRole
  display_name: string | null
  wallet_address: string | null
  activation_expires_at: string | null
  activation_accepted_at: string | null
  status: 'pending' | 'active' | 'inactive'
}

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

function toInviteResponse(row: InviteRow) {
  return {
    email: row.email,
    displayName: row.display_name,
    walletAddress: row.wallet_address,
    role: row.assigned_role,
    expiresAt: row.activation_expires_at ?? '',
  }
}

async function requireSuperadmin(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) {
    console.error('[Admin Invites] Service role client is missing')
    return { error: jsonError('Service role Supabase belum dikonfigurasi.', 503), profileId: null, client: null }
  }

  const authorization = request.headers.get('authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return { error: jsonError('Sesi superadmin tidak ditemukan.', 401), profileId: null, client }

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) {
    console.error('[Admin Invites] Auth user check failed:', userError)
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
    console.error('[Admin Invites] Profile query error for user:', userId, profileError)
    return { 
      error: jsonError(`Gagal memeriksa otoritas superadmin: ${profileError.message}`, 500), 
      profileId: null, 
      client 
    }
  }

  if (!profile) {
    console.warn('[Admin Invites] No profile found for authenticated user:', userId)
    return { error: jsonError('Profil superadmin tidak ditemukan.', 403), profileId: null, client }
  }

  if (profile.role !== 'super_admin') {
    console.warn('[Admin Invites] Unauthorized role access attempt:', profile.role, 'by user:', profile.email)
    return { error: jsonError('Hanya superadmin aktif yang dapat membuat undangan.', 403), profileId: null, client }
  }

  return { error: null, profileId: profile.id, client }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim() ?? ''
  if (!token) return jsonError('Token undangan tidak ditemukan.', 400)

  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const tokenHash = hashToken(token)
  const { data, error } = await client
    .from('admin_registry')
    .select('email,assigned_role,display_name,wallet_address,activation_expires_at,activation_accepted_at,status')
    .eq('activation_token_hash', tokenHash)
    .maybeSingle()

  if (error) return jsonError(`Gagal memeriksa undangan aktivasi: ${error.message}`, 500)
  if (!data) return jsonError('Undangan tidak valid.', 404)

  const invite = data as InviteRow
  if (invite.status === 'inactive') return jsonError('Undangan ini sudah dinonaktifkan.', 410)
  if (invite.activation_accepted_at) return jsonError('Undangan ini sudah digunakan. Silakan masuk dengan password yang sudah dibuat.', 409)
  if (!invite.activation_expires_at || new Date(invite.activation_expires_at).getTime() <= Date.now()) {
    return jsonError('Undangan sudah kedaluwarsa. Minta superadmin utama mengirim undangan baru.', 410)
  }

  return NextResponse.json({ invite: toInviteResponse(invite) })
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

  const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : ''
  const email = typeof payload.email === 'string' ? normalizeEmail(payload.email) : ''
  const walletAddress = typeof payload.walletAddress === 'string' ? payload.walletAddress.trim() : ''
  const assignedRole = payload.role === 'admin' ? 'admin' as const : 'super_admin' as const
  const organizationName = typeof payload.organizationName === 'string' ? payload.organizationName.trim() : null
  const accessScope = payload.accessScope === 'specific' ? 'specific' as const : 'all' as const

  if (!displayName || !email) return jsonError('Nama dan email wajib diisi.', 400)
  if (assignedRole === 'super_admin' && !walletAddress) return jsonError('Wallet address wajib diisi untuk superadmin.', 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('Format email institusi tidak valid.', 400)
  if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return jsonError('Wallet address tidak valid.', 400)

  const { data: existingProfile, error: profileError } = await auth.client
    .from('app_profiles')
    .select('id,email,role')
    .ilike('email', email)
    .limit(1)
    .maybeSingle()

  if (profileError) return jsonError(`Gagal memeriksa profil yang sudah ada: ${profileError.message}`, 500)
  if (existingProfile?.role === 'super_admin') return jsonError('Email ini sudah aktif sebagai superadmin.', 409)
  if (existingProfile?.role && assignedRole === 'super_admin' && existingProfile.role === 'admin') {
    return jsonError('Email ini sudah terdaftar sebagai admin organisasi. Hapus akses dulu sebelum menjadikan superadmin.', 409)
  }

  const token = createActivationToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

  const payloadRow: Record<string, unknown> = {
    email,
    assigned_role: assignedRole,
    display_name: displayName,
    organization_name: organizationName,
    access_scope: accessScope,
    status: 'pending',
    description: assignedRole === 'super_admin'
      ? 'Undangan superadmin dari portal utama admin.'
      : 'Undangan admin organisasi.',
    activation_token_hash: tokenHash,
    activation_sent_at: new Date().toISOString(),
    activation_expires_at: expiresAt,
    activation_accepted_at: null,
    created_by: auth.profileId,
    updated_by: auth.profileId,
  }

  if (walletAddress) {
    payloadRow.wallet_address = walletAddress
  }

  const { data, error } = await auth.client
    .from('admin_registry')
    .upsert(payloadRow, { onConflict: 'email' })
    .select('email,assigned_role,display_name,wallet_address,activation_expires_at,activation_accepted_at,status')
    .single()

  if (error) return jsonError(`Gagal menyimpan undangan: ${error.message}`, 500)


  const activationLink = `${getRequestOrigin(request)}/portal-admin?invite=${encodeURIComponent(token)}`

  // Attempt to send activation email — non-blocking; invite is saved regardless
  let emailStatus: 'sent' | 'skipped' | 'failed' = 'skipped'
  let emailError: string | undefined

  // For admins without wallet, also sync profile role if exists
  if (assignedRole === 'admin' && !walletAddress) {
    await auth.client
      .from('app_profiles')
      .update({ role: 'admin' })
      .ilike('email', email)
      .then(() => {})
  }

  const emailResult = await sendAdminActivationEmail({
    displayName,
    email,
    activationLink,
    role: assignedRole,
  })

  if (emailResult.success) {
    emailStatus = 'sent'
  } else if (emailResult.error) {
    emailStatus = 'failed'
    emailError = emailResult.error
  }

  return NextResponse.json({
    invite: toInviteResponse(data as InviteRow),
    activationLink,
    emailStatus,
    emailError,
  })
}
