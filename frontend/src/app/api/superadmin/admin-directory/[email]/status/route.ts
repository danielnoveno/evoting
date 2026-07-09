import { NextResponse, type NextRequest } from 'next/server'
import { jsonError, requireProfile, type ServiceClient } from '@/app/api/_lib/auth'
import { logAudit, getActorInfo } from '@/lib/audit-logger'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/**
 * PATCH /api/superadmin/admin-directory/[email]/status
 * Body: { status: 'pending' | 'active' | 'inactive' }
 *
 * Toggle admin registry status + sync profile role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { email: string } },
) {
  const auth = await requireProfile(request, ['super_admin'])
  if ('error' in auth) return auth.error

  const email = normalizeEmail(decodeURIComponent(params.email))
  if (!email) return jsonError('Email admin tidak valid.', 400)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError('Format permintaan tidak valid.', 400)
  }

  if (!isRecord(payload)) return jsonError('Data tidak valid.', 400)

  const status = payload.status === 'active' ? 'active' : payload.status === 'inactive' ? 'inactive' : 'pending'

  // Fetch current record
  const { data: current, error: fetchError } = await auth.client
    .from('admin_registry')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (fetchError) return jsonError('Gagal memuat registry akses. Coba lagi.', 500)
  if (!current) return jsonError('Registry akses tidak ditemukan untuk email ini.', 404)

  const actorProfileId = await getActorProfileId(auth.client)

  const { error } = await auth.client
    .from('admin_registry')
    .update({ status, updated_by: actorProfileId })
    .eq('email', email)

  if (error) return jsonError('Gagal memperbarui status akses. Coba lagi.', 500)

  // Sync profile role
  await syncProfileRole(auth.client, email, current.assigned_role)

  const actor = await getActorInfo(auth.client)
  await logAudit({
    action_name: 'update_admin_status',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'admin_registry',
    entity_id: email,
    details: { email, oldStatus: current.status, newStatus: status },
    related_tx_hash: null,
    source: 'server_api',
  })

  return NextResponse.json({ success: true, status })
}

async function getActorProfileId(client: ServiceClient): Promise<string | null> {
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) return null
  const { data: profile } = await client
    .from('app_profiles')
    .select('id')
    .eq('user_id', userData.user.id)
    .maybeSingle()
  return profile?.id ?? null
}

async function syncProfileRole(
  client: ServiceClient,
  email: string,
  role: string,
) {
  await client
    .from('app_profiles')
    .update({ role })
    .ilike('email', email)
}
