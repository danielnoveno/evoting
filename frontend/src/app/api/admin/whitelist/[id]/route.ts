import { NextResponse, type NextRequest } from 'next/server'
import { ensureCanManageProposal, jsonError, requireProfile } from '@/app/api/_lib/auth'
import { ensureSuccessfulContractTx, ensureWalletWhitelistState, ensureWhitelistMutable } from '@/app/api/_lib/whitelist-guard'
import { logAudit, getActorInfo } from '@/lib/audit-logger'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const { id } = await context.params
  const body: unknown = await request.json().catch(() => null)
  const unregisterTxHash = isRecord(body) && typeof body.unregisterTxHash === 'string' ? body.unregisterTxHash.trim() : null

  const { data: row, error: loadError } = await auth.client
    .from('proposal_whitelist_entries')
    .select('id, proposal_draft_id, wallet_address, sync_status')
    .eq('id', id)
    .maybeSingle()

  if (loadError) return jsonError('Gagal memuat data whitelist.', 500)
  if (!row) return jsonError('Data whitelist tidak ditemukan.', 404)

  const permissionError = await ensureCanManageProposal(auth.client, auth.profile, row.proposal_draft_id)
  if (permissionError) return permissionError
  const whitelistGuard = await ensureWhitelistMutable(auth.client, row.proposal_draft_id)
  if ('error' in whitelistGuard) return whitelistGuard.error
  if (row.sync_status === 'synced') {
    if (!unregisterTxHash || !/^0x[a-fA-F0-9]{64}$/.test(unregisterTxHash)) {
      return jsonError('Pemilih sudah tersinkron on-chain. Hapus wajib menyertakan transaksi unregister yang valid.', 409)
    }
    const txError = await ensureSuccessfulContractTx(unregisterTxHash, whitelistGuard.proposal.deployed_space_address)
    if (txError) return txError
    const whitelistStateError = await ensureWalletWhitelistState(whitelistGuard.proposal.deployed_space_address, [row.wallet_address], false)
    if (whitelistStateError) return whitelistStateError
  }

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
    related_tx_hash: unregisterTxHash,
    source: 'server_api',
  })

  return NextResponse.json({ ok: true })
}
