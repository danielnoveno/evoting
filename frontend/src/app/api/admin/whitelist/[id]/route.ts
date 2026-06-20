import { NextResponse, type NextRequest } from 'next/server'
import { ensureCanManageProposal, jsonError, requireProfile } from '@/app/api/_lib/auth'
import { logAudit, getActorInfo } from '@/lib/audit-logger'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const { id } = await context.params

  const { data: row, error: loadError } = await auth.client
    .from('proposal_whitelist_entries')
    .select('id, proposal_draft_id')
    .eq('id', id)
    .maybeSingle()

  if (loadError) return jsonError('Gagal memuat data whitelist.', 500)
  if (!row) return jsonError('Data whitelist tidak ditemukan.', 404)

  const permissionError = await ensureCanManageProposal(auth.client, auth.profile, row.proposal_draft_id)
  if (permissionError) return permissionError

  const { error } = await auth.client.from('proposal_whitelist_entries').delete().eq('id', id)
  if (error) return jsonError('Gagal menghapus pemilih dari whitelist.', 500)

  // Log the action
  const actor = await getActorInfo(auth.client)
  await logAudit({
    action_name: 'remove_whitelist',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'proposal_whitelist',
    entity_id: row.proposal_draft_id,
    details: { removedEntryId: id },
    related_tx_hash: null,
    source: 'server_api',
  })

  return NextResponse.json({ ok: true })
}
