import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

interface AuditLogEntry {
  action_name: string
  actor_wallet: string | null
  actor_email: string | null
  actor_role: string | null
  entity_type: string
  entity_id: string
  details: Record<string, unknown>
  related_tx_hash: string | null
  source: 'frontend' | 'server_api'
}

/**
 * Write a detailed entry to ops_audit_log.
 * This is a fire-and-forget function — errors are logged to console but never block the caller.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return

  try {
    const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY) as SupabaseClient
    await client.schema('app').from('ops_audit_log').insert({
      action_name: entry.action_name,
      actor_wallet: entry.actor_wallet ?? null,
      actor_email: entry.actor_email ?? null,
      actor_role: entry.actor_role ?? null,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      related_tx_hash: entry.related_tx_hash ?? null,
      source: entry.source,
      metadata: entry.details,
    })
  } catch (error) {
    console.error('[audit-log] Failed to write audit log:', error)
  }
}

/**
 * Helper to extract actor info from Supabase auth + profile.
 */
export async function getActorInfo(
  client: SupabaseClient,
): Promise<{ wallet: string | null; email: string | null; role: string | null }> {
  try {
    const { data: userData } = await client.auth.getUser()
    const userId = userData.user?.id
    const email = userData.user?.email ?? null
    if (!userId) return { wallet: null, email, role: null }

    const { data: profile } = await client
      .schema('app')
      .from('app_profiles')
      .select('role,wallet_address')
      .eq('user_id', userId)
      .maybeSingle()

    return {
      wallet: (profile as Record<string, unknown>)?.wallet_address as string ?? null,
      email,
      role: (profile as Record<string, unknown>)?.role as string ?? null,
    }
  } catch {
    return { wallet: null, email: null, role: null }
  }
}
