// ponytail: minimal eth_call helper for reading vote counts from ElectionSpace contract.
// No viem/wagmi dependency — raw JSON-RPC only.
// Falls back to public Base Sepolia RPCs when Alchemy key is not configured.

const PUBLIC_RPC_URLS = [
  'https://base-sepolia-rpc.publicnode.com',
  'https://sepolia.base.org',
  'https://rpc.ankr.com/base_sepolia',
]

function getRpcUrl(): string | null {
  const key = process.env.ALCHEMY_API_KEY?.trim()
  if (key) return `https://base-sepolia.g.alchemy.com/v2/${key}`
  // ponytail: pick first public RPC. Add retry logic if rate-limited.
  return PUBLIC_RPC_URLS[0]
}

function encodeUint256(value: number): string {
  return '0x' + value.toString(16).padStart(64, '0')
}

function decodeUint256(hex: string): number {
  return parseInt(hex, 16)
}

// keccak256("candidateCount()")[:4] = 0x18d12e06
// keccak256("voteCount(uint256)")[:4] = 0x6817c76c
const FUNC_CANDIDATE_COUNT = '0x18d12e06'
const FUNC_VOTE_COUNT = '0x6817c76c'

async function ethCall(rpcUrl: string, to: string, data: string): Promise<string> {
  // ponytail: try each public RPC in order, skip on failure
  const rpcUrls = [rpcUrl, ...PUBLIC_RPC_URLS.filter((url) => url !== rpcUrl)]
  let lastError = ''

  for (const url of rpcUrls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to, data }, 'latest'],
        }),
      })

      if (!response.ok) { lastError = `RPC ${response.status}`; continue }
      const payload = await response.json()
      if (payload.error) { lastError = payload.error.message; continue }
      if (!payload.result) { lastError = 'empty result'; continue }
      return payload.result
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'network error'
    }
  }

  throw new Error(`RPC gagal: ${lastError}`)
}

export async function fetchVoteCountsViaAlchemy(
  spaceAddress: string,
  candidateCount: number,
): Promise<Array<{ candidateId: number; voteCount: number }>> {
  const rpcUrl = getRpcUrl()
  if (!rpcUrl) throw new Error('RPC Base Sepolia tidak tersedia.')

  const results: Array<{ candidateId: number; voteCount: number }> = []

  for (let i = 1; i <= candidateCount; i++) {
    const data = FUNC_VOTE_COUNT + encodeUint256(i)
    const result = await ethCall(rpcUrl, spaceAddress, data)
    results.push({ candidateId: i, voteCount: decodeUint256(result) })
  }

  return results
}

export async function fetchCandidateCountViaAlchemy(spaceAddress: string): Promise<number> {
  const rpcUrl = getRpcUrl()
  if (!rpcUrl) throw new Error('RPC Base Sepolia tidak tersedia.')

  const result = await ethCall(rpcUrl, spaceAddress, FUNC_CANDIDATE_COUNT)
  return decodeUint256(result)
}

export function isAlchemyConfigured(): boolean {
  return getRpcUrl() !== null
}

/** Fetch candidateCount + all voteCounts in a single call. */
export async function fetchElectionResultsFromChain(spaceAddress: string) {
  const candidateCount = await fetchCandidateCountViaAlchemy(spaceAddress)
  if (candidateCount === 0) return { totalRevealed: 0, candidateResults: [] as Array<{ candidateId: number; voteCount: number }> }
  const candidateResults = await fetchVoteCountsViaAlchemy(spaceAddress, candidateCount)
  const totalRevealed = candidateResults.reduce((sum, r) => sum + r.voteCount, 0)
  return { totalRevealed, candidateResults }
}
