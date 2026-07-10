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
  return value.toString(16).padStart(64, '0')
}

function decodeUint256(hex: string): number {
  return parseInt(hex, 16)
}

// cast sig 'candidateCount()' / 'voteCount(uint256)'
const FUNC_CANDIDATE_COUNT = '0xa9a981a3'
const FUNC_VOTE_COUNT = '0x4fc8a20d'

async function ethCall(rpcUrl: string, to: string, data: string, timeoutMs = 4000): Promise<string> {
  // ponytail: race all RPCs in parallel, first success wins. Cuts worst case from N*5s to ~5s.
  const rpcUrls = [rpcUrl, ...PUBLIC_RPC_URLS.filter((url) => url !== rpcUrl)]

  const attempt = async (url: string): Promise<string> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
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
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!response.ok) throw new Error(`RPC ${response.status}`)
      const payload = await response.json()
      if (payload.error) throw new Error(payload.error.message)
      if (!payload.result) throw new Error('empty result')
      return payload.result
    } catch (error) {
      clearTimeout(timer)
      throw error
    }
  }

  const results = await Promise.allSettled(rpcUrls.map(attempt))
  for (const r of results) {
    if (r.status === 'fulfilled') return r.value
  }
  const lastError = results.map((r) => r.status === 'rejected' ? r.reason?.message ?? 'error' : '').filter(Boolean).join('; ') || 'unknown'
  throw new Error(`RPC gagal: ${lastError}`)
}

export async function fetchVoteCountsViaAlchemy(
  spaceAddress: string,
  candidateCount: number,
): Promise<Array<{ candidateId: number; voteCount: number }>> {
  const rpcUrl = getRpcUrl()
  if (!rpcUrl) throw new Error('RPC Base Sepolia tidak tersedia.')

  // ponytail: parallel reads instead of serial — cuts latency from N*5s to ~5s
  const promises = Array.from({ length: candidateCount }, (_, i) => {
    const candidateId = i + 1
    const data = FUNC_VOTE_COUNT + encodeUint256(candidateId)
    return ethCall(rpcUrl, spaceAddress, data).then((result) => ({ candidateId, voteCount: decodeUint256(result) }))
  })

  return Promise.all(promises)
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
