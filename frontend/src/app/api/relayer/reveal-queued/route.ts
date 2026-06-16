import { NextResponse, type NextRequest } from 'next/server'
import { createPublicClient, createWalletClient, http, type Address, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RevealAuthorizationRow = {
  id: string
  proposal_draft_id: string
  voter_wallet: string
  contract_address: string
  chain_id: number
  candidate_number: number
  salt: string
}

function getRpcUrl() {
  return process.env.BASE_SEPOLIA_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim()
    || 'https://sepolia.base.org'
}

function isAuthorizedCron(request: NextRequest) {
  const configuredSecret = process.env.REVEAL_RELAYER_SECRET?.trim()
  if (!configuredSecret) return false
  return request.headers.get('authorization') === `Bearer ${configuredSecret}`
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Akses relayer tidak diizinkan.' }, { status: 401 })
  }

  const privateKey = process.env.REVEAL_RELAYER_PRIVATE_KEY?.trim() as Hex | undefined
  if (!privateKey?.startsWith('0x')) {
    return NextResponse.json({ error: 'Private key relayer belum dikonfigurasi.' }, { status: 503 })
  }

  const client = getSupabaseServiceRoleClient() as any
  if (!client) return NextResponse.json({ error: 'Service role Supabase belum dikonfigurasi.' }, { status: 503 })

  const account = privateKeyToAccount(privateKey)
  const transport = http(getRpcUrl())
  const publicClient = createPublicClient({ chain: baseSepolia, transport })
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport })

  const { data: rows, error } = await client
    .schema('app')
    .from('reveal_authorizations')
    .select('*')
    .eq('status', 'queued')
    .limit(10)

  if (error) return NextResponse.json({ error: 'Gagal memuat antrean pengesahan suara.' }, { status: 500 })

  const results: Array<{ id: string; status: 'submitted' | 'failed'; txHash?: string; error?: string }> = []

  for (const row of (rows ?? []) as RevealAuthorizationRow[]) {
    try {
      const currentPhase = await publicClient.readContract({
        address: row.contract_address as Address,
        abi: ElectionSpaceArtifact.abi,
        functionName: 'phase',
      })

      if (Number(currentPhase) !== 2) {
        continue
      }

      const hash = await walletClient.writeContract({
        address: row.contract_address as Address,
        abi: ElectionSpaceArtifact.abi,
        functionName: 'revealFor',
        args: [row.voter_wallet as Address, BigInt(row.candidate_number), row.salt as Hex],
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      await client.schema('app').from('reveal_authorizations').update({
        status: 'submitted',
        reveal_tx_hash: hash,
        error_message: null,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id)

      await client.schema('app').from('tx_audit_log').upsert({
        proposal_draft_id: row.proposal_draft_id,
        wallet_address: row.voter_wallet,
        action_type: 'reveal_vote',
        tx_hash: hash,
        block_number: Number(receipt.blockNumber),
        status: 'success',
        source: 'reveal_relayer',
        metadata: {
          relayer: account.address,
          contractAddress: row.contract_address,
          candidateNumber: row.candidate_number,
        },
      }, { onConflict: 'tx_hash,action_type' })

      results.push({ id: row.id, status: 'submitted', txHash: hash })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pengesahan otomatis gagal.'
      await client.schema('app').from('reveal_authorizations').update({
        status: 'failed',
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq('id', row.id)
      results.push({ id: row.id, status: 'failed', error: message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
