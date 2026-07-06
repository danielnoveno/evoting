import { createPublicClient, http, type Hex } from 'viem'
import { baseSepolia } from 'viem/chains'
import { jsonError, type ServiceClient } from '@/app/api/_lib/auth'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'

type ProposalWhitelistState = {
  id: string
  status: string
  commit_start_at: string | null
  deployed_space_address: string | null
}

export async function ensureWhitelistMutable(client: ServiceClient, proposalDraftId: string) {
  const { data: proposal, error } = await client
    .from('proposal_drafts')
    .select('id, status, commit_start_at, deployed_space_address')
    .eq('id', proposalDraftId)
    .maybeSingle()

  if (error) return { error: jsonError('Gagal memeriksa fase whitelist.', 500) }
  if (!proposal) return { error: jsonError('Proposal tidak ditemukan.', 404) }

  const state = proposal as ProposalWhitelistState
  if (state.status === 'archived' || state.status === 'suspended') {
    return { error: jsonError('Whitelist tidak dapat diubah karena pemilihan sudah tidak aktif.', 409), proposal: state }
  }

  if (state.status === 'deployed') {
    if (!state.commit_start_at) {
      return { error: jsonError('Jadwal pencoblosan belum lengkap; whitelist tidak dapat diubah dengan aman.', 409), proposal: state }
    }

    if (Date.now() >= new Date(state.commit_start_at).getTime()) {
      return { error: jsonError('Whitelist sudah dikunci karena fase pencoblosan telah dimulai.', 409), proposal: state }
    }
  }

  return { proposal: state }
}

export async function ensureSuccessfulContractTx(txHash: string, contractAddress: string | null) {
  const client = createBaseSepoliaClient()

  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash as Hex })
    if (receipt.status !== 'success') return jsonError('Transaksi whitelist ditemukan, tetapi statusnya gagal.', 409)

    if (contractAddress && receipt.to?.toLowerCase() !== contractAddress.toLowerCase()) {
      return jsonError('Hash transaksi tidak menuju kontrak pemilihan ini.', 409)
    }
  } catch {
    return jsonError('Transaksi whitelist belum dapat diverifikasi di Base Sepolia. Coba lagi setelah transaksi terkonfirmasi.', 409)
  }

  return null
}

export async function ensureWalletWhitelistState(contractAddress: string | null, walletAddresses: string[], expected: boolean) {
  if (!contractAddress) return jsonError('Alamat kontrak pemilihan belum tersedia untuk verifikasi whitelist.', 409)
  const client = createBaseSepoliaClient()

  try {
    const uniqueAddresses = Array.from(new Set(walletAddresses.map((item) => item.toLowerCase())))
    const states = await Promise.all(uniqueAddresses.map((walletAddress) => client.readContract({
      address: contractAddress as Hex,
      abi: ElectionSpaceArtifact.abi,
      functionName: 'isWhitelisted',
      args: [walletAddress as Hex],
    })))
    const mismatchIndex = states.findIndex((state) => state !== expected)
    if (mismatchIndex >= 0) {
      return jsonError(expected
        ? 'Transaksi selesai, tetapi belum semua wallet terbaca terdaftar on-chain.'
        : 'Transaksi selesai, tetapi wallet masih terbaca terdaftar on-chain.', 409)
    }
  } catch {
    return jsonError('Status whitelist on-chain belum dapat diverifikasi. Coba lagi setelah RPC Base Sepolia stabil.', 409)
  }

  return null
}

function createBaseSepoliaClient() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim()
    || 'https://sepolia.base.org'
  return createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) })
}
