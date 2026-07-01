'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database, Json } from '@/lib/supabase/database.types'
import { RepositoryError } from '@/lib/repositories/errors'
import type {
  NotificationJobRecord,
  PublicElectionCandidateRecord,
  PublicElectionCandidateResultRecord,
  PublicElectionPhase,
  PublicElectionRecord,
  PublicElectionResultRecord,
  TxAuditLogRecord,
  VoterOnchainProofRecord,
} from '@/lib/repositories/types'
import { asStringArray, isRecord } from './helpers'
import { formatDateTime } from '@/lib/voter-helpers'

type ProposalRow = Database['app']['Tables']['proposal_drafts']['Row']
type CandidateRow = Database['app']['Tables']['proposal_candidates']['Row']
type WhitelistRow = Database['app']['Tables']['proposal_whitelist_entries']['Row']
type TxAuditRow = Database['app']['Tables']['tx_audit_log']['Row']
type NotificationRow = Database['app']['Tables']['notification_jobs']['Row']

let notificationBackendUnavailable = false
let indexerBackendUnavailable = false

function isMissingNotificationBackend(error: { code?: string; message?: string; details?: string }) {
  const text = `${error.code ?? ''} ${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
  return text.includes('notification_jobs') || text.includes('schema') || text.includes('not found') || text.includes('could not find')
}

function asObject(value: Json): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function resolvePhase(row: ProposalRow): PublicElectionPhase {
  const now = Date.now()
  const commitStart = row.commit_start_at ? new Date(row.commit_start_at).getTime() : Number.NaN
  const revealStart = row.reveal_start_at ? new Date(row.reveal_start_at).getTime() : Number.NaN
  const endedAt = row.ended_at ? new Date(row.ended_at).getTime() : Number.NaN

  if (row.status === 'archived' || (!Number.isNaN(endedAt) && now >= endedAt)) return 'ended'
  if (row.status !== 'deployed') return 'registration'
  if (!Number.isNaN(revealStart) && now >= revealStart) return 'reveal'
  if (!Number.isNaN(commitStart) && now >= commitStart) return 'commit'
  return 'registration'
}

function phaseLabel(phase: PublicElectionPhase): string {
  if (phase === 'commit') return 'Tahap Memilih'
  if (phase === 'reveal') return 'Tahap Konfirmasi'
  if (phase === 'ended') return 'Selesai'
  return 'Persiapan'
}

function deadlineLabel(row: ProposalRow, phase: PublicElectionPhase): string {
  if (phase === 'commit') return `Batas memilih ${formatDateTime(row.reveal_start_at)}`
  if (phase === 'reveal') return `Batas konfirmasi ${formatDateTime(row.ended_at)}`
  if (phase === 'registration') return `Mulai memilih ${formatDateTime(row.commit_start_at)}`
  return row.ended_at ? `Selesai ${formatDateTime(row.ended_at)}` : 'Selesai'
}

function mapCandidate(row: CandidateRow): PublicElectionCandidateRecord {
  return {
    id: row.id,
    candidateLocalId: row.candidate_local_id,
    fullName: row.full_name,
    studentId: row.student_id,
    faculty: row.faculty,
    bio: row.bio,
    vision: row.vision,
    mission: asStringArray(row.mission),
    youtubeUrl: row.youtube_url,
    avatarPath: row.avatar_path,
    sortOrder: row.sort_order,
  }
}

function getPonderGraphqlUrl(): string | null {
  if (indexerBackendUnavailable) return null
  if (process.env.NEXT_PUBLIC_ENABLE_INDEXER !== 'true') return null
  const rawUrl = process.env.NEXT_PUBLIC_PONDER_URL?.trim()
  if (!rawUrl) return null
  if (typeof window !== 'undefined') return '/api/indexer/graphql'
  return rawUrl.endsWith('/graphql') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/graphql`
}

function markIndexerUnavailable(status: number) {
  if (status === 404 || status === 503) {
    indexerBackendUnavailable = true
  }
}

function asFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

interface PonderResultItem {
  candidateId: string
  voteCount: string
  lastRevealTx: string
  lastUpdatedBlock: string
}

interface PonderElectionItem {
  id: string
  totalCommitted: number
  totalRevealed: number
  lastUpdatedBlock: string
}

interface PonderElectionResultsResponse {
  data?: {
    elections?: { items?: PonderElectionItem[] }
    candidateResults?: { items?: PonderResultItem[] }
  }
  errors?: Array<{ message?: string }>
}

interface PonderChainEventItem {
  id: string
  actionType: string
  txHash: string
  blockNumber: string
  timestamp: string
  spaceAddress?: string | null
  spaceId?: string | null
  actor?: string | null
  metadata?: string | null
}

interface PonderAuditResponse {
  data?: {
    chainEvents?: { items?: PonderChainEventItem[] }
  }
  errors?: Array<{ message?: string }>
}

interface PonderVoteCommitItem {
  txHash: string
  spaceAddress: string
  commitment: string
  blockNumber: string
  timestamp: string
}

interface PonderVoteRevealItem {
  txHash: string
  spaceAddress: string
  candidateId: string
  blockNumber: string
  timestamp: string
}

interface PonderVoterProofResponse {
  data?: {
    voteCommits?: { items?: PonderVoteCommitItem[] }
    voteReveals?: { items?: PonderVoteRevealItem[] }
  }
  errors?: Array<{ message?: string }>
}

function isPonderElectionResultsResponse(value: unknown): value is PonderElectionResultsResponse {
  return value !== null && typeof value === 'object'
}

function mapPonderCandidateResult(item: PonderResultItem): PublicElectionCandidateResultRecord {
  return {
    candidateId: asFiniteNumber(item.candidateId),
    voteCount: asFiniteNumber(item.voteCount),
    lastRevealTx: item.lastRevealTx || null,
    lastUpdatedBlock: asFiniteNumber(item.lastUpdatedBlock) || null,
  }
}

function timestampToIso(value: unknown): string {
  const numeric = asFiniteNumber(value)
  if (numeric <= 0) return new Date().toISOString()
  return new Date(numeric * 1000).toISOString()
}

function mapPonderAuditEvent(item: PonderChainEventItem): TxAuditLogRecord {
  return {
    id: item.id,
    spaceId: asFiniteNumber(item.spaceId) || null,
    proposalDraftId: null,
    walletAddress: item.actor ?? '0x0000000000000000000000000000000000000000',
    actionType: item.actionType,
    txHash: item.txHash,
    blockNumber: asFiniteNumber(item.blockNumber) || null,
    status: 'success',
    source: 'ponder',
    metadata: parseMetadata(item.metadata),
    createdAt: timestampToIso(item.timestamp),
  }
}

function parseMetadata(value?: string | null): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function isPonderAuditResponse(value: unknown): value is PonderAuditResponse {
  return value !== null && typeof value === 'object'
}

function isPonderVoterProofResponse(value: unknown): value is PonderVoterProofResponse {
  return value !== null && typeof value === 'object'
}

function mapElection(row: ProposalRow, candidates: CandidateRow[], whitelistRows: WhitelistRow[]): PublicElectionRecord {
  const phase = resolvePhase(row)
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    bannerImagePath: row.banner_image_path,
    organizationName: row.organization_name,
    status: row.status,
    phase,
    phaseLabel: phaseLabel(phase),
    deadlineLabel: deadlineLabel(row, phase),
    commitStartAt: row.commit_start_at,
    registrationStartAt: row.registration_start_at,
    revealStartAt: row.reveal_start_at,
    endedAt: row.ended_at,
    candidateCount: row.candidate_count,
    participantCount: whitelistRows.length,
    deployedSpaceId: row.deployed_space_id,
    deployedSpaceAddress: row.deployed_space_address,
    deploymentTxHash: row.deployment_tx_hash,
    candidates: candidates
      .filter((candidate) => candidate.proposal_draft_id === row.id)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map(mapCandidate),
  }
}

export async function listPublicElections(): Promise<PublicElectionRecord[]> {
  if (typeof window !== 'undefined') {
    const response = await fetch('/api/public/elections', { method: 'GET' })
    const payload: unknown = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : 'Gagal memuat data pemilihan publik.'
      throw new RepositoryError(message)
    }
    if (isRecord(payload) && Array.isArray(payload.elections)) return payload.elections as PublicElectionRecord[]
    return []
  }

  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data: proposals, error } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('*')
    .in('status', ['deployed', 'archived'])
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat data pemilihan dari Supabase.')

  const rows = proposals ?? []
  if (rows.length === 0) return []

  const ids = rows.map((row) => row.id)

  const [{ data: candidates, error: candidatesError }, { data: whitelist, error: whitelistError }] = await Promise.all([
    client.schema('app').from('proposal_candidates').select('*').in('proposal_draft_id', ids),
    client.schema('app').from('proposal_whitelist_entries').select('*').in('proposal_draft_id', ids),
  ])

  if (candidatesError) throw new RepositoryError('Gagal memuat kandidat pemilihan dari Supabase.')
  if (whitelistError) throw new RepositoryError('Gagal memuat whitelist pemilihan dari Supabase.')

  return rows.map((row) => mapElection(
    row,
    candidates ?? [],
    (whitelist ?? []).filter((entry) => entry.proposal_draft_id === row.id),
  ))
}

export async function listVoterWhitelistedElections(walletAddress: string | string[]): Promise<PublicElectionRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  if (typeof window !== 'undefined') {
    const { data: sessionData } = await client.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (accessToken) {
      // Pass wallet as query param fallback for when app_profiles.wallet_address is not yet set
      const walletParam = (Array.isArray(walletAddress) ? walletAddress[0] : walletAddress) ?? ''
      const url = walletParam ? `/api/voter/elections?wallet=${encodeURIComponent(walletParam)}` : '/api/voter/elections'
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(walletParam ? { 'X-Wallet-Address': walletParam } : {}),
        },
      })

      if (response.ok) {
        const payload: unknown = await response.json()
        if (isRecord(payload) && Array.isArray(payload.elections)) {
          return payload.elections as PublicElectionRecord[]
        }
      }
    }
  }

  const walletAddresses = (Array.isArray(walletAddress) ? walletAddress : [walletAddress])
    .map((address) => address.trim())
    .filter(Boolean)
  const walletVariants = Array.from(new Set(walletAddresses.flatMap((address) => [address, address.toLowerCase()])))
  if (walletVariants.length === 0) return []

  const whitelistOrFilter = walletVariants
    .map((address) => `wallet_address.ilike.${address}`)
    .join(',')

  const { data: matchedWhitelist, error: matchedWhitelistError } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .select('*')
    .or(whitelistOrFilter)

  if (matchedWhitelistError) throw new RepositoryError('Gagal memeriksa whitelist pemilih. Coba lagi.')

  const matchedProposalIds = Array.from(new Set((matchedWhitelist ?? []).map((entry) => entry.proposal_draft_id)))
  if (matchedProposalIds.length === 0) return []

  const { data: proposals, error } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('*')
    .in('id', matchedProposalIds)
    .in('status', ['approved', 'deployed', 'archived'])
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat data pemilihan dari Supabase.')

  const rows = proposals ?? []
  if (rows.length === 0) return []

  const ids = rows.map((row) => row.id)

  const [{ data: candidates, error: candidatesError }, { data: whitelist, error: whitelistError }] = await Promise.all([
    client.schema('app').from('proposal_candidates').select('*').in('proposal_draft_id', ids),
    client.schema('app').from('proposal_whitelist_entries').select('*').in('proposal_draft_id', ids),
  ])

  if (candidatesError) throw new RepositoryError('Gagal memuat kandidat pemilihan dari Supabase.')
  if (whitelistError) throw new RepositoryError('Gagal memuat whitelist pemilihan dari Supabase.')

  const whitelistRows = whitelist ?? []

  return rows.map((row) => mapElection(
      row,
      candidates ?? [],
      whitelistRows.filter((entry) => entry.proposal_draft_id === row.id),
    ))
}

export async function getPublicElectionById(id: string): Promise<PublicElectionRecord | null> {
  if (typeof window !== 'undefined') {
    const response = await fetch(`/api/public/elections/${id}`, { method: 'GET' })
    const payload: unknown = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : 'Gagal memuat detail pemilihan publik.'
      throw new RepositoryError(message)
    }
    if (isRecord(payload) && payload.election && typeof payload.election === 'object') return payload.election as PublicElectionRecord
    return null
  }
  const elections = await listPublicElections()
  return elections.find((election) => election.id === id) ?? null
}

export async function getPublicElectionResults(spaceAddress?: string | null): Promise<PublicElectionResultRecord | null> {
  if (!spaceAddress) return null
  const graphqlUrl = getPonderGraphqlUrl()

  // ponytail: if Ponder is configured, try it first; fall back to direct chain read
  if (graphqlUrl) {
    try {
      return await fetchPonderResults(graphqlUrl, spaceAddress)
    } catch {
      // ponytail: Ponder failed, fall through to chain reader
    }
  }

  return fetchChainResults(spaceAddress)
}

async function fetchPonderResults(graphqlUrl: string, spaceAddress: string): Promise<PublicElectionResultRecord | null> {
  const addressVariants = Array.from(new Set([spaceAddress, spaceAddress.toLowerCase()]))
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query PublicElectionResults($addresses: [String]) {
          elections(where: { id_in: $addresses }, limit: 1) {
            items {
              id
              totalCommitted
              totalRevealed
              lastUpdatedBlock
            }
          }
          candidateResults(where: { spaceAddress_in: $addresses }, orderBy: "candidateId", orderDirection: "asc", limit: 100) {
            items {
              candidateId
              voteCount
              lastRevealTx
              lastUpdatedBlock
            }
          }
        }
      `,
      variables: { addresses: addressVariants },
    }),
  })

  if (!response.ok) {
    markIndexerUnavailable(response.status)
    if (response.status === 404 || response.status === 503) return null
    throw new RepositoryError('Gagal memuat hasil dari indexer Ponder.')
  }

  const payload: unknown = await response.json()
  if (!isPonderElectionResultsResponse(payload)) {
    throw new RepositoryError('Format hasil indexer tidak dikenali.')
  }
  if (payload.errors && payload.errors.length > 0) {
    throw new RepositoryError('Indexer belum siap menyajikan hasil pemilihan.')
  }

  const electionItem = payload.data?.elections?.items?.[0]
  const candidateResults = (payload.data?.candidateResults?.items ?? []).map(mapPonderCandidateResult)
  if (!electionItem && candidateResults.length === 0) return null

  return {
    spaceAddress: electionItem?.id ?? spaceAddress,
    totalCommitted: electionItem?.totalCommitted ?? 0,
    totalRevealed: electionItem?.totalRevealed ?? candidateResults.reduce((total, item) => total + item.voteCount, 0),
    lastUpdatedBlock: electionItem ? asFiniteNumber(electionItem.lastUpdatedBlock) || null : null,
    candidateResults,
  }
}

async function fetchChainResults(spaceAddress: string): Promise<PublicElectionResultRecord | null> {
  // ponytail: client routes through API, server calls directly
  const url = typeof window !== 'undefined'
    ? `/api/election/results/${spaceAddress}`
    : null

  if (!url) return null

  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) return null

  const data: unknown = await response.json()
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  return {
    spaceAddress: (d.spaceAddress as string) ?? spaceAddress,
    totalCommitted: (d.totalCommitted as number) ?? 0,
    totalRevealed: (d.totalRevealed as number) ?? 0,
    lastUpdatedBlock: (d.lastUpdatedBlock as number) ?? null,
    candidateResults: Array.isArray(d.candidateResults)
      ? d.candidateResults.map((r: Record<string, unknown>) => ({
          candidateId: Number(r.candidateId) || 0,
          voteCount: Number(r.voteCount) || 0,
          lastRevealTx: (r.lastRevealTx as string) ?? null,
          lastUpdatedBlock: (r.lastUpdatedBlock as number) ?? null,
        }))
      : [],
  }
}

export async function listPonderAuditLogs(spaceAddress?: string | null, limit = 6): Promise<TxAuditLogRecord[] | null> {
  const graphqlUrl = getPonderGraphqlUrl()
  if (!graphqlUrl) return null

  const addressVariants = spaceAddress ? Array.from(new Set([spaceAddress, spaceAddress.toLowerCase()])) : null
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: addressVariants ? `
        query PonderAuditLogs($addresses: [String], $limit: Int) {
          chainEvents(where: { spaceAddress_in: $addresses }, orderBy: "timestamp", orderDirection: "desc", limit: $limit) {
            items { id actionType txHash blockNumber timestamp spaceAddress spaceId actor metadata }
          }
        }
      ` : `
        query PonderAuditLogs($limit: Int) {
          chainEvents(orderBy: "timestamp", orderDirection: "desc", limit: $limit) {
            items { id actionType txHash blockNumber timestamp spaceAddress spaceId actor metadata }
          }
        }
      `,
      variables: addressVariants ? { addresses: addressVariants, limit } : { limit },
    }),
  })

  if (!response.ok) {
    markIndexerUnavailable(response.status)
    if (response.status === 404 || response.status === 503) return null
    throw new RepositoryError('Gagal memuat jejak audit dari indexer Ponder.')
  }

  const payload: unknown = await response.json()
  if (!isPonderAuditResponse(payload)) throw new RepositoryError('Format audit indexer tidak dikenali.')
  if (payload.errors && payload.errors.length > 0) throw new RepositoryError('Indexer belum siap menyajikan audit log.')

  return (payload.data?.chainEvents?.items ?? []).map(mapPonderAuditEvent)
}

export async function getElectionResultsFromIndexer(spaceAddress?: string | null): Promise<PublicElectionResultRecord | null> {
  return getPublicElectionResults(spaceAddress)
}

export async function listVoterOnchainProofs(walletAddress?: string | null, spaceAddresses: string[] = []): Promise<VoterOnchainProofRecord[]> {
  const graphqlUrl = getPonderGraphqlUrl()
  const wallet = walletAddress?.trim()
  if (!graphqlUrl || !wallet) return []

  const addressVariants = Array.from(new Set(spaceAddresses.flatMap((address) => [address, address.toLowerCase()])))
  const voterVariants = Array.from(new Set([wallet, wallet.toLowerCase()]))
  const variables = addressVariants.length > 0
    ? { voterVariants, addresses: addressVariants }
    : { voterVariants }

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
      variables,
    }),
  })

  if (!response.ok) {
    markIndexerUnavailable(response.status)
    if (response.status === 404 || response.status === 503) return []
    throw new RepositoryError('Gagal memuat bukti pemilih dari indexer Ponder.')
  }

  const payload: unknown = await response.json()
  if (!isPonderVoterProofResponse(payload)) throw new RepositoryError('Format bukti pemilih indexer tidak dikenali.')
  if (payload.errors && payload.errors.length > 0) throw new RepositoryError('Indexer belum siap menyajikan bukti pemilih.')

  const bySpace = new Map<string, VoterOnchainProofRecord>()
  const ensureRecord = (spaceAddress: string) => {
    const key = spaceAddress.toLowerCase()
    const existing = bySpace.get(key)
    if (existing) return existing
    const next: VoterOnchainProofRecord = { spaceAddress, commitProof: null, revealProof: null }
    bySpace.set(key, next)
    return next
  }

  for (const item of payload.data?.voteCommits?.items ?? []) {
    const record = ensureRecord(item.spaceAddress)
    if (!record.commitProof) {
      record.commitProof = {
        txHash: item.txHash,
        blockNumber: asFiniteNumber(item.blockNumber),
        createdAt: timestampToIso(item.timestamp),
        commitment: item.commitment,
      }
    }
  }

  for (const item of payload.data?.voteReveals?.items ?? []) {
    const record = ensureRecord(item.spaceAddress)
    if (!record.revealProof) {
      record.revealProof = {
        txHash: item.txHash,
        blockNumber: asFiniteNumber(item.blockNumber),
        createdAt: timestampToIso(item.timestamp),
        candidateId: asFiniteNumber(item.candidateId),
      }
    }
  }

  return Array.from(bySpace.values())
}

export async function listLatestAuditLogs(proposalDraftId?: string, limit = 6, spaceAddress?: string | null): Promise<TxAuditLogRecord[]> {
  if (spaceAddress || !proposalDraftId) {
    try {
      const ponderLogs = await listPonderAuditLogs(spaceAddress, limit)
      if (ponderLogs) return ponderLogs
    } catch {
      // Fall back to Supabase audit rows when the optional Ponder endpoint is unavailable.
    }
  }

  const client = getSupabaseBrowserClient()
  if (!client) return []

  let query = client
    .schema('app')
    .from('tx_audit_log')
    .select('*')
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (proposalDraftId) {
    query = query.eq('proposal_draft_id', proposalDraftId)
  }

  const { data, error } = await query
  if (error) {
    console.warn('Latest audit log fetch error:', error.message)
    return []
  }

  return (data ?? []).map(mapTxAuditRow)
}

function mapTxAuditRow(row: TxAuditRow): TxAuditLogRecord {
  return {
    id: row.id,
    spaceId: row.space_id,
    proposalDraftId: row.proposal_draft_id,
    walletAddress: row.wallet_address,
    actionType: row.action_type,
    txHash: row.tx_hash,
    blockNumber: row.block_number,
    status: row.status,
    source: row.source,
    metadata: asObject(row.metadata),
    createdAt: row.created_at,
  }
}

function relativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'Baru saja'
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

export async function listPublicNotifications(): Promise<NotificationJobRecord[]> {
  if (notificationBackendUnavailable) return []

  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('notification_jobs')
    .select('*')
    .eq('channel', 'in_app')
    .in('status', ['queued', 'sent'])
    .is('target_profile_id', null)
    .is('target_wallet', null)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    if (isMissingNotificationBackend(error)) {
      notificationBackendUnavailable = true
      return []
    }
    throw new RepositoryError('Gagal memuat notifikasi dari Supabase.')
  }

  return (data ?? []).map(mapNotificationRow)
}

export async function listUserNotifications(profileId?: string, walletAddress?: string): Promise<NotificationJobRecord[]> {
  if (notificationBackendUnavailable) return []

  const client = getSupabaseBrowserClient()
  if (!client) return []

  let query = client
    .schema('app')
    .from('notification_jobs')
    .select('*')
    .eq('channel', 'in_app')
    .in('status', ['queued', 'sent'])
    .order('created_at', { ascending: false })
    .limit(20)

  const filters: string[] = []
  if (profileId) filters.push(`target_profile_id.eq.${profileId}`)
  if (walletAddress) filters.push(`target_wallet.eq.${walletAddress}`)
  filters.push('and(target_profile_id.is.null,target_wallet.is.null)')

  query = query.or(filters.join(','))

  const { data, error } = await query
  if (error) {
    if (isMissingNotificationBackend(error)) {
      notificationBackendUnavailable = true
      return []
    }
    throw new RepositoryError('Gagal memuat notifikasi personal dari Supabase.')
  }

  return (data ?? []).map(mapNotificationRow)
}

function mapNotificationRow(row: NotificationRow): NotificationJobRecord {
  const payload = asObject(row.payload)
  const tone = payload.type === 'success' || payload.type === 'warning' ? payload.type : 'info'
  // DB trigger uses 'message', frontend uses 'description' — check both
  const description = typeof payload.description === 'string'
    ? payload.description
    : typeof payload.message === 'string'
      ? payload.message
      : 'Notifikasi sistem tersedia.'
  return {
    id: row.id,
    title: typeof payload.title === 'string' ? payload.title : row.template_key,
    description,
    timeLabel: relativeTime(row.created_at),
    type: tone,
    link: typeof payload.link === 'string' ? payload.link : undefined,
  }
}
