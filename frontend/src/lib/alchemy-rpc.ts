// ponytail: minimal eth_call helper for reading vote counts via Alchemy RPC.
// No viem/wagmi dependency — raw JSON-RPC only.

function getAlchemyRpcUrl(): string | null {
  const key = process.env.ALCHEMY_API_KEY?.trim()
  if (!key) return null
  return `https://base-sepolia.g.alchemy.com/v2/${key}`
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
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }),
  })

  if (!response.ok) throw new Error(`Alchemy RPC failed: ${response.status}`)
  const payload = await response.json()
  if (payload.error) throw new Error(`Alchemy RPC error: ${payload.error.message}`)
  return payload.result
}

export async function fetchVoteCountsViaAlchemy(
  spaceAddress: string,
  candidateCount: number,
): Promise<Array<{ candidateId: number; voteCount: number }>> {
  const rpcUrl = getAlchemyRpcUrl()
  if (!rpcUrl) throw new Error('ALCHEMY_API_KEY belum dikonfigurasi.')

  const results: Array<{ candidateId: number; voteCount: number }> = []

  for (let i = 1; i <= candidateCount; i++) {
    const data = FUNC_VOTE_COUNT + encodeUint256(i)
    const result = await ethCall(rpcUrl, spaceAddress, data)
    results.push({ candidateId: i, voteCount: decodeUint256(result) })
  }

  return results
}

export async function fetchCandidateCountViaAlchemy(spaceAddress: string): Promise<number> {
  const rpcUrl = getAlchemyRpcUrl()
  if (!rpcUrl) throw new Error('ALCHEMY_API_KEY belum dikonfigurasi.')

  const result = await ethCall(rpcUrl, spaceAddress, FUNC_CANDIDATE_COUNT)
  return decodeUint256(result)
}

export function isAlchemyConfigured(): boolean {
  return getAlchemyRpcUrl() !== null
}
