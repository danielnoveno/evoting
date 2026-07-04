/**
 * API Route: Server-Side Reveal Signing
 *
 * POST /api/wallet/sign-reveal
 *
 * Endpoint fallback untuk reveal manual. Primary path adalah auto-reveal queue.
 * Endpoint ini berguna jika auto-reveal gagal atau user ingin reveal manual.
 *
 * Flow:
 * 1. User autentikasi via Supabase Auth
 * 2. Backend derive private key dari user_id + master secret
 * 3. Backend submit revealVote() via relayer EOA
 * 4. Return tx proof
 *
 * Body: {
 *   candidateId: number    — ID kandidat (1-based, sama seperti saat commit)
 *   salt: string           — Salt hex yang digunakan saat commit
 *   contractAddress: string — Alamat ElectionSpace contract
 * }
 */

import { NextResponse, type NextRequest } from 'next/server'
import {
  createPublicClient,
  createWalletClient,
  http,
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
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? (value as Hex) : null
}

/**
 * POST /api/wallet/sign-reveal
 *
 * Server-side reveal flow:
 * 1. Authenticate user
 * 2. Derive wallet from user_id
 * 3. Submit revealVote() via relayer EOA
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

    const { candidateId, salt, contractAddress } = body as {
      candidateId?: number
      salt?: string
      contractAddress?: string
    }

    if (!candidateId || typeof candidateId !== 'number' || candidateId < 1) {
      return jsonError('ID kandidat tidak valid.')
    }
    if (
      !salt ||
      typeof salt !== 'string' ||
      !/^0x[a-fA-F0-9]{64}$/.test(salt)
    ) {
      return jsonError('Salt tidak valid (harus bytes32 hex).')
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

    // ── 5. Check if already revealed on-chain ──
    const transport = http(getRpcUrl())
    const publicClient = createPublicClient({ chain: baseSepolia, transport })

    try {
      const hasRevealed = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ElectionSpaceArtifact.abi,
        functionName: 'hasRevealed',
        args: [voterAddress],
      })
      if (hasRevealed) {
        return jsonError('Anda sudah melakukan reveal untuk pemilihan ini.')
      }
    } catch {
      // If we can't read, proceed anyway — the contract will revert
    }

    // ── 6. Setup relayer and submit ──
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

    // ── 7. Submit revealFor on-chain ──
    const txHash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: ElectionSpaceArtifact.abi,
      functionName: 'revealFor',
      args: [voterAddress, BigInt(candidateId), salt as Hex],
    })

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    })

    // ── 8. Log to Supabase ──
    const client = getSupabaseServiceRoleClient()
    if (client) {
      await client.from('tx_audit_log').insert({
        wallet_address: voterAddress,
        action_type: 'reveal_vote_server_signed',
        tx_hash: txHash,
        block_number: Number(receipt.blockNumber),
        status: 'success',
        source: 'wallet_sign_reveal',
        metadata: {
          userId: user.id,
          candidateId,
          salt,
          contractAddress,
          relayerWallet: relayerAccount.address,
          blockNumber: Number(receipt.blockNumber),
          gasUsed: Number(receipt.gasUsed),
        },
      })
    }

    // ── 9. Return result ──
    return NextResponse.json({
      success: true,
      txHash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: Number(receipt.gasUsed),
      relayerAddress: relayerAccount.address,
    })
  } catch (error) {
    console.error('[WALLET] sign-reveal error:', error)
    const message =
      error instanceof Error
        ? error.message.slice(0, 240)
        : 'Gagal memproses reveal.'
    return jsonError(`Gagal memproses reveal: ${message}`, 500)
  }
}
