import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPublicClient, createWalletClient, http, encodeFunctionData, type Address } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getCronSecret() {
  return process.env.NOTIFICATION_CRON_SECRET?.trim()
    || process.env.CRON_SECRET?.trim()
    || ''
}

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

function verifyAuth(request: NextRequest): boolean {
  const cronSecret = getCronSecret()
  if (!cronSecret) return false
  const bearerOk = request.headers.get('authorization') === `Bearer ${cronSecret}`
  const headerOk = request.headers.get('x-cron-secret') === cronSecret
  return bearerOk || headerOk
}

/** Shared auto-reveal logic for both GET (Vercel cron) and POST (GitHub Actions) */
async function handleAutoReveal(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

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
    // Check current phase. Contract enum: Commit=0, Reveal=1, Ended=2.
    // Only reveal during Reveal phase (1) to avoid gas-wasting WrongPhase reverts
    // that could permanently mark commitments as revealed in the error handler.
    let phaseNumber: number | null = null
    let phaseLabel = 'unknown'
    try {
      const phase = await publicClient.readContract({
        address: spaceAddress as Address,
        abi: ELECTION_SPACE_ABI,
        functionName: 'phase',
      })
      phaseNumber = Number(phase)
      phaseLabel = phaseNumber === 0 ? 'Commit' : phaseNumber === 1 ? 'Reveal' : phaseNumber === 2 ? 'Ended' : `Phase(${phaseNumber})`
      console.log(`[auto-reveal] Space ${spaceAddress} phase=${phaseNumber} (${phaseLabel}), commitments=${items.length}`)
    } catch (err) {
      console.error(`[auto-reveal] Phase check failed for ${spaceAddress}:`, err)
    }

    // Skip spaces not in Reveal phase. If phase check failed (RPC error),
    // proceed anyway so late-running crons can catch queued commitments.
    if (phaseNumber !== null && phaseNumber !== 1) {
      console.log(`[auto-reveal] Skipping ${spaceAddress} — not in Reveal phase (${phaseLabel})`)
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
          console.log(`[auto-reveal] Already revealed on-chain, marking DB: ${commitment.voter_address}`)
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

        console.log(`[auto-reveal] Tx sent for ${commitment.voter_address}: ${txHash}`)

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

        // Update DB
        await supabase.schema('app').from('vote_commitments')
          .update({ revealed: true, reveal_tx_hash: txHash })
          .eq('id', commitment.id)

        const { data: proposal } = await supabase
          .schema('app')
          .from('proposal_drafts')
          .select('title, created_by')
          .eq('id', commitment.election_id)
          .maybeSingle()

        const electionTitle = proposal?.title || 'pemilihan ini'
        const { data: voterProfile } = await supabase
          .schema('app')
          .from('app_profiles')
          .select('id')
          .eq('wallet_address', commitment.voter_address.toLowerCase())
          .maybeSingle()

        const rows: Array<{
          target_profile_id: string | null
          target_wallet: string | null
          channel: 'in_app'
          template_key: string
          status: 'sent'
          payload: Record<string, unknown>
        }> = [{
          target_profile_id: voterProfile?.id ?? null,
          target_wallet: commitment.voter_address.toLowerCase(),
          channel: 'in_app',
          template_key: 'vote_revealed',
          status: 'sent',
          payload: {
            proposalId: commitment.election_id,
            eventType: 'vote_revealed',
            title: 'Suara berhasil disahkan',
            description: `Suara Anda untuk "${electionTitle}" sudah disahkan dan masuk penghitungan.`,
            type: 'success',
            link: `/pemilih/pemilihan/${commitment.election_id}/hasil`,
            txHash,
          },
        }]

        const adminTargets = new Set<string>()
        if (proposal?.created_by) adminTargets.add(proposal.created_by)
        const { data: superadmins } = await supabase
          .schema('app')
          .from('app_profiles')
          .select('id')
          .eq('role', 'super_admin')
        for (const superadmin of superadmins ?? []) adminTargets.add(superadmin.id)

        for (const targetProfileId of adminTargets) {
          rows.push({
            target_profile_id: targetProfileId,
            target_wallet: null,
            channel: 'in_app',
            template_key: 'vote_activity',
            status: 'sent',
            payload: {
              proposalId: commitment.election_id,
              eventType: 'vote_revealed',
              title: 'Satu suara berhasil disahkan',
              description: `Satu suara pada "${electionTitle}" berhasil disahkan oleh sistem.`,
              type: 'success',
              link: `/superadmin/manajemen-proposal/${commitment.election_id}`,
              txHash,
            },
          })
        }

        const { error: notificationError } = await supabase.schema('app').from('notification_jobs').insert(rows)
        if (notificationError) console.error('[auto-reveal] Notification error:', notificationError)

        revealedCount++
        results.push({ spaceAddress, voterAddress: commitment.voter_address, success: true, txHash })
        console.log(`[auto-reveal] Revealed for ${commitment.voter_address} in ${spaceAddress}: ${txHash}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        const isContractReject = /execution reverted|call revert exception|invalid opcode/i.test(message)
        // Distinguish retryable errors (WrongPhase) from permanent ones.
        // WrongPhase: keep revealed=false so next cron cycle retries.
        // Other reverts (InvalidCandidate, CommitmentMismatch, etc.): mark permanently.
        const isWrongPhase = /WrongPhase|wrong phase|Phase\.Commit|Phase\.Ended/i.test(message)
        if (isContractReject && !isWrongPhase) {
          await supabase.schema('app').from('vote_commitments')
            .update({ revealed: true, reveal_tx_hash: `REVERT:${message.slice(0, 200)}` })
            .eq('id', commitment.id)
          console.error(`[auto-reveal] Permanent revert for ${commitment.voter_address}: ${message}`)
        } else if (isWrongPhase) {
          console.error(`[auto-reveal] WrongPhase (retryable) for ${commitment.voter_address}: will retry next cycle`)
        } else {
          console.error(`[auto-reveal] Failed for ${commitment.voter_address} in ${spaceAddress}: ${message}`)
        }
        results.push({ spaceAddress, voterAddress: commitment.voter_address, success: false, error: message })
      }
    }
  }

  return NextResponse.json({ success: true, revealed: revealedCount, results })
}

// Vercel cron sends GET; GitHub Actions sends POST.
export async function GET(request: NextRequest) {
  return handleAutoReveal(request)
}
export async function POST(request: NextRequest) {
  return handleAutoReveal(request)
}
