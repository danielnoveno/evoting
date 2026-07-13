import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { requireProfile } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

  const wallet = auth.profile.wallet_address?.toLowerCase()
  const ownershipFilter = wallet
    ? `target_profile_id.eq.${auth.profile.id},target_wallet.eq.${wallet}`
    : `target_profile_id.eq.${auth.profile.id}`

  // Delete only notifications belonging to this user. Broadcast rows are hidden client-side per device.
  const { data: deletedRows, error } = await client
    .schema('app')
    .from('notification_jobs')
    .delete()
    .select('id')
    .in('id', ids)
    .or(ownershipFilter)

  if (error) {
    return NextResponse.json({ error: 'Gagal menghapus notifikasi.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted: deletedRows?.length ?? 0 })
}
