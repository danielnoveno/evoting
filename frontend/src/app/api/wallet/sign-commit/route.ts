/**
 * API Route: Server-Side Commit Signing
 *
 * POST /api/wallet/sign-commit
 *
 * Menggantikan alur commit yang sebelumnya membutuhkan wallet popup.
 * Semua signing terjadi di server-side menggunakan deterministic key derivation.
 *
 * Flow:
 * 1. User autentikasi via Supabase Auth
 * 2. Backend derive private key dari user_id + master secret
 * 3. Backend generate salt dan commitment
 * 4. Backend sign dan submit transaksi via relayer EOA
 * 5. Return tx proof + salt (untuk disimpan di localStorage)
 *
 * Body: {
 *   candidateId: number    — ID kandidat (1-based)
 *   contractAddress: string — Alamat ElectionSpace contract
 * }
 */

import { NextResponse, type NextRequest } from 'next/server'
import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  http,
  keccak256,
  parseAbiParameters,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'
import {
  derivePrivateKey,
  deriveWalletAddress,
  isValidMasterSecret,
} from '@/lib/wallet-crypto'

// Import createClient for auth verification
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function getRpcUrl() {
  return (
    process.env.BASE_SEPOLIA_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim() ||
    'https://sepolia.base.org'
  )
}

function getRelayerKey(): Hex | null {
  const raw =
    process.env.RELAYER_PRIVATE_KEY?.trim() ||
    process.env.AUTO_REVEAL_RELAYER_PRIVATE_KEY?.trim()
  if (!raw) return null
  const value = raw.startsWith('0x') ? raw : `0x${raw}`
  return /^[0-9a-fA-F]{64}$/.test(value) ? (value as Hex) : null
}

function generateSalt(): Hex {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}` as Hex
}

/**
 * POST /api/wallet/sign-commit
 *
 * Server-side commit flow:
 * 1. Authenticate user
 * 2. Derive wallet from user_id
 * 3. Generate salt + commitment
 * 4. Sign message with derived key
 * 5. Submit commitFor() via relayer EOA
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Validate master secret ──
    const masterSecret = process.env.WALLET_MASTER_SECRET
    if (!isValidMasterSecret(masterSecret)) {
      return jsonError('Sistem wallet belum dikonfigurasi.', 500)
    }

    // ── 2. Authenticate user ──
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError('Tidak terautentikasi.', 401)
    }
    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonError('Sistem autentikasi belum siap.', 500)
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonError('Sesi tidak valid. Silakan masuk kembali.', 401)
    }

    // ── 3. Parse body ──
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Body request tidak valid.')
    }

    if (!body || typeof body !== 'object') {
      return jsonError('Body request harus JSON object.')
    }

    const { candidateId, contractAddress } = body as {
      candidateId?: number
      contractAddress?: string
    }

    if (!candidateId || typeof candidateId !== 'number' || candidateId < 1) {
      return jsonError('ID kandidat tidak valid.')
    }
    if (
      !contractAddress ||
      typeof contractAddress !== 'string' ||
      !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)
    ) {
      return jsonError('Alamat kontrak tidak valid.')
    }

    // ── 4. Derive wallet ──
    const voterAddress = deriveWalletAddress(user.id, masterSecret!)
    const derivedPrivateKey = derivePrivateKey(user.id, masterSecret!)

    // ── 5. Check if already committed on-chain ──
    const transport = http(getRpcUrl())
    const publicClient = createPublicClient({ chain: baseSepolia, transport })

    try {
      const alreadyCommitted = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ElectionSpaceArtifact.abi,
        functionName: 'hasCommitted',
        args: [voterAddress],
      })
      if (alreadyCommitted) {
        return jsonError('Anda sudah melakukan commit untuk pemilihan ini.')
      }
    } catch {
      // If we can't read, proceed anyway — the contract will revert if double-commit
    }

    // ── 6. Generate salt and commitment ──
    const salt = generateSalt()
    const commitment = keccak256(
      encodeAbiParameters(
        parseAbiParameters(
          'uint256, bytes32, address, address, uint256',
        ),
        [
          BigInt(candidateId),
          salt,
          voterAddress,
          contractAddress as `0x${string}`,
          BigInt(baseSepolia.id),
        ],
      ),
    )

    // ── 7. Sign message with derived key ──
    const derivedAccount = privateKeyToAccount(derivedPrivateKey)
    const message = `VoteChain commit: ${commitment} for ${contractAddress}`
    const signature = await derivedAccount.signMessage({ message })

    // ── 8. Setup relayer and submit ──
    const relayerKey = getRelayerKey()
    if (!relayerKey) {
      return jsonError('Relayer belum dikonfigurasi.', 503)
    }

    const relayerAccount = privateKeyToAccount(relayerKey)
    const walletClient = createWalletClient({
      account: relayerAccount,
      chain: baseSepolia,
      transport,
    })

    // Verify signature (same as existing relayer)
    const { recoverAddress, hashMessage } = await import('viem')
    const messageHash = hashMessage(message)

    let signatureValid = false
    try {
      const recovered = await recoverAddress({
        hash: messageHash,
        signature: signature as Hex,
      })
      if (recovered.toLowerCase() === voterAddress.toLowerCase()) {
        signatureValid = true
      }
    } catch {
      // Recovery failed
    }

    if (!signatureValid) {
      return jsonError('Gagal memverifikasi tanda tangan.', 500)
    }

    // ── 9. Submit commitFor on-chain ──
    const txHash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: ElectionSpaceArtifact.abi,
      functionName: 'commitFor',
      args: [voterAddress, commitment],
    })

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    })

    // ── 10. Log to Supabase ──
    const client = getSupabaseServiceRoleClient()
    if (client) {
      await client.from('tx_audit_log').insert({
        wallet_address: voterAddress,
        action_type: 'commit_vote_server_signed',
        tx_hash: txHash,
        block_number: Number(receipt.blockNumber),
        status: 'success',
        source: 'wallet_sign_commit',
        metadata: {
          userId: user.id,
          commitment,
          contractAddress,
          candidateId,
          salt,
          relayerWallet: relayerAccount.address,
          blockNumber: Number(receipt.blockNumber),
          gasUsed: Number(receipt.gasUsed),
        },
      })
    }

    // ── 11. Return result ──
    return NextResponse.json({
      success: true,
      txHash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: Number(receipt.gasUsed),
      relayerAddress: relayerAccount.address,
      // Return salt and commitment for client-side localStorage storage
      salt,
      commitment,
      voterAddress,
      candidateId,
    })
  } catch (error) {
    console.error('[WALLET] sign-commit error:', error)
    const message =
      error instanceof Error
        ? error.message.slice(0, 240)
        : 'Gagal memproses commit.'
    return jsonError(`Gagal memproses commit: ${message}`, 500)
  }
}
