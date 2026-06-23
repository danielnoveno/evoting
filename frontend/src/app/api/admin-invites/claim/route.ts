import { createHash } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { isRecord, sameWalletAddress } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'

type InviteRole = 'admin' | 'super_admin'

type InviteRow = {
  email: string
  assigned_role: InviteRole
  organization_name: string | null
  wallet_address: string | null
  status: 'pending' | 'active' | 'inactive'
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
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
  const walletAddress = typeof payload.walletAddress === 'string' ? payload.walletAddress.trim() : ''
  if (!token) return jsonError('Token undangan tidak ditemukan.', 400)
  if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return jsonError('Wallet aktivasi admin tidak valid.', 400)

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
    .select('email,assigned_role,organization_name,wallet_address,status')
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

  if (walletAddress && invite.wallet_address && !sameWalletAddress(invite.wallet_address, walletAddress)) {
    return jsonError('Wallet tersambung tidak sesuai dengan wallet yang didaftarkan pada undangan admin.', 403)
  }

  // Claim invite
  const registryUpdate: Record<string, unknown> = {
    status: 'active',
    activation_accepted_at: new Date().toISOString(),
    activation_token_hash: null,
  }

  if (walletAddress) registryUpdate.wallet_address = walletAddress

  const { error: updateError } = await client
    .from('admin_registry')
    .update(registryUpdate)
    .eq('email', invite.email)

  if (updateError) return jsonError(`Gagal mengaktifkan undangan: ${updateError.message}`, 500)

  // Update profile role
  const profilePayload: Record<string, unknown> = {
    user_id: userData.user.id,
    email: invite.email,
    role: invite.assigned_role,
    display_name: invite.organization_name || null,
  }

  if (walletAddress) {
    profilePayload.wallet_address = walletAddress
    profilePayload.role_hint = 'admin-activation'
  }

  const { error: profileError } = await client
    .from('app_profiles')
    .upsert(profilePayload, { onConflict: 'user_id' })

  if (profileError) {
    console.error('[Admin Claim] Failed to update profile role:', profileError)
    return jsonError(`Undangan aktif, tetapi profil admin belum tersimpan: ${profileError.message}. Hubungi superadmin.`, 500)
  }

  // Send notification to all superadmins about new activation
  try {
    const { data: superadmins } = await client
      .schema('app')
      .from('app_profiles')
      .select('id')
      .eq('role', 'super_admin')

    if (superadmins && superadmins.length > 0) {
      const roleLabel = invite.assigned_role === 'super_admin' ? 'Superadmin' : 'Admin Organisasi'
      const notificationPayload = {
        eventType: 'account_activated',
        title: `${roleLabel} berhasil diaktivasi`,
        description: `${invite.email}${invite.organization_name ? ` (${invite.organization_name})` : ''} telah mengaktifkan akun dan menyambungkan wallet.`,
        actorLabel: invite.email,
        link: invite.assigned_role === 'super_admin' ? '/superadmin/manajemen-superadmin' : '/superadmin/manajemen-admin',
        type: 'success' as const,
      }

      const notificationRows = superadmins.map((sa: { id: string }) => ({
        target_profile_id: sa.id,
        channel: 'in_app',
        template_key: 'proposal_activity',
        status: 'sent',
        payload: notificationPayload,
      }))

      await client.schema('app').from('notification_jobs').insert(notificationRows)
    }
  } catch (notifError) {
    console.warn('[Admin Claim] Failed to send activation notification:', notifError)
  }

  return NextResponse.json({
    success: true,
    email: invite.email,
    role: invite.assigned_role,
    organizationName: invite.organization_name,
    walletAddress: walletAddress || invite.wallet_address,
  })
}
