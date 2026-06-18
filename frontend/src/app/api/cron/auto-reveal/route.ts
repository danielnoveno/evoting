import { NextResponse, type NextRequest } from 'next/server'
import { createPublicClient, createWalletClient, http, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getRpcUrl() {
  return process.env.BASE_SEPOLIA_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim()
    || 'https://sepolia.base.org'
}

function getPrivateKey(): Hex | null {
  const raw = process.env.AUTO_REVEAL_RELAYER_PRIVATE_KEY?.trim()
    || process.env.RELAYER_PRIVATE_KEY?.trim()
  if (!raw) return null
  const value = raw.startsWith('0x') ? raw : `0x${raw}`
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value as Hex : null
}

function getCronSecret() {
  return process.env.AUTO_REVEAL_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim() || ''
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value)
}

export async function POST(request: NextRequest) {
  const secret = getCronSecret()
  if (secret && request.headers.get('x-cron-secret') !== secret) {
    return jsonError('Akses cron tidak diizinkan.', 401)
  }

  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const privateKey = getPrivateKey()
  if (!privateKey) return jsonError('AUTO_REVEAL_RELAYER_PRIVATE_KEY belum dikonfigurasi.', 503)

  const account = privateKeyToAccount(privateKey)
  const transport = http(getRpcUrl())
  const publicClient = createPublicClient({ chain: baseSepolia, transport })
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport })

  const { data: queuedRows, error } = await client
    .from('tx_audit_log')
    .select('id, proposal_draft_id, space_id, wallet_address, tx_hash, metadata')
    .eq('status', 'auto_reveal_queued')
    .eq('source', 'voter_one_click_flow')
    .limit(20)

  if (error) return jsonError('Gagal memuat antrean auto reveal.', 500)

  const now = Date.now()
  const results: Array<{ id: string; status: string; txHash?: string; error?: string }> = []

  for (const row of queuedRows ?? []) {
    const metadata = row.metadata
    if (!isRecord(metadata)) {
      results.push({ id: row.id, status: 'skipped', error: 'metadata tidak valid' })
      continue
    }

    const revealStartAt = asString(metadata.revealStartAt)
    if (revealStartAt && new Date(revealStartAt).getTime() > now) {
      results.push({ id: row.id, status: 'waiting_schedule' })
      continue
    }

    const contractAddress = asString(metadata.contractAddress) as `0x${string}`
    const voter = row.wallet_address as `0x${string}`
    const candidateId = asNumber(metadata.candidateId)
    const salt = asString(metadata.salt) as `0x${string}`

    try {
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi: ElectionSpaceArtifact.abi,
        functionName: 'revealFor',
        args: [voter, BigInt(candidateId), salt],
      })

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      await client.from('tx_audit_log').update({
        status: 'auto_reveal_done',
        metadata: {
          ...metadata,
          revealStatus: 'done',
          revealTxHash: txHash,
          revealBlockNumber: Number(receipt.blockNumber),
          revealedAt: new Date().toISOString(),
          relayerWallet: account.address,
        },
      }).eq('id', row.id)

      await client.from('tx_audit_log').insert({
        proposal_draft_id: row.proposal_draft_id,
        space_id: row.space_id,
        wallet_address: row.wallet_address,
        action_type: 'reveal_vote',
        tx_hash: txHash,
        block_number: Number(receipt.blockNumber),
        status: 'success',
        source: 'auto_reveal_relayer',
        metadata: {
          commitTxHash: row.tx_hash,
          candidateId,
          relayerWallet: account.address,
          contractAddress,
        },
      })

      results.push({ id: row.id, status: 'revealed', txHash })
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 240) : 'Auto reveal gagal.'
      await client.from('tx_audit_log').update({
        status: 'auto_reveal_failed',
        metadata: {
          ...metadata,
          revealStatus: 'failed',
          lastError: message,
          failedAt: new Date().toISOString(),
          relayerWallet: account.address,
        },
      }).eq('id', row.id)
      results.push({ id: row.id, status: 'failed', error: message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
