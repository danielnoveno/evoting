import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPublicClient, createWalletClient, http, encodeFunctionData, type Address } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ELECTION_SPACE_ABI = [
  {
    name: 'revealFor',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'voter', type: 'address' },
      { name: 'candidateId', type: 'uint256' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'phase',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'hasRevealed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'voter', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

/**
 * POST /api/cron/auto-reveal
 * Called by Vercel cron or frontend to auto-reveal all un-revealed commitments
 * for elections currently in the Reveal phase (phase === 1).
 *
 * Uses the RELAYER_WALLET_PRIVATE_KEY to submit revealFor() transactions.
 */
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const relayerKey = process.env.REVEAL_RELAYER_PRIVATE_KEY
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ success: false, message: 'Server tidak terkonfigurasi.' }, { status: 500 })
  }
  if (!relayerKey) {
    return NextResponse.json({ success: false, message: 'REVEAL_RELAYER_PRIVATE_KEY belum diatur.' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  // Find all un-revealed commitments
  const { data: commitments, error: fetchError } = await supabase
    .schema('app')
    .from('vote_commitments')
    .select('id, election_id, space_address, voter_address, candidate_id, salt')
    .eq('revealed', false)

  if (fetchError) {
    console.error('[auto-reveal] Fetch error:', fetchError)
    return NextResponse.json({ success: false, message: 'Gagal memuat komitmen.' }, { status: 500 })
  }

  if (!commitments || commitments.length === 0) {
    return NextResponse.json({ success: true, message: 'Tidak ada komitmen untuk di-reveal.', revealed: 0 })
  }

  // Group by space address
  const bySpace = new Map<string, typeof commitments>()
  for (const c of commitments) {
    const key = c.space_address.toLowerCase()
    const list = bySpace.get(key) ?? []
    list.push(c)
    bySpace.set(key, list)
  }

  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) })

  // Import the relayer wallet
  const relayerAccount = privateKeyToAccount(relayerKey as `0x${string}`)
  const walletClient = createWalletClient({ account: relayerAccount, chain: baseSepolia, transport: http(rpcUrl) })

  let revealedCount = 0
  const results: Array<{ spaceAddress: string; voterAddress: string; success: boolean; txHash?: string; error?: string }> = []

  for (const [spaceAddress, items] of bySpace) {
    // Check current phase
    try {
      const phase = await publicClient.readContract({
        address: spaceAddress as Address,
        abi: ELECTION_SPACE_ABI,
        functionName: 'phase',
      })
      if (phase !== 1) continue // Not in Reveal phase, skip
    } catch (err) {
      console.error(`[auto-reveal] Phase check failed for ${spaceAddress}:`, err)
      continue
    }

    for (const commitment of items) {
      // Skip if already revealed on-chain
      try {
        const alreadyRevealed = await publicClient.readContract({
          address: spaceAddress as Address,
          abi: ELECTION_SPACE_ABI,
          functionName: 'hasRevealed',
          args: [commitment.voter_address as Address],
        })
        if (alreadyRevealed) {
          // Mark as revealed in DB
          await supabase.schema('app').from('vote_commitments')
            .update({ revealed: true })
            .eq('id', commitment.id)
          continue
        }
      } catch {
        // If we can't check, try to reveal anyway
      }

      try {
        const saltBytes = commitment.salt as `0x${string}`
        const data = encodeFunctionData({
          abi: ELECTION_SPACE_ABI,
          functionName: 'revealFor',
          args: [commitment.voter_address as Address, BigInt(commitment.candidate_id), saltBytes],
        })

        // Estimate gas
        const gas = await publicClient.estimateGas({
          account: relayerAccount,
          to: spaceAddress as Address,
          data,
        })

        // Send transaction
        const txHash = await walletClient.sendTransaction({
          to: spaceAddress as Address,
          data,
          gas: gas + gas / BigInt(10), // 10% buffer
        })

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

        // Update DB
        await supabase.schema('app').from('vote_commitments')
          .update({ revealed: true, reveal_tx_hash: txHash })
          .eq('id', commitment.id)

        revealedCount++
        results.push({ spaceAddress, voterAddress: commitment.voter_address, success: true, txHash })
        console.log(`[auto-reveal] Revealed for ${commitment.voter_address} in ${spaceAddress}: ${txHash}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        results.push({ spaceAddress, voterAddress: commitment.voter_address, success: false, error: message })
        console.error(`[auto-reveal] Failed for ${commitment.voter_address}:`, message)
      }
    }
  }

  return NextResponse.json({ success: true, revealed: revealedCount, results })
}
