import { NextResponse, type NextRequest } from 'next/server'
import { ensureCanManageProposal, jsonError, requireProfile } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function POST(request: NextRequest) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) return jsonError('Payload tidak valid.')

  const proposalDraftId = typeof body.proposalDraftId === 'string' ? body.proposalDraftId.trim() : ''
  if (!proposalDraftId) return jsonError('proposalDraftId wajib diisi.')

  const masterVoterIds = Array.isArray(body.masterVoterIds) ? body.masterVoterIds.filter((id): id is string => typeof id === 'string') : []
  if (masterVoterIds.length === 0) return jsonError('Pilih minimal satu voter dari master data.')

  const permissionError = await ensureCanManageProposal(auth.client, auth.profile, proposalDraftId)
  if (permissionError) return permissionError

  // Fetch master voters by IDs
  const { data: masterVoters, error: fetchError } = await auth.client
    .schema('app')
    .from('master_voters')
    .select('id, nim, full_name, email, wallet_address')
    .in('id', masterVoterIds)

  if (fetchError) return jsonError('Gagal memuat data master voter.', 500)
  if (!masterVoters || masterVoters.length === 0) return jsonError('Tidak ada data master voter yang ditemukan.')

  // Filter voters that have a wallet address
  const votersWithWallet = masterVoters.filter((v) => v.wallet_address && /^0x[a-f0-9]{40}$/.test(v.wallet_address))
  const skipped = masterVoters.length - votersWithWallet.length

  if (votersWithWallet.length === 0) {
    return NextResponse.json({ added: 0, skipped, message: 'Tidak ada voter yang memiliki alamat wallet valid.' })
  }

  // Check which wallets are already in whitelist
  const wallets = votersWithWallet.map((v) => v.wallet_address!.toLowerCase())
  const { data: existingEntries } = await auth.client
    .schema('app')
    .from('proposal_whitelist_entries')
    .select('wallet_address')
    .eq('proposal_draft_id', proposalDraftId)
    .in('wallet_address', wallets)

  const existingWallets = new Set((existingEntries ?? []).map((e) => e.wallet_address))
  const newVoters = votersWithWallet.filter((v) => !existingWallets.has(v.wallet_address!.toLowerCase()))

  if (newVoters.length === 0) {
    return NextResponse.json({ added: 0, skipped: skipped + votersWithWallet.length, message: 'Semua voter terpilih sudah ada di whitelist.' })
  }

  // Bulk insert new whitelist entries
  const entries = newVoters.map((v) => ({
    proposal_draft_id: proposalDraftId,
    wallet_address: v.wallet_address!.toLowerCase(),
    voter_name: v.full_name,
    source: 'manual' as const,
    validation_status: 'valid' as const,
    sync_status: 'pending' as const,
  }))

  const { error: insertError } = await auth.client
    .schema('app')
    .from('proposal_whitelist_entries')
    .insert(entries)

  if (insertError) return jsonError('Gagal menambahkan pemilih ke whitelist. Periksa duplikasi.', 500)

  const addedSkipped = skipped + (votersWithWallet.length - newVoters.length)
  return NextResponse.json({ added: newVoters.length, skipped: addedSkipped })
}
