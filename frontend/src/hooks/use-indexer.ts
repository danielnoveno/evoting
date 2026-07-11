'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  PublicElectionRecord,
  PublicElectionResultRecord,
  TxAuditLogRecord,
  VoterOnchainProofRecord,
} from '@/lib/repositories/types'
import {
  getPublicElectionResults,
  listLatestAuditLogs,
} from '@/lib/repositories/electionRepository'

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const indexerKeys = {
  all: ['indexer'] as const,
  elections: () => [...indexerKeys.all, 'elections'] as const,
  election: (id: string) => [...indexerKeys.elections(), id] as const,
  results: (spaceAddress: string) => [...indexerKeys.all, 'results', spaceAddress.toLowerCase()] as const,
  voterProofs: (wallet: string, spaceAddresses?: string[]) => 
    [...indexerKeys.all, 'voter-proofs', wallet.toLowerCase(), spaceAddresses?.sort().join(',')] as const,
  auditLogs: (spaceAddress?: string, limit?: number) => 
    [...indexerKeys.all, 'audit-logs', spaceAddress?.toLowerCase(), limit] as const,
} as const

// ─── Helper: fetch with error handling ──────────────────────────────────────
async function fetchJson<T>(url: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message ?? `HTTP ${response.status}: Gagal memuat data dari indexer`)
  }

  const payload = await response.json()
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors[0].message ?? 'Indexer mengembalikan error')
  }

  return payload.data as T
}

// ─── Hook: Public Elections List ─────────────────────────────────────────────
export function usePublicElections() {
  return useQuery({
    queryKey: indexerKeys.elections(),
    queryFn: async (): Promise<PublicElectionRecord[]> => {
      const response = await fetch('/api/public/elections')
      if (!response.ok) throw new Error('Gagal memuat daftar pemilihan')
      const data = await response.json()
      return data.elections ?? []
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

export function usePublicElection(id: string) {
  return useQuery({
    queryKey: indexerKeys.election(id),
    queryFn: async (): Promise<PublicElectionRecord | null> => {
      const response = await fetch(`/api/public/elections/${id}`)
      if (!response.ok) return null
      const data = await response.json()
      return data.election ?? null
    },
    enabled: !!id,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  })
}

// ─── Hook: Election Results (from Ponder) ────────────────────────────────────
interface PonderElectionResultsData {
  elections: { items: Array<{
    id: string
    totalCommitted: number
    totalRevealed: number
    lastUpdatedBlock: string
  }> }
  candidateResults: { items: Array<{
    candidateId: string
    voteCount: string
    lastRevealTx: string
    lastUpdatedBlock: string
  }> }
}

export function useElectionResults(spaceAddress?: string | null) {
  return useQuery({
    queryKey: indexerKeys.results(spaceAddress ?? ''),
    queryFn: async (): Promise<PublicElectionResultRecord | null> => {
      if (!spaceAddress) return null
      
      return getPublicElectionResults(spaceAddress)
    },
    enabled: !!spaceAddress,
    staleTime: 15_000, // Results update frequently during reveal
    gcTime: 5 * 60_000,
    refetchInterval: 30_000, // Auto-refetch during active voting
  })
}

// ─── Hook: Voter On-Chain Proofs (Commit + Reveal) ──────────────────────────
interface PonderVoterProofData {
  voteCommits: { items: Array<{
    txHash: string
    spaceAddress: string
    commitment: string
    blockNumber: string
    timestamp: string
  }> }
  voteReveals: { items: Array<{
    txHash: string
    spaceAddress: string
    candidateId: string
    blockNumber: string
    timestamp: string
  }> }
}

export function useVoterOnchainProofs(walletAddress?: string | null, spaceAddresses: string[] = []) {
  return useQuery({
    queryKey: indexerKeys.voterProofs(walletAddress ?? '', spaceAddresses),
    queryFn: async (): Promise<VoterOnchainProofRecord[]> => {
      const wallet = walletAddress?.trim()
      if (!wallet) return []

      const addressVariants = spaceAddresses.length > 0
        ? Array.from(new Set(spaceAddresses.flatMap((a) => [a, a.toLowerCase()])))
        : []
      const voterVariants = Array.from(new Set([wallet, wallet.toLowerCase()]))

      const data = await fetchJson<PonderVoterProofData>(
        '/api/indexer/graphql',
        {
          query: addressVariants.length > 0 ? `
            query VoterOnchainProofs($voterVariants: [String], $addresses: [String]) {
              voteCommits(where: { voter_in: $voterVariants, spaceAddress_in: $addresses }, orderBy: "timestamp", orderDirection: "desc", limit: 100) {
                items { txHash spaceAddress commitment blockNumber timestamp }
              }
              voteReveals(where: { voter_in: $voterVariants, spaceAddress_in: $addresses }, orderBy: "timestamp", orderDirection: "desc", limit: 100) {
                items { txHash spaceAddress candidateId blockNumber timestamp }
              }
            }
          ` : `
            query VoterOnchainProofs($voterVariants: [String]) {
              voteCommits(where: { voter_in: $voterVariants }, orderBy: "timestamp", orderDirection: "desc", limit: 100) {
                items { txHash spaceAddress commitment blockNumber timestamp }
              }
              voteReveals(where: { voter_in: $voterVariants }, orderBy: "timestamp", orderDirection: "desc", limit: 100) {
                items { txHash spaceAddress candidateId blockNumber timestamp }
              }
            }
          `,
          variables: addressVariants.length > 0
            ? { voterVariants, addresses: addressVariants }
            : { voterVariants },
        }
      )

      const bySpace = new Map<string, VoterOnchainProofRecord>()

      const ensureRecord = (spaceAddress: string) => {
        const key = spaceAddress.toLowerCase()
        const existing = bySpace.get(key)
        if (existing) return existing
        const next: VoterOnchainProofRecord = { spaceAddress, commitProof: null, revealProof: null }
        bySpace.set(key, next)
        return next
      }

      const timestampToIso = (value: string) => {
        const numeric = Number(value)
        if (!Number.isFinite(numeric) || numeric <= 0) return new Date().toISOString()
        return new Date(numeric * 1000).toISOString()
      }

      for (const item of data.voteCommits?.items ?? []) {
        const record = ensureRecord(item.spaceAddress)
        if (!record.commitProof) {
          record.commitProof = {
            txHash: item.txHash,
            blockNumber: Number(item.blockNumber),
            createdAt: timestampToIso(item.timestamp),
            commitment: item.commitment,
          }
        }
      }

      for (const item of data.voteReveals?.items ?? []) {
        const record = ensureRecord(item.spaceAddress)
        if (!record.revealProof) {
          record.revealProof = {
            txHash: item.txHash,
            blockNumber: Number(item.blockNumber),
            createdAt: timestampToIso(item.timestamp),
            candidateId: Number(item.candidateId),
          }
        }
      }

      return Array.from(bySpace.values())
    },
    enabled: !!walletAddress,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

// ─── Hook: Audit Logs (Chain Events) ─────────────────────────────────────────
interface PonderAuditData {
  chainEvents: { items: Array<{
    id: string
    actionType: string
    txHash: string
    blockNumber: string
    timestamp: string
    spaceAddress: string | null
    spaceId: string | null
    actor: string | null
    metadata: string | null
  }> }
}

export function useAuditLogs(spaceAddress?: string | null, limit = 6) {
  return useQuery({
    queryKey: indexerKeys.auditLogs(spaceAddress ?? undefined, limit),
    queryFn: async (): Promise<TxAuditLogRecord[]> => {
      return listLatestAuditLogs(undefined, limit, spaceAddress)
    },
    enabled: !!spaceAddress || true, // Can fetch global logs if no spaceAddress
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

// ─── Hook: Prefetch Helpers (for SSR/navigation) ─────────────────────────────
export function prefetchElectionResults(queryClient: ReturnType<typeof useQueryClient>, spaceAddress: string) {
  return queryClient.prefetchQuery({
    queryKey: indexerKeys.results(spaceAddress),
    queryFn: async () => {
      const addressVariants = Array.from(new Set([spaceAddress, spaceAddress.toLowerCase()]))
      const data = await fetchJson<PonderElectionResultsData>(
        '/api/indexer/graphql',
        {
          query: `
            query PublicElectionResults($addresses: [String]) {
              elections(where: { id_in: $addresses }, limit: 1) {
                items { id totalCommitted totalRevealed lastUpdatedBlock }
              }
              candidateResults(where: { spaceAddress_in: $addresses }, orderBy: "candidateId", orderDirection: "asc", limit: 100) {
                items { candidateId voteCount lastRevealTx lastUpdatedBlock }
              }
            }
          `,
          variables: { addresses: addressVariants },
        }
      )

      const electionItem = data.elections?.items?.[0]
      const candidateResults = (data.candidateResults?.items ?? []).map((item) => ({
        candidateId: Number(item.candidateId),
        voteCount: Number(item.voteCount),
        lastRevealTx: item.lastRevealTx || null,
        lastUpdatedBlock: Number(item.lastUpdatedBlock) || null,
      }))

      if (!electionItem && candidateResults.length === 0) return null

      return {
        spaceAddress: electionItem?.id ?? spaceAddress,
        totalCommitted: electionItem?.totalCommitted ?? 0,
        totalRevealed: electionItem?.totalRevealed ?? candidateResults.reduce((t, c) => t + c.voteCount, 0),
        lastUpdatedBlock: electionItem ? Number(electionItem.lastUpdatedBlock) || null : null,
        candidateResults,
      }
    },
    staleTime: 15_000,
  })
}

export function prefetchVoterProofs(queryClient: ReturnType<typeof useQueryClient>, wallet: string, spaceAddresses: string[]) {
  return queryClient.prefetchQuery({
    queryKey: indexerKeys.voterProofs(wallet, spaceAddresses),
    queryFn: async () => {
      const addressVariants = Array.from(new Set(spaceAddresses.flatMap((a) => [a, a.toLowerCase()])))
      const voterVariants = Array.from(new Set([wallet, wallet.toLowerCase()]))

      const data = await fetchJson<PonderVoterProofData>(
        '/api/indexer/graphql',
        {
          query: `
            query VoterOnchainProofs($voterVariants: [String], $addresses: [String]) {
              voteCommits(where: { voter_in: $voterVariants, spaceAddress_in: $addresses }, orderBy: "timestamp", orderDirection: "desc", limit: 100) {
                items { txHash spaceAddress commitment blockNumber timestamp }
              }
              voteReveals(where: { voter_in: $voterVariants, spaceAddress_in: $addresses }, orderBy: "timestamp", orderDirection: "desc", limit: 100) {
                items { txHash spaceAddress candidateId blockNumber timestamp }
              }
            }
          `,
          variables: { voterVariants, addresses: addressVariants },
        }
      )

      const bySpace = new Map<string, VoterOnchainProofRecord>()
      const ensureRecord = (spaceAddress: string) => {
        const key = spaceAddress.toLowerCase()
        const existing = bySpace.get(key)
        if (existing) return existing
        const next: VoterOnchainProofRecord = { spaceAddress, commitProof: null, revealProof: null }
        bySpace.set(key, next)
        return next
      }

      const timestampToIso = (value: string) => {
        const numeric = Number(value)
        if (!Number.isFinite(numeric) || numeric <= 0) return new Date().toISOString()
        return new Date(numeric * 1000).toISOString()
      }

      for (const item of data.voteCommits?.items ?? []) {
        const record = ensureRecord(item.spaceAddress)
        if (!record.commitProof) {
          record.commitProof = { txHash: item.txHash, blockNumber: Number(item.blockNumber), createdAt: timestampToIso(item.timestamp), commitment: item.commitment }
        }
      }
      for (const item of data.voteReveals?.items ?? []) {
        const record = ensureRecord(item.spaceAddress)
        if (!record.revealProof) {
          record.revealProof = { txHash: item.txHash, blockNumber: Number(item.blockNumber), createdAt: timestampToIso(item.timestamp), candidateId: Number(item.candidateId) }
        }
      }

      return Array.from(bySpace.values())
    },
    staleTime: 60_000,
  })
}
