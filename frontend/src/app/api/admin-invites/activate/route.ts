import { createHash } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type InviteRole = 'admin' | 'super_admin'

type ActivationInviteRow = {
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

  if (!isRecord(payload)) return jsonError('Data aktivasi tidak valid.', 400)

  const token = typeof payload.token === 'string' ? payload.token.trim() : ''
  const password = typeof payload.password === 'string' ? payload.password : ''

  if (!token) return jsonError('Token undangan tidak ditemukan.', 400)
  if (password.length < 8) return jsonError('Password minimal 8 karakter.', 400)

  const tokenHash = hashToken(token)
  const { data, error } = await client
    .from('admin_registry')
    .select('email,assigned_role,display_name,wallet_address,activation_expires_at,activation_accepted_at,status')
    .eq('activation_token_hash', tokenHash)
    .maybeSingle()

  if (error) return jsonError(`Gagal memeriksa undangan aktivasi: ${error.message}`, 500)
  if (!data) return jsonError('Undangan tidak valid.', 404)

  const invite = data as ActivationInviteRow
  if (invite.status === 'inactive') return jsonError('Undangan ini sudah dinonaktifkan.', 410)
  if (invite.activation_accepted_at) return jsonError('Undangan ini sudah digunakan. Silakan masuk dengan password yang sudah dibuat.', 409)
  if (!invite.activation_expires_at || new Date(invite.activation_expires_at).getTime() <= Date.now()) {
    return jsonError('Undangan sudah kedaluwarsa. Minta superadmin utama mengirim undangan baru.', 410)
  }

  const { data: createdUser, error: createUserError } = await client.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: invite.display_name ?? invite.email.split('@')[0],
    },
  })

  if (createUserError || !createdUser.user) {
    const message = createUserError?.message.toLowerCase() ?? ''
    if (message.includes('already') || message.includes('registered')) {
      return jsonError('Akun email ini sudah ada. Gunakan login biasa atau menu Lupa Password.', 409)
    }

    return jsonError(`Akun belum dapat diaktifkan: ${createUserError?.message ?? 'Unknown error'}`, 500)
  }

  const { error: updateError } = await client
    .from('admin_registry')
    .update({
      status: 'active',
      activation_accepted_at: new Date().toISOString(),
      activation_token_hash: null,
    })
    .eq('email', invite.email)

  if (updateError) return jsonError(`Akun dibuat, tetapi status undangan belum tersimpan: ${updateError.message}. Hubungi superadmin utama.`, 500)


  return NextResponse.json({
    email: invite.email,
    displayName: invite.display_name,
    role: invite.assigned_role,
  })
}
