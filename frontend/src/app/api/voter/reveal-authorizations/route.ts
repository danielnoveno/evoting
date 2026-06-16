import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireProfile } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

const payloadSchema = z.object({
  proposalDraftId: z.string().uuid(),
  voterWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().int().positive(),
  candidateId: z.string().min(1),
  candidateNumber: z.number().int().positive(),
  salt: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  commitment: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  commitTxHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
})

export async function POST(request: NextRequest) {
  const auth = await requireProfile(request, ['voter'])
  if ('error' in auth) return auth.error

  const json = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Data pengesahan otomatis tidak valid.' }, { status: 400 })
  }

  const payload = parsed.data
  const profileWallet = auth.profile.wallet_address?.trim().toLowerCase()
  if (profileWallet && profileWallet !== payload.voterWallet.toLowerCase()) {
    return NextResponse.json({ error: 'Dompet digital tidak sesuai dengan akun pemilih.' }, { status: 403 })
  }

  const client = auth.client as any
  const { error } = await client
    .schema('app')
    .from('reveal_authorizations')
    .upsert({
      proposal_draft_id: payload.proposalDraftId,
      voter_profile_id: auth.profile.id,
      voter_wallet: payload.voterWallet.toLowerCase(),
      contract_address: payload.contractAddress,
      chain_id: payload.chainId,
      candidate_id: payload.candidateId,
      candidate_number: payload.candidateNumber,
      salt: payload.salt,
      commitment: payload.commitment,
      commit_tx_hash: payload.commitTxHash,
      status: 'queued',
      error_message: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'proposal_draft_id,voter_wallet' })

  if (error) {
    return NextResponse.json({ error: 'Gagal menyiapkan pengesahan suara otomatis.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
