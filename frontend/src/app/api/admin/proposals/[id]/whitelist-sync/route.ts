import { NextResponse, type NextRequest } from 'next/server'
import { ensureCanManageProposal, jsonError, requireProfile } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const { id } = await context.params
  const permissionError = await ensureCanManageProposal(auth.client, auth.profile, id)
  if (permissionError) return permissionError

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) return jsonError('Payload sinkronisasi whitelist tidak valid.')
  const txHash = typeof body.txHash === 'string' ? body.txHash.trim() : ''
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) return jsonError('Hash transaksi sinkronisasi tidak valid.')
  const walletAddresses = Array.isArray(body.walletAddresses)
    ? body.walletAddresses.filter((item): item is string => typeof item === 'string').map((item) => item.trim().toLowerCase()).filter((item) => /^0x[a-f0-9]{40}$/.test(item))
    : []
  if (walletAddresses.length === 0) return jsonError('Daftar wallet untuk sinkronisasi kosong.')

  const { error } = await auth.client
    .from('proposal_whitelist_entries')
    .update({ sync_status: 'synced', latest_sync_tx_hash: txHash })
    .eq('proposal_draft_id', id)
    .in('wallet_address', Array.from(new Set(walletAddresses)))

  if (error) return jsonError('Gagal memperbarui status sinkronisasi whitelist.', 500)
  return NextResponse.json({ ok: true })
}
