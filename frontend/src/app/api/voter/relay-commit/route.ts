import { NextResponse, type NextRequest } from 'next/server'
import { createPublicClient, createWalletClient, http, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const commitRelayAbi = [
  {
    type: 'function',
    name: 'commitBySignature',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'voter', type: 'address' },
      { name: 'commitment', type: 'bytes32' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
] as const

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status })
}

function getRpcUrl() {
  return process.env.BASE_SEPOLIA_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim()
    || 'https://sepolia.base.org'
}

function getRelayerPrivateKey(): Hex | null {
  const raw = process.env.COMMIT_RELAYER_PRIVATE_KEY?.trim()
    || process.env.AUTO_REVEAL_RELAYER_PRIVATE_KEY?.trim()
    || process.env.RELAYER_PRIVATE_KEY?.trim()
  if (!raw) return null
  const value = raw.startsWith('0x') ? raw : `0x${raw}`
  return /^0x[a-fA-F0-9]{64}$/.test(value) ? value as Hex : null
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return jsonError('Server autentikasi belum terkonfigurasi.', 500)

  const relayerKey = getRelayerPrivateKey()
  if (!relayerKey) return jsonError('Relayer commit belum dikonfigurasi.', 503)

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return jsonError('Tidak terautentikasi.', 401)

  const body = (await request.json()) as {
    spaceAddress?: string
    voterAddress?: string
    commitmentHash?: string
    nonce?: number | string
    deadline?: number | string
    signature?: string
  }

  if (!body.spaceAddress || !body.voterAddress || !body.commitmentHash || body.nonce === undefined || body.deadline === undefined || !body.signature) {
    return jsonError('Field commit relayer tidak lengkap.', 400)
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(body.spaceAddress) || !/^0x[a-fA-F0-9]{40}$/.test(body.voterAddress)) {
    return jsonError('Alamat wallet atau kontrak tidak valid.', 400)
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(body.commitmentHash) || !/^0x[a-fA-F0-9]+$/.test(body.signature)) {
    return jsonError('Commitment atau tanda tangan tidak valid.', 400)
  }

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return jsonError('Token tidak valid.', 401)

  const { data: profile } = await supabase
    .schema('app')
    .from('app_profiles')
    .select('wallet_address')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.wallet_address?.toLowerCase() !== body.voterAddress.toLowerCase()) {
    return jsonError('Wallet address tidak cocok dengan akun.', 403)
  }

  try {
    const account = privateKeyToAccount(relayerKey)
    const transport = http(getRpcUrl())
    const publicClient = createPublicClient({ chain: baseSepolia, transport })
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport })
    const txHash = await walletClient.writeContract({
      address: body.spaceAddress as `0x${string}`,
      abi: commitRelayAbi,
      functionName: 'commitBySignature',
      args: [
        body.voterAddress as `0x${string}`,
        body.commitmentHash as `0x${string}`,
        BigInt(body.nonce),
        BigInt(body.deadline),
        body.signature as `0x${string}`,
      ],
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    return NextResponse.json({
      success: true,
      txHash,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: Number(receipt.gasUsed),
      relayerAddress: account.address,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 240) : 'Relayer gagal mengirim commit.'
    return jsonError(message, 500)
  }
}
