import { NextResponse, type NextRequest } from 'next/server'
import { createPublicClient, createWalletClient, http, type Hex, recoverAddress, hashMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function getRpcUrl() {
  return process.env.BASE_SEPOLIA_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim()
    || 'https://sepolia.base.org'
}

function getRelayerKey(): Hex | null {
  const raw = process.env.RELAYER_PRIVATE_KEY?.trim()
    || process.env.AUTO_REVEAL_RELAYER_PRIVATE_KEY?.trim()
  if (!raw) return null
  const value = raw.startsWith('0x') ? raw : `0x${raw}`
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value as Hex : null
}

function getRelayerApiKey() {
  return process.env.RELAYER_API_KEY?.trim() || ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

/**
 * POST /api/relayer/commit
 *
 * Accepts a voter-signed commit request and submits it on-chain via relayer EOA.
 * The transaction will appear in Basescan's "Transactions" tab for the contract,
 * because the relayer calls commitFor() directly (not through Account Abstraction).
 *
 * Body: {
 *   voter: string          — voter's wallet address
 *   commitment: string     — keccak256 hash (bytes32 hex)
 *   contractAddress: string — ElectionSpace contract address
 *   signature: string      — EIP-191 personal_sign signature of the commit message
 * }
 *
 * The signature must be over: "VoteChain commit: {commitment} for {contractAddress}"
 * signed by the voter's private key.
 */
export async function POST(request: NextRequest) {
  // ── Auth: check API key ──
  const apiKey = getRelayerApiKey()
  if (apiKey && request.headers.get('x-relayer-api-key') !== apiKey) {
    return jsonError('Akses relayer tidak diizinkan.', 401)
  }

  // ── Parse body ──
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('Body request tidak valid.')
  }

  if (!isRecord(body)) return jsonError('Body request harus JSON object.')

  const voter = asString(body.voter) as `0x${string}`
  const commitment = asString(body.commitment) as `0x${string}`
  const contractAddress = asString(body.contractAddress) as `0x${string}`
  const signature = asString(body.signature) as `0x${string}`

  if (!voter || !/^0x[a-fA-F0-9]{40}$/.test(voter)) {
    return jsonError('Alamat voter tidak valid.')
  }
  if (!commitment || !/^0x[a-fA-F0-9]{64}$/.test(commitment)) {
    return jsonError('Commitment tidak valid (harus bytes32 hex).')
  }
  if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    return jsonError('Alamat kontrak tidak valid.')
  }
  if (!signature || !/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    return jsonError('Signature tidak valid.')
  }

  // ── Recover signer from signature ──
  const message = `VoteChain commit: ${commitment} for ${contractAddress}`
  const messageHash = hashMessage(message)
  try {
    const recovered = await recoverAddress({ hash: messageHash, signature })
    if (recovered.toLowerCase() !== voter.toLowerCase()) {
      return jsonError('Signature tidak sesuai dengan alamat voter.')
    }
  } catch {
    return jsonError('Gagal memverifikasi signature.')
  }

  // ── Setup relayer wallet ──
  const privateKey = getRelayerKey()
  if (!privateKey) return jsonError('RELAYER_PRIVATE_KEY belum dikonfigurasi.', 503)

  const account = privateKeyToAccount(privateKey)
  const transport = http(getRpcUrl())
  const publicClient = createPublicClient({ chain: baseSepolia, transport })
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport })

  // ── Check if voter already committed on-chain ──
  try {
    const alreadyCommitted = await publicClient.readContract({
      address: contractAddress,
      abi: ElectionSpaceArtifact.abi,
      functionName: 'hasCommitted',
      args: [voter],
    })
    if (alreadyCommitted) {
      return jsonError('Voter sudah pernah melakukan commit untuk pemilihan ini.')
    }
  } catch {
    // If we can't read, proceed anyway — the contract will revert if double-commit
  }

  // ── Submit commitFor on-chain ──
  try {
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: ElectionSpaceArtifact.abi,
      functionName: 'commitFor',
      args: [voter, commitment],
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

    // ── Log to Supabase ──
    const client = getSupabaseServiceRoleClient()
    if (client) {
      await client.from('tx_audit_log').insert({
        wallet_address: voter,
        action_type: 'commit_vote_relayed',
        tx_hash: txHash,
        block_number: Number(receipt.blockNumber),
        status: 'success',
        source: 'commit_relayer',
        metadata: {
          commitment,
          contractAddress,
          relayerWallet: account.address,
          blockNumber: Number(receipt.blockNumber),
          gasUsed: Number(receipt.gasUsed),
        },
      })
    }

    return NextResponse.json({
      success: true,
      txHash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: Number(receipt.gasUsed),
      relayerAddress: account.address,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 240) : 'Commit relayer gagal.'

    // Log failure
    const client = getSupabaseServiceRoleClient()
    if (client) {
      await client.from('tx_audit_log').insert({
        wallet_address: voter,
        action_type: 'commit_vote_relayed',
        status: 'failed',
        source: 'commit_relayer',
        metadata: {
          commitment,
          contractAddress,
          relayerWallet: account.address,
          lastError: message,
        },
      })
    }

    return jsonError(`Relayer gagal mengirim transaksi: ${message}`, 500)
  }
}
