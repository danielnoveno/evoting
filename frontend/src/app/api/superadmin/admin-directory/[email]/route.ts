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
 * PATCH /api/superadmin/admin-directory/[email]
 * Body: { email, organizationName?, displayName?, description?, walletAddress?, status? }
 *
 * Update admin registry entry + sync profile role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { email: string } },
) {
  const auth = await requireProfile(request, ['super_admin'])
  if ('error' in auth) return auth.error

  const oldEmail = normalizeEmail(decodeURIComponent(params.email))
  if (!oldEmail) return jsonError('Email admin tidak valid.', 400)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError('Format permintaan tidak valid.', 400)
  }

  if (!isRecord(payload)) return jsonError('Data tidak valid.', 400)

  const nextEmail = normalizeEmail(payload.email) || oldEmail
  const organizationName = typeof payload.organizationName === 'string' ? payload.organizationName.trim() : null
  const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : null
  const description = typeof payload.description === 'string' ? payload.description.trim() : null
  const walletAddress = typeof payload.walletAddress === 'string' ? payload.walletAddress.trim() : null
  const status = payload.status === 'active' ? 'active' : payload.status === 'inactive' ? 'inactive' : 'pending'

  // Fetch current record
  const { data: current, error: fetchError } = await auth.client
    .from('admin_registry')
    .select('*')
    .eq('email', oldEmail)
    .single()

  if (fetchError || !current) return jsonError('Data admin tidak ditemukan.', 404)

  const actorProfileId = await getActorProfileId(auth.client)

  const { data, error } = await auth.client
    .from('admin_registry')
    .update({
      email: nextEmail,
      organization_name: organizationName || displayName || null,
      access_scope: 'specific',
      status,
      description,
      wallet_address: walletAddress,
      updated_by: actorProfileId,
    })
    .eq('email', oldEmail)
    .select('*')
    .single()

  if (error) return jsonError('Gagal memperbarui admin organisasi. Coba lagi.', 500)

  // Sync profile roles
  if (oldEmail !== nextEmail) {
    await syncProfileRole(auth.client, oldEmail, 'voter')
  }
  await syncProfileRole(auth.client, nextEmail, current.assigned_role, organizationName || displayName)

  const actor = await getActorInfo(auth.client)
  await logAudit({
    action_name: 'update_admin',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'admin_registry',
    entity_id: nextEmail,
    details: { oldEmail, nextEmail, organizationName, status },
    related_tx_hash: null,
    source: 'server_api',
  })

  return NextResponse.json({
    admin: {
      email: data.email,
      assignedRole: data.assigned_role,
      organizationName: data.organization_name,
      accessScope: data.access_scope,
      status: data.status,
      description: data.description,
      walletAddress: data.wallet_address,
      activationExpiresAt: data.activation_expires_at,
      activationAcceptedAt: data.activation_accepted_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  })
}

/**
 * DELETE /api/superadmin/admin-directory/[email]
 *
 * Delete admin registry entry + reset profile role to voter.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { email: string } },
) {
  const auth = await requireProfile(_request, ['super_admin'])
  if ('error' in auth) return auth.error

  const email = normalizeEmail(decodeURIComponent(params.email))
  if (!email) return jsonError('Email admin tidak valid.', 400)

  const { error } = await auth.client
    .from('admin_registry')
    .delete()
    .eq('email', email)

  if (error) return jsonError('Gagal menghapus admin organisasi. Coba lagi.', 500)

  // Reset profile role
  await syncProfileRole(auth.client, email, 'voter')

  const actor = await getActorInfo(auth.client)
  await logAudit({
    action_name: 'delete_admin',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'admin_registry',
    entity_id: email,
    details: { email },
    related_tx_hash: null,
    source: 'server_api',
  })

  return NextResponse.json({ success: true })
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
  displayName?: string | null,
) {
  const payload: Record<string, unknown> = { role }
  if (displayName !== undefined) payload.display_name = displayName

  await client
    .from('app_profiles')
    .update(payload)
    .ilike('email', email)
}
