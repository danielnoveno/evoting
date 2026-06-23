import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { requireProfile } from '@/app/api/_lib/auth'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'

interface NotificationEntry {
  targetProfileId?: string | null
  payload: Record<string, unknown>
}

interface NotifyAllSuperadminsPayload {
  mode: 'superadmins'
  payload: Record<string, unknown>
}

interface NotifyTargetPayload {
  mode: 'target'
  targetProfileId: string
  payload: Record<string, unknown>
}

interface NotifyBatchPayload {
  mode: 'batch'
  entries: NotificationEntry[]
}

type RequestBody = NotifyAllSuperadminsPayload | NotifyTargetPayload | NotifyBatchPayload

export async function POST(request: NextRequest) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 })

  const client = getSupabaseServiceRoleClient()
  if (!client) return NextResponse.json({ error: 'Service role Supabase belum dikonfigurasi.' }, { status: 503 })

  const mode = body.mode

  if (mode === 'superadmins') {
    // Find all superadmin profile IDs
    const { data: superadmins, error: queryError } = await client
      .schema('app')
      .from('app_profiles')
      .select('id')
      .eq('role', 'super_admin')

    if (queryError) return NextResponse.json({ error: 'Gagal memuat daftar superadmin.' }, { status: 500 })

    const ids = (superadmins ?? []).map((row: { id: string }) => row.id)
    if (ids.length === 0) return NextResponse.json({ ok: true, inserted: 0 })

    const rows = ids.map((id) => ({
      target_profile_id: id,
      channel: 'in_app',
      template_key: 'proposal_activity',
      status: 'sent',
      payload: body.payload,
    }))

    const { error: insertError } = await client
      .schema('app')
      .from('notification_jobs')
      .insert(rows)

    if (insertError) return NextResponse.json({ error: 'Gagal menyimpan notifikasi.' }, { status: 500 })
    return NextResponse.json({ ok: true, inserted: rows.length })
  }

  if (mode === 'target') {
    const targetProfileId = typeof body.targetProfileId === 'string' ? body.targetProfileId : null
    if (!targetProfileId) return NextResponse.json({ error: 'targetProfileId wajib diisi.' }, { status: 400 })

    const { error: insertError } = await client
      .schema('app')
      .from('notification_jobs')
      .insert({
        target_profile_id: targetProfileId,
        channel: 'in_app',
        template_key: 'proposal_activity',
        status: 'sent',
        payload: body.payload,
      })

    if (insertError) return NextResponse.json({ error: 'Gagal menyimpan notifikasi.' }, { status: 500 })
    return NextResponse.json({ ok: true, inserted: 1 })
  }

  if (mode === 'batch') {
    const entries = Array.isArray(body.entries) ? body.entries : []
    if (entries.length === 0) return NextResponse.json({ ok: true, inserted: 0 })

    const rows = entries
      .filter((e: NotificationEntry) => typeof e.targetProfileId === 'string')
      .map((e: NotificationEntry) => ({
        target_profile_id: e.targetProfileId,
        channel: 'in_app',
        template_key: 'proposal_activity',
        status: 'sent',
        payload: e.payload,
      }))

    if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0 })

    const { error: insertError } = await client
      .schema('app')
      .from('notification_jobs')
      .insert(rows)

    if (insertError) return NextResponse.json({ error: 'Gagal menyimpan notifikasi.' }, { status: 500 })
    return NextResponse.json({ ok: true, inserted: rows.length })
  }

  if (mode === 'public') {
    // Public broadcast notification — no target, visible to all visitors
    const { error: insertError } = await client
      .schema('app')
      .from('notification_jobs')
      .insert({
        channel: 'in_app',
        template_key: 'public_election',
        status: 'sent',
        payload: body.payload,
      })

    if (insertError) return NextResponse.json({ error: 'Gagal menyimpan notifikasi publik.' }, { status: 500 })
    return NextResponse.json({ ok: true, inserted: 1 })
  }

  return NextResponse.json({ error: `Mode "${mode}" tidak dikenali.`, modes: ['superadmins', 'target', 'batch', 'public'] }, { status: 400 })
}
