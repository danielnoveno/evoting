import { NextResponse, type NextRequest } from 'next/server'
import { ensureCanManageProposal, jsonError, requireProfile } from '@/app/api/_lib/auth'
import { ensureSuccessfulContractTx, ensureWalletWhitelistState, ensureWhitelistMutable } from '@/app/api/_lib/whitelist-guard'
import { logAudit, getActorInfo } from '@/lib/audit-logger'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const { id } = await context.params
  const permissionError = await ensureCanManageProposal(auth.client, auth.profile, id)
  if (permissionError) return permissionError
  const whitelistGuard = await ensureWhitelistMutable(auth.client, id)
  if ('error' in whitelistGuard) return whitelistGuard.error

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) return jsonError('Payload sinkronisasi whitelist tidak valid.')
  const txHash = typeof body.txHash === 'string' ? body.txHash.trim() : ''
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) return jsonError('Hash transaksi sinkronisasi tidak valid.')
  const walletAddresses = Array.isArray(body.walletAddresses)
    ? body.walletAddresses.filter((item): item is string => typeof item === 'string').map((item) => item.trim().toLowerCase()).filter((item) => /^0x[a-f0-9]{40}$/.test(item))
    : []
  if (walletAddresses.length === 0) return jsonError('Daftar wallet untuk sinkronisasi kosong.')
  const txError = await ensureSuccessfulContractTx(txHash, whitelistGuard.proposal.deployed_space_address)
  if (txError) return txError
  const whitelistStateError = await ensureWalletWhitelistState(whitelistGuard.proposal.deployed_space_address, walletAddresses, true)
  if (whitelistStateError) return whitelistStateError

  const { error } = await auth.client
    .from('proposal_whitelist_entries')
    .update({ validation_status: 'synced', sync_status: 'synced', latest_sync_tx_hash: txHash })
    .eq('proposal_draft_id', id)
    .in('wallet_address', Array.from(new Set(walletAddresses)))

  if (error) return jsonError('Gagal memperbarui status sinkronisasi whitelist.', 500)

  // Log the action
  const actor = await getActorInfo(auth.client)
  await logAudit({
    action_name: 'sync_whitelist',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'proposal_whitelist',
    entity_id: id,
    details: { syncedCount: walletAddresses.length, txHash },
    related_tx_hash: txHash,
    source: 'server_api',
  })

  return NextResponse.json({ ok: true })
}
