import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase() ?? ''
  if (!/^\S+@\S+\.\S+$/.test(email)) return jsonError('Format email tidak valid.', 400)

  const { data, error } = await client
    .schema('app')
    .from('app_profiles')
    .select('id,role')
    .ilike('email', email)
    .eq('role', 'voter')
    .maybeSingle()

  if (error) return jsonError('Gagal memeriksa status aktivasi email.', 500)
  if (!data) return jsonError('Email belum teraktivasi sebagai pemilih. Gunakan link aktivasi dari admin terlebih dahulu.', 403)

  return NextResponse.json({ eligible: true })
}
