'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { clearAllVoteCommitments } from '@/lib/vote-commitment-storage'
import { getPublicElectionResults, listVoterOnchainProofs, listVoterWhitelistedElections } from '@/lib/repositories/electionRepository'
import { getCurrentProfile } from '@/lib/repositories/profileRepository'
import type { PublicElectionRecord, PublicElectionResultRecord, VoterOnchainProofRecord } from '@/lib/repositories/types'
import { formatNumber } from './voter-helpers'

// Re-export pure helpers from voter-helpers.ts for backward compatibility
export {
  basescanTxUrl,
  formatDateTime,
  formatDateShort,
  formatNumber,
  formatWallet,
  getPhaseLabel,
  getPhaseTone,
  getElectionProgress,
  getElectionViewState,
  sortDashboardElections,
  resolveElectionAction,
  getElectionResultRows,
  getRecentLogs,
} from './voter-helpers'

export type VoterElectionPhase = 'commit' | 'reveal' | 'ended' | 'suspended'

export interface VoterCandidate {
  id: string
  name: string
  faculty: string
  vision: string
  mission: string[]
  votes: number
  avatarPath?: string | null
}

export interface VoterProof {
  txHash: string
  blockNumber: number
  gasUsed?: number | null
  createdAt: string
  statusLabel: string
}

export interface VoterLogItem {
  id: string
  title: string
  detail: string
  timeLabel: string
  tone: 'success' | 'info' | 'warning'
}

export interface VoterElection {
  id: string
  title: string
  organization: string
  summary: string
  bannerPath?: string | null
  phase: VoterElectionPhase
  deadlineIso: string
  commitStartAt: string | null
  revealStartAt: string | null
  endedAt: string | null
  totalParticipants: number
  committedCount: number
  revealedCount: number
  quorumPercent: number
  candidateCount: number
  candidates: VoterCandidate[]
  selectedCandidateId: string | null
  committedCandidateId: string | null
  commitProof: VoterProof | null
  revealProof: VoterProof | null
  commitmentHash: string | null
  voterIdentifier: string
  lastTransactionLabel: string
  supportCopy: string
  deployedSpaceAddress?: string | null
}

export interface VoterProfile {
  name: string
  email: string
  wallet: string
  bio: string
  avatarUrl: string
}

export interface VoterStore {
  profile: VoterProfile
  elections: VoterElection[]
  selectedProofElectionId: string
}

export type VoterElectionAction = 'commit' | 'reveal' | 'results' | 'wait'

export interface VoterElectionViewState {
  hasCommitted: boolean
  hasRevealed: boolean
  canCommit: boolean
  canReveal: boolean
  canViewResults: boolean
  nextAction: VoterElectionAction
}

const STORAGE_KEY = 'votein-voter-store-v3-live'
const LEGACY_STORAGE_KEY = 'votein-voter-store-v2'

const emptyProfile: VoterProfile = {
  name: 'Pemilih',
  email: '',
  wallet: '',
  bio: '',
  avatarUrl: '',
}

const voterStoreInitial: VoterStore = {
  profile: emptyProfile,
  selectedProofElectionId: '',
  elections: [],
}

function cloneStore(seed: VoterStore) {
  return JSON.parse(JSON.stringify(seed)) as VoterStore
}

function sanitizeProfile(profile?: Partial<VoterProfile>): VoterProfile {
  if (!profile) return emptyProfile
  return {
    name: profile.name ?? emptyProfile.name,
    email: profile.email ?? '',
    wallet: profile.wallet ?? '',
    bio: profile.bio ?? '',
    avatarUrl: profile.avatarUrl ?? '',
  }
}

function readStore() {
  if (typeof window === 'undefined') return cloneStore(voterStoreInitial)

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    return cloneStore(voterStoreInitial)
  }

  try {
    const parsed = JSON.parse(raw) as VoterStore
    return { ...voterStoreInitial, ...parsed, profile: sanitizeProfile(parsed.profile), elections: parsed.elections ?? [] }
  } catch {
    return cloneStore(voterStoreInitial)
  }
}

function persistStore(store: VoterStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

function deadlineFor(election: PublicElectionRecord) {
  if (election.phase === 'suspended') return election.commitStartAt
  if (election.phase === 'commit') return election.revealStartAt
  if (election.phase === 'reveal') return election.endedAt
  if (election.phase === 'ended') return election.endedAt
  return election.commitStartAt
}

function mapElectionFromSupabase(election: PublicElectionRecord): VoterElection {
  return {
    id: election.id,
    title: election.title,
    organization: election.organizationName ?? 'Organisasi',
    summary: election.description ?? 'Data pemilihan dimuat dari Supabase.',
    bannerPath: election.bannerImagePath,
    phase: election.phase,
    deadlineIso: deadlineFor(election) ?? new Date().toISOString(),
    commitStartAt: election.commitStartAt,
    revealStartAt: election.revealStartAt,
    endedAt: election.endedAt,
    totalParticipants: election.participantCount,
    committedCount: 0,
    revealedCount: 0,
    quorumPercent: 0,
    candidateCount: election.candidates.length,
    selectedCandidateId: null,
    committedCandidateId: null,
    commitProof: null,
    revealProof: null,
    commitmentHash: null,
    voterIdentifier: 'Wallet Supabase',
    lastTransactionLabel: 'Belum ada transaksi dari akun ini.',
    supportCopy: 'Data pemilihan berasal dari Supabase. Bukti transaksi hanya tampil setelah transaksi wallet berhasil.',
    deployedSpaceAddress: election.deployedSpaceAddress,
    candidates: election.candidates.map((candidate) => ({
      id: candidate.candidateLocalId,
      name: candidate.fullName,
      faculty: candidate.faculty ?? candidate.studentId ?? 'Data fakultas belum diisi',
      vision: candidate.vision ?? candidate.bio ?? 'Visi kandidat belum diisi.',
      mission: candidate.mission,
      votes: 0,
      avatarPath: candidate.avatarPath,
    })),
  }
}

function resolveCandidateNumber(candidateLocalId: string, fallbackIndex: number) {
  const match = candidateLocalId.match(/(\d+)$/)
  if (!match) return fallbackIndex + 1
  const parsed = Number(match[1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackIndex + 1
}

function mergePonderResult(election: VoterElection, result?: PublicElectionResultRecord | null): VoterElection {
  if (!result) return election
  const votesByCandidate = new Map(result.candidateResults.map((item) => [item.candidateId, item.voteCount]))
  const candidates = election.candidates.map((candidate, index) => ({
    ...candidate,
    votes: votesByCandidate.get(resolveCandidateNumber(candidate.id, index)) ?? candidate.votes,
  }))
  const quorumPercent = election.totalParticipants > 0
    ? Math.min(100, Math.round((result.totalRevealed / election.totalParticipants) * 100))
    : 0

  return {
    ...election,
    candidates,
    committedCount: result.totalCommitted,
    revealedCount: result.totalRevealed,
    quorumPercent,
    lastTransactionLabel: result.lastUpdatedBlock ? `Terindeks sampai block #${formatNumber(result.lastUpdatedBlock)}.` : election.lastTransactionLabel,
  }
}

function mergeVoterProof(election: VoterElection, proof?: VoterOnchainProofRecord): VoterElection {
  if (!proof) return election
  const revealCandidate = proof.revealProof
    ? election.candidates[proof.revealProof.candidateId - 1]
    : null

  return {
    ...election,
    committedCandidateId: election.committedCandidateId ?? revealCandidate?.id ?? null,
    commitmentHash: proof.commitProof?.commitment ?? election.commitmentHash,
    commitProof: proof.commitProof ? {
      txHash: proof.commitProof.txHash,
      blockNumber: proof.commitProof.blockNumber,
      gasUsed: null,
      createdAt: proof.commitProof.createdAt,
      statusLabel: 'Commit terindeks',
    } : election.commitProof,
    revealProof: proof.revealProof ? {
      txHash: proof.revealProof.txHash,
      blockNumber: proof.revealProof.blockNumber,
      gasUsed: null,
      createdAt: proof.revealProof.createdAt,
      statusLabel: 'Reveal terindeks',
    } : election.revealProof,
    lastTransactionLabel: proof.revealProof
      ? 'Reveal sudah terindeks oleh Ponder.'
      : proof.commitProof
        ? 'Commit sudah terindeks oleh Ponder.'
        : election.lastTransactionLabel,
  }
}

function mergeLocalElectionState(live: VoterElection, local?: VoterElection): VoterElection {
  if (!local) return live
  return {
    ...live,
    selectedCandidateId: local.selectedCandidateId,
    committedCandidateId: local.committedCandidateId ?? live.committedCandidateId,
    commitProof: local.commitProof ?? live.commitProof,
    revealProof: local.revealProof ?? live.revealProof,
    commitmentHash: local.commitmentHash ?? live.commitmentHash,
    lastTransactionLabel: (local.commitProof || local.revealProof) ? local.lastTransactionLabel : live.lastTransactionLabel,
  }
}

async function buildLiveStore(): Promise<VoterStore> {
  const local = readStore()
  const profile = await getCurrentProfile().catch((err) => {
    console.error('[voter-store] getCurrentProfile failed:', err)
    return null
  })
  const activeWallets = Array.from(new Set([profile?.walletAddress, local.profile.wallet].filter((wallet): wallet is string => Boolean(wallet))))
  console.log('[voter-store] buildLiveStore', { profileWallet: profile?.walletAddress ?? null, localWallet: local.profile.wallet, activeWallets })
  const elections = await listVoterWhitelistedElections(activeWallets).catch((err) => {
    console.error('[voter-store] listVoterWhitelistedElections failed:', err)
    return []
  })
  console.log('[voter-store] elections loaded:', elections.length)

  const resultEntries = await Promise.all(elections.map(async (item) => ({
    id: item.id,
    result: await getPublicElectionResults(item.deployedSpaceAddress).catch(() => null),
  })))
  const resultByElection = new Map(resultEntries.map((entry) => [entry.id, entry.result]))
  const proofEntries = await listVoterOnchainProofs(
    profile?.walletAddress ?? local.profile.wallet,
    elections.map((item) => item.deployedSpaceAddress).filter((address): address is string => Boolean(address)),
  ).catch(() => [])
  const proofByAddress = new Map(proofEntries.map((entry) => [entry.spaceAddress.toLowerCase(), entry]))

  const liveElections = elections.map((item) => {
    const mapped = mergePonderResult(mapElectionFromSupabase(item), resultByElection.get(item.id))
    const withProof = mergeVoterProof(mapped, item.deployedSpaceAddress ? proofByAddress.get(item.deployedSpaceAddress.toLowerCase()) : undefined)
    return mergeLocalElectionState(withProof, local.elections.find((election) => election.id === mapped.id))
  })

  return {
    profile: profile ? {
      name: profile.displayName ?? 'Pemilih',
      email: profile.email ?? '',
      wallet: profile.walletAddress,
      bio: local.profile.bio,
      avatarUrl: profile.avatarUrl ?? '',
    } : local.profile,
    elections: liveElections,
    selectedProofElectionId: liveElections.some((election) => election.id === local.selectedProofElectionId)
      ? local.selectedProofElectionId
      : liveElections[0]?.id ?? '',
  }
}

function updateElection(store: VoterStore, electionId: string, updater: (election: VoterElection) => VoterElection) {
  return {
    ...store,
    elections: store.elections.map((election) => election.id === electionId ? updater(election) : election),
  }
}

export function useVoterStore() {
  const [store, setStore] = useState<VoterStore | null>(null)

  useEffect(() => {
    let cancelled = false
    buildLiveStore().then((next) => {
      if (!cancelled) {
        persistStore(next)
        setStore(next)
      }
    })
    return () => { cancelled = true }
  }, [])

  const applyStore = useCallback((updater: (current: VoterStore) => VoterStore) => {
    setStore((current) => {
      const base = current ?? readStore()
      const next = updater(base)
      persistStore(next)
      return next
    })
  }, [])

  const actions = useMemo(() => ({
    refresh() {
      let cancelled = false
      buildLiveStore().then((next) => {
        if (!cancelled) {
          persistStore(next)
          setStore(next)
        }
      })
      return () => { cancelled = true }
    },
    reset() {
      clearAllVoteCommitments()
      persistStore(voterStoreInitial)
      setStore(cloneStore(voterStoreInitial))
    },
    selectCandidate(electionId: string, candidateId: string) {
      applyStore((current) => updateElection(current, electionId, (election) => ({ ...election, selectedCandidateId: candidateId })))
    },
    commitVote(electionId: string, commitmentHash?: string, proof?: VoterProof): VoterProof | null {
      if (!proof) return null
      applyStore((current) => updateElection(current, electionId, (election) => ({
        ...election,
        committedCandidateId: election.selectedCandidateId,
        committedCount: Math.min(election.totalParticipants, election.committedCount + 1),
        commitmentHash: commitmentHash ?? election.commitmentHash,
        commitProof: proof,
        lastTransactionLabel: 'Suara terkunci. Penghitungan otomatis akan berjalan sesuai jadwal.',
      })))
      return proof
    },
    revealVote(electionId: string, proof?: VoterProof): VoterProof | null {
      if (!proof) return null
      applyStore((current) => updateElection(current, electionId, (election) => ({
        ...election,
        revealProof: proof,
        revealedCount: Math.min(election.totalParticipants, election.revealedCount + 1),
        lastTransactionLabel: 'Hasil akhir dapat dilihat dan diverifikasi di Basescan.',
      })))
      return proof
    },
    updateProfile(payload: Partial<VoterProfile>) {
      applyStore((current) => ({ ...current, profile: { ...current.profile, ...payload } }))
    },
    selectProofElection(electionId: string) {
      applyStore((current) => ({ ...current, selectedProofElectionId: electionId }))
    },
  }), [applyStore])

  return { store, actions, loading: store === null, refresh: actions.refresh }
}

export function findElection(store: VoterStore | null, electionId: string) {
  return store?.elections.find((election) => election.id === electionId) ?? null
}
