import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { requireProfile } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const auth = await requireProfile(request, ['admin', 'super_admin', 'voter'])
  if ('error' in auth) return auth.error

  const body: unknown = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 })
  }

  const ids = Array.isArray((body as Record<string, unknown>).ids)
    ? ((body as Record<string, unknown>).ids as string[])
    : []

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Minimal satu ID notifikasi diperlukan.' }, { status: 400 })
  }

  const client = getSupabaseServiceRoleClient()
  if (!client) {
    return NextResponse.json({ error: 'Service role Supabase belum dikonfigurasi.' }, { status: 503 })
  }

  // Delete only notifications belonging to this user
  const { error } = await client
    .schema('app')
    .from('notification_jobs')
    .delete()
    .in('id', ids)
    .eq('target_profile_id', auth.profile.id)

  if (error) {
    return NextResponse.json({ error: 'Gagal menghapus notifikasi.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted: ids.length })
}
