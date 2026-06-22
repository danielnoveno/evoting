import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

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
    createdAt: row.created_at,
  }
}

/**
 * Public endpoint — no auth required.
 * Returns broadcast notifications (no target_profile_id / target_wallet).
 * Used by non-logged-in visitors to see election activity.
 */
export async function GET() {
  const client = getSupabaseServiceRoleClient()
  if (!client) return NextResponse.json({ error: 'Service role belum dikonfigurasi.' }, { status: 503 })

  const { data, error } = await client
    .schema('app')
    .from('notification_jobs')
    .select('*')
    .eq('channel', 'in_app')
    .in('status', ['queued', 'sent'])
    .is('target_profile_id', null)
    .is('target_wallet', null)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: 'Gagal memuat notifikasi publik.' }, { status: 500 })

  const notifications = (data ?? []).map(mapNotificationRow)
  return NextResponse.json({ notifications })
}
