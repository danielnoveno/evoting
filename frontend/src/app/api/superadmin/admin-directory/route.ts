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
 * POST /api/superadmin/admin-directory
 * Body: { email, organizationName?, displayName?, description?, walletAddress?, status? }
 *
 * Create admin registry entry + sync profile role.
 */
export async function POST(request: NextRequest) {
  const auth = await requireProfile(request, ['super_admin'])
  if ('error' in auth) return auth.error

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError('Format permintaan tidak valid.', 400)
  }

  if (!isRecord(payload)) return jsonError('Data tidak valid.', 400)

  const email = normalizeEmail(payload.email)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError('Email admin tidak valid.', 400)
  }

  const organizationName = typeof payload.organizationName === 'string' ? payload.organizationName.trim() : null
  const displayName = typeof payload.displayName === 'string' ? payload.displayName.trim() : null
  const description = typeof payload.description === 'string' ? payload.description.trim() : null
  const walletAddress = typeof payload.walletAddress === 'string' ? payload.walletAddress.trim() : null
  const status = payload.status === 'inactive' ? 'inactive' : 'pending'

  // Check duplicate
  const { data: existing } = await auth.client
    .from('admin_registry')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (existing) return jsonError('Email ini sudah terdaftar sebagai admin organisasi.', 409)

  const actorProfileId = await getActorProfileId(auth.client)

  const { data, error } = await auth.client
    .from('admin_registry')
    .insert({
      email,
      assigned_role: 'admin',
      organization_name: organizationName || displayName || null,
      access_scope: 'specific',
      status,
      description,
      wallet_address: walletAddress,
      created_by: actorProfileId,
      updated_by: actorProfileId,
    })
    .select('*')
    .single()

  if (error) return jsonError('Gagal menambahkan admin organisasi. Coba lagi.', 500)

  // Sync profile role
  if (status !== 'inactive') {
    await syncProfileRole(auth.client, email, 'admin', organizationName || displayName)
  }

  const actor = await getActorInfo(auth.client)
  await logAudit({
    action_name: 'add_admin',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'admin_registry',
    entity_id: data.email,
    details: { email, organizationName, status },
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
