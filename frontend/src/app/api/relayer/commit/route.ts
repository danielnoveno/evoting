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
 * Extract raw ECDSA signature (65 bytes) from various formats:
 * - Standard EOA: 0x + 130 hex chars (r + s + v)
 * - ABI-encoded SCW (Base Account SDK): wrapped in ABI bytes or tuple encoding
 *
 * Base Account SDK wraps the ECDSA signature in ABI-encoded form, e.g.:
 *   offset(32) + r_bytes32(32) + s_bytes32(32) + v_uint8(32, right-padded)
 * or more commonly:
 *   offset(32) + extra(32) + offset2(32) + length(32, value=0x41) + r(32) + s(32) + v(32)
 */
function extractEcdsaSignature(rawSignature: string): string | null {
  const hex = rawSignature.startsWith('0x') ? rawSignature.slice(2) : rawSignature

  // Standard ECDSA: exactly 130 hex chars (65 bytes)
  if (/^[a-fA-F0-9]{130}$/.test(hex)) {
    return `0x${hex}`
  }

  // ABI-encoded SCW signature: try to find r, s, v in the data
  // Scan for a 32-byte word equal to 0x41 (65) — the length of a signature
  // followed immediately by r(32 bytes) + s(32 bytes) + v(1 byte in last byte of 32-byte word)
  if (hex.length >= 384) {
    // Try multiple common start offsets for r within the ABI-encoded data
    const offsets = [0, 64, 128, 192, 256]
    for (const start of offsets) {
      const end = start + 192 // 3 x 64 hex chars (r + s + v_word)
      if (end <= hex.length) {
        const r = hex.slice(start, start + 64)
        const s = hex.slice(start + 64, start + 128)
        const vWord = hex.slice(start + 128, start + 192)
        const vByte = vWord.slice(62, 64)
        if (/^[a-fA-F0-9]{64}$/.test(r) && /^[a-fA-F0-9]{64}$/.test(s) && /^[a-fA-F0-9]{2}$/.test(vByte)) {
          const v = parseInt(vByte, 16)
          if (v === 27 || v === 28) {
            return `0x${r}${s}${vByte}`
          }
        }
      }
    }
  }

  return null
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
  const rawSignature = asString(body.signature) as `0x${string}`

  if (!voter || !/^0x[a-fA-F0-9]{40}$/.test(voter)) {
    return jsonError('Alamat voter tidak valid.')
  }
  if (!commitment || !/^0x[a-fA-F0-9]{64}$/.test(commitment)) {
    return jsonError('Commitment tidak valid (harus bytes32 hex).')
  }
  if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    return jsonError('Alamat kontrak tidak valid.')
  }
  if (!rawSignature) {
    return jsonError('Signature tidak valid.')
  }

  // ── Extract ECDSA signature (handles both EOA and SCW/Base Account SDK) ──
  const extractedSignature = extractEcdsaSignature(rawSignature)

  // ── Setup relayer wallet (needed for both verification and tx submission) ──
  const privateKey = getRelayerKey()
  if (!privateKey) return jsonError('RELAYER_PRIVATE_KEY belum dikonfigurasi.', 503)

  const account = privateKeyToAccount(privateKey)
  const transport = http(getRpcUrl())
  const publicClient = createPublicClient({ chain: baseSepolia, transport })
  const walletClient = createWalletClient({ account, chain: baseSepolia, transport })

  // ── Recover signer from signature ──
  const message = `VoteChain commit: ${commitment} for ${contractAddress}`
  const messageHash = hashMessage(message)

  let signatureValid = false

  // Attempt 1: Standard ECDSA recovery (works for EOA wallets)
  if (extractedSignature) {
    try {
      const recovered = await recoverAddress({ hash: messageHash, signature: extractedSignature as Hex })
      if (recovered.toLowerCase() === voter.toLowerCase()) {
        signatureValid = true
      }
    } catch {
      // Recovery failed — fall through to EIP-1271
    }
  }

  // Attempt 2: EIP-1271 verification (works for Smart Contract Wallets like Base Account SDK)
  if (!signatureValid) {
    try {
      const code = await publicClient.getCode({ address: voter as `0x${string}` })
      if (code && code !== '0x') {
        // Address is a contract — try EIP-1271 isValidSignature(bytes32,bytes)
        const EIP1271_MAGIC = '0x1626ba7e' // EIP-1271 success magic value
        const result = await publicClient.readContract({
          address: voter as `0x${string}`,
          abi: [{
            name: 'isValidSignature',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'hash', type: 'bytes32' },
              { name: 'signature', type: 'bytes' },
            ],
            outputs: [{ name: 'magicValue', type: 'bytes4' }],
          }],
          functionName: 'isValidSignature',
          args: [messageHash, rawSignature as `0x${string}`],
        })
        if (result && result.toLowerCase() === EIP1271_MAGIC) {
          signatureValid = true
        }
      }
    } catch {
      // EIP-1271 verification failed
    }
  }

  if (!signatureValid) {
    return jsonError('Signature tidak valid atau tidak sesuai dengan alamat voter.')
  }

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
