import { NextResponse, type NextRequest } from 'next/server'
import { ensureCanManageProposal, jsonError, requireProfile } from '@/app/api/_lib/auth'
import { ensureWhitelistMutable } from '@/app/api/_lib/whitelist-guard'
import type { Database } from '@/lib/supabase/database.types'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type WhitelistRow = Database['app']['Tables']['proposal_whitelist_entries']['Row']

function mapWhitelistRow(row: WhitelistRow) {
  return {
    id: row.id,
    proposalDraftId: row.proposal_draft_id,
    walletAddress: row.wallet_address,
    voterName: row.voter_name,
    source: row.source,
    validationStatus: row.validation_status,
    syncStatus: row.sync_status,
    latestSyncTxHash: row.latest_sync_tx_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const { id } = await context.params
  const permissionError = await ensureCanManageProposal(auth.client, auth.profile, id)
  if (permissionError) return permissionError
  const whitelistGuard = await ensureWhitelistMutable(auth.client, id)
  if ('error' in whitelistGuard) return whitelistGuard.error

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) return jsonError('Payload whitelist tidak valid.')
  const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim().toLowerCase() : ''
  if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) return jsonError('Format alamat wallet tidak valid.')
  const voterName = typeof body.voterName === 'string' && body.voterName.trim() ? body.voterName.trim() : null

  const { data, error } = await auth.client
    .from('proposal_whitelist_entries')
    .insert({
      proposal_draft_id: id,
      wallet_address: walletAddress,
      voter_name: voterName,
      source: 'manual',
      validation_status: 'valid',
      sync_status: 'pending',
    })
    .select('*')
    .single()

  if (error) return jsonError('Gagal menambahkan pemilih ke whitelist. Periksa duplikasi wallet atau hak akses.', 500)
  return NextResponse.json({ entry: mapWhitelistRow(data) })
}
