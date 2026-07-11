import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { requireProfile } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  return {}
}

function mapNotificationRow(row: Record<string, unknown>) {
  const payload = asObject(row.payload)
  const tone = payload.type === 'success' || payload.type === 'warning' ? payload.type : 'info'
  const description = typeof payload.description === 'string'
    ? payload.description
    : typeof payload.message === 'string'
      ? payload.message
      : 'Notifikasi sistem tersedia.'
  return {
    id: row.id,
    title: typeof payload.title === 'string' ? payload.title : row.template_key,
    description,
    type: tone,
    link: typeof payload.link === 'string' ? payload.link : null,
    actorLabel: typeof payload.actorLabel === 'string' ? payload.actorLabel : null,
    createdAt: row.created_at,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireProfile(request, ['admin', 'super_admin', 'voter'])
  if ('error' in auth) return auth.error

  const client = getSupabaseServiceRoleClient()
  if (!client) return NextResponse.json({ error: 'Service role belum dikonfigurasi.' }, { status: 503 })

  const { data, error } = await client
    .schema('app')
    .from('notification_jobs')
    .select('*')
    .eq('channel', 'in_app')
    .in('status', ['queued', 'sent'])
    .or(`target_profile_id.eq.${auth.profile.id},target_wallet.eq.${auth.profile.wallet_address.toLowerCase()},and(target_profile_id.is.null,target_wallet.is.null)`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Gagal memuat notifikasi.' }, { status: 500 })

  const notifications = (data ?? []).map(mapNotificationRow)
  return NextResponse.json({ notifications })
}
