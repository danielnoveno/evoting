import { createHash } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type ActivationTokenRow = {
  id: string
  email: string
  role: 'voter' | 'admin' | 'super_admin'
  wallet_address: string | null
  status: 'pending' | 'used' | 'expired' | 'revoked'
  expires_at: string
  used_at: string | null
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

function sameWalletAddress(left: string | null | undefined, right: string | null | undefined): boolean {
  return Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase())
}

export async function POST(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const authorization = request.headers.get('authorization')
  const authToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!authToken) return jsonError('Sesi login tidak ditemukan. Silakan masuk ulang.', 401)

  const { data: userData, error: userError } = await client.auth.getUser(authToken)
  if (userError || !userData.user) return jsonError('Sesi login tidak valid atau sudah berakhir.', 401)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError('Format permintaan aktivasi tidak valid.', 400)
  }

  if (!isRecord(payload)) return jsonError('Data aktivasi tidak valid.', 400)

  const token = typeof payload.token === 'string' ? payload.token.trim() : ''
  const walletAddress = typeof payload.walletAddress === 'string' ? payload.walletAddress.trim() : ''
  const expectedRole = payload.role === 'admin' || payload.role === 'super_admin' ? payload.role : 'voter'

  if (!token) return jsonError('Token aktivasi tidak ditemukan.', 400)
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) return jsonError('Wallet aktivasi tidak valid.', 400)

  const userEmail = userData.user.email?.trim().toLowerCase()
  if (!userEmail) return jsonError('Email tidak ditemukan pada sesi login.', 400)

  const { data, error } = await client
    .from('activation_tokens')
    .select('id,email,role,wallet_address,status,expires_at,used_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle()

  if (error) return jsonError(`Gagal memeriksa token aktivasi: ${error.message}`, 500)
  if (!data) return jsonError('Token aktivasi tidak valid.', 404)

  const activation = data as ActivationTokenRow
  if (activation.status !== 'pending' || activation.used_at) return jsonError('Token aktivasi sudah digunakan atau tidak aktif.', 409)
  if (new Date(activation.expires_at).getTime() <= Date.now()) {
    await client.from('activation_tokens').update({ status: 'expired' }).eq('id', activation.id)
    return jsonError('Token aktivasi sudah kedaluwarsa. Minta admin mengirim ulang aktivasi.', 410)
  }
  if (activation.email.trim().toLowerCase() !== userEmail) {
    return jsonError(`Email login (${userEmail}) tidak sesuai dengan email undangan (${activation.email}).`, 403)
  }
  if (activation.role !== expectedRole) return jsonError('Role token aktivasi tidak sesuai dengan alur yang dipilih.', 403)
  if (activation.wallet_address && !sameWalletAddress(activation.wallet_address, walletAddress)) {
    return jsonError('Wallet tersambung tidak sesuai dengan wallet pada undangan aktivasi.', 403)
  }

  const { error: updateError } = await client
    .from('activation_tokens')
    .update({
      status: 'used',
      used_at: new Date().toISOString(),
      used_by_user_id: userData.user.id,
    })
    .eq('id', activation.id)
    .eq('status', 'pending')

  if (updateError) return jsonError(`Gagal memakai token aktivasi: ${updateError.message}`, 500)

  // Write wallet address back to master_voters so admins can see it in whitelist
  if (activation.role === 'voter') {
    await client
      .from('master_voters')
      .update({ wallet_address: walletAddress, status: 'active' })
      .eq('email', activation.email.trim().toLowerCase())
  }

  return NextResponse.json({
    success: true,
    email: activation.email,
    role: activation.role,
    walletAddress,
  })
}
