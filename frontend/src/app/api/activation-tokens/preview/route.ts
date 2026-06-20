import { createHash } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const token = request.nextUrl.searchParams.get('token')?.trim() ?? ''
  if (!token) return jsonError('Token aktivasi tidak ditemukan.', 400)

  const { data, error } = await client
    .from('activation_tokens')
    .select('email, role, status, expires_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle()

  if (error) return jsonError(`Gagal memeriksa token: ${error.message}`, 500)
  if (!data) return jsonError('Token aktivasi tidak valid.', 404)

  const isExpired = new Date(data.expires_at).getTime() <= Date.now()
  const isUsed = data.status !== 'pending'

  return NextResponse.json({
    email: data.email,
    role: data.role,
    status: data.status,
    isExpired,
    isUsed,
    isValid: !isExpired && !isUsed,
  })
}
