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

/**
 * Former fallback reader for election results via direct RPC.
 * Committed/total counts are only reliably available from the Ponder indexer
 * (which tracks the Commit/Reveal events). Direct RPC cannot supply the
 * committed count, so returning zeros would mislead users into thinking
 * nobody voted. We surface a clear error instead of faking data.
 */
export async function fetchElectionResultsFromChain(_spaceAddress: string): Promise<never> {
  throw new Error('Indexer Ponder tidak tersedia; data hasil pemilihan belum dapat diambil.')
}

// ── ponytail: eth_getLogs helper untuk fetch event blockchain langsung tanpa indexer ──

/** Event topic0 hashes (keccak256 of event signature) */
const TOPIC = {
  Committed: '0x26a454697a4923cb3646779d831b5e4696bd3fab14b67dd6dfe23d72354f57dd',
  Revealed: '0x63ab6e5dc98a7d72f7b887b4479c584f5d1cc5e644f8b756c1213bc8e32f4f42',
  PhaseChanged: '0xb08bfe79d11e67f65c878f279728c4d53fc5dfc3373a20958345fcad3750953e',
  WhitelistUpdated: '0x5b551e9aea49b0b85a31d13fd569c911ded7781feaae60c3603e3a968b05fc13',
} as const

export interface ChainEvent {
  txHash: string
  blockNumber: number
  logIndex: number
  topic0: string
  topics: string[]
  data: string
  timestamp?: number
}

/**
 * Fetch raw event logs from ElectionSpace contract via eth_getLogs.
 * Used as fallback when Ponder indexer is down.
 */
export async function fetchChainEvents(spaceAddress: string, fromBlock = 0, toBlock = 'latest'): Promise<ChainEvent[]> {
  const rpcUrl = getRpcUrl()
  if (!rpcUrl) return []

  const rpcUrls = [rpcUrl, ...PUBLIC_RPC_URLS.filter((url) => url !== rpcUrl)]
  const allTopics = Object.values(TOPIC)

  const attempt = async (url: string): Promise<ChainEvent[]> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getLogs',
          params: [{
            address: spaceAddress,
            topics: [allTopics],
            fromBlock: fromBlock === 0 ? '0x0' : '0x' + fromBlock.toString(16),
            toBlock,
          }],
        }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!response.ok) throw new Error(`RPC ${response.status}`)
      const payload = await response.json()
      if (payload.error) throw new Error(payload.error.message)
      const logs = (payload.result ?? []) as Array<{
        transactionHash: string
        blockNumber: string
        logIndex: string
        topics: string[]
        data: string
      }>
      return logs.map((log) => ({
        txHash: log.transactionHash,
        blockNumber: parseInt(log.blockNumber, 16),
        logIndex: parseInt(log.logIndex, 16),
        topic0: log.topics[0],
        topics: log.topics,
        data: log.data,
      }))
    } catch (error) {
      clearTimeout(timer)
      throw error
    }
  }

  const results = await Promise.allSettled(rpcUrls.map(attempt))
  for (const r of results) {
    if (r.status === 'fulfilled') return r.value
  }
  return []
}

/**
 * Decode ChainEvent[] into TxAuditLogRecord-compatible objects for the Live Feed.
 */
export function decodeChainEvents(events: ChainEvent[]): Array<{
  id: string
  actionType: string
  txHash: string
  blockNumber: number
  timestamp: string
  actor: string
  metadata: Record<string, unknown>
}> {
  return events.map((event) => {
    const actionType = getActionType(event.topic0)
    const decoded = decodeEventData(event)
    return {
      id: `${event.txHash}-${event.logIndex}`,
      actionType,
      txHash: event.txHash,
      blockNumber: event.blockNumber,
      timestamp: event.timestamp ? new Date(event.timestamp * 1000).toISOString() : new Date().toISOString(),
      actor: decoded.actor,
      metadata: decoded.metadata,
    }
  }).sort((a, b) => b.blockNumber - a.blockNumber || a.id.localeCompare(b.id))
}

function getActionType(topic0: string): string {
  if (topic0 === TOPIC.Committed) return 'commit'
  if (topic0 === TOPIC.Revealed) return 'reveal'
  if (topic0 === TOPIC.PhaseChanged) return 'phase_changed'
  if (topic0 === TOPIC.WhitelistUpdated) return 'whitelist_updated'
  return 'unknown'
}

function decodeEventData(event: ChainEvent): { actor: string; metadata: Record<string, unknown> } {
  const topics = event.topics
  const data = event.data

  if (event.topic0 === TOPIC.Committed) {
    // topics[1] = spaceId (indexed), topics[2] = voter (indexed), topics[3] = commitment (indexed)
    return {
      actor: topics[2] ? '0x' + topics[2].slice(26) : 'unknown',
      metadata: { spaceId: topics[1] ? parseInt(topics[1], 16) : 0, commitment: topics[3] ?? '0x' },
    }
  }

  if (event.topic0 === TOPIC.Revealed) {
    // topics[1] = spaceId (indexed), topics[2] = voter (indexed), topics[3] = candidateId (indexed)
    // data = newVoteCount
    return {
      actor: topics[2] ? '0x' + topics[2].slice(26) : 'unknown',
      metadata: {
        spaceId: topics[1] ? parseInt(topics[1], 16) : 0,
        candidateId: topics[3] ? parseInt(topics[3], 16) : 0,
        newVoteCount: data && data !== '0x' ? parseInt(data, 16) : 0,
      },
    }
  }

  if (event.topic0 === TOPIC.PhaseChanged) {
    // topics[1] = spaceId (indexed), topics[2] = previousPhase (indexed), topics[3] = newPhase (indexed)
    // data = actor (address, non-indexed)
    const phaseLabels = ['Commit', 'Reveal', 'Ended']
    const prevPhase = topics[2] ? parseInt(topics[2], 16) : 0
    const newPhase = topics[3] ? parseInt(topics[3], 16) : 0
    return {
      actor: data && data !== '0x' ? '0x' + data.slice(26) : 'unknown',
      metadata: {
        spaceId: topics[1] ? parseInt(topics[1], 16) : 0,
        previousPhase: phaseLabels[prevPhase] ?? `Phase ${prevPhase}`,
        newPhase: phaseLabels[newPhase] ?? `Phase ${newPhase}`,
      },
    }
  }

  if (event.topic0 === TOPIC.WhitelistUpdated) {
    // topics[1] = spaceId (indexed), topics[2] = voter (indexed)
    // data = isRegistered (bool) + actor (address)
    const isRegistered = data && data !== '0x' ? data.slice(0, 66) !== '0x' + '0'.repeat(64) : false
    return {
      actor: topics[2] ? '0x' + topics[2].slice(26) : 'unknown',
      metadata: { spaceId: topics[1] ? parseInt(topics[1], 16) : 0, isRegistered },
    }
  }

  return { actor: 'unknown', metadata: {} }
}
