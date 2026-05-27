'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { clearAllVoteCommitments } from '@/lib/vote-commitment-storage'
import { getPublicElectionResults, listPublicElections, listVoterOnchainProofs } from '@/lib/repositories/electionRepository'
import { getCurrentProfile } from '@/lib/repositories/profileRepository'
import type { PublicElectionRecord, PublicElectionResultRecord, VoterOnchainProofRecord } from '@/lib/repositories/types'

export type VoterElectionPhase = 'registration' | 'commit' | 'reveal' | 'ended'

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
  phase: VoterElectionPhase
  deadlineIso: string
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
const BASESCAN_ROOT = 'https://sepolia.basescan.org'

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
    phase: election.phase,
    deadlineIso: deadlineFor(election) ?? new Date().toISOString(),
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
  const [profile, elections] = await Promise.all([
    getCurrentProfile().catch(() => null),
    listPublicElections().catch(() => []),
  ])

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

export function basescanTxUrl(hash: string) {
  return `${BASESCAN_ROOT}/tx/${hash}`
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatDateShort(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

export function formatWallet(address: string) {
  if (!address) return 'Belum terhubung'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getPhaseLabel(phase: VoterElectionPhase) {
  if (phase === 'registration') return 'Persiapan'
  if (phase === 'commit') return 'Tahap Memilih'
  if (phase === 'reveal') return 'Tahap Konfirmasi'
  return 'Selesai'
}

export function getPhaseTone(phase: VoterElectionPhase) {
  if (phase === 'registration') return 'warning'
  if (phase === 'commit') return 'success'
  if (phase === 'reveal') return 'info'
  return 'success'
}

export function getElectionProgress(election: VoterElection) {
  if (!election.totalParticipants) return 0
  if (election.phase === 'ended') return 100
  const counted = election.phase === 'reveal' ? election.revealedCount : election.committedCount
  return Math.min(100, Math.round((counted / election.totalParticipants) * 100))
}

export function getElectionViewState(election: VoterElection): VoterElectionViewState {
  const hasCommitted = Boolean(election.commitProof && election.committedCandidateId)
  const hasRevealed = Boolean(election.revealProof)
  const canCommit = election.phase === 'commit' && !hasCommitted
  const canReveal = election.phase === 'reveal' && hasCommitted && !hasRevealed
  const canViewResults = election.phase === 'ended' || hasRevealed

  if (canCommit) return { hasCommitted, hasRevealed, canCommit, canReveal, canViewResults, nextAction: 'commit' }
  if (canReveal) return { hasCommitted, hasRevealed, canCommit, canReveal, canViewResults, nextAction: 'reveal' }
  if (canViewResults) return { hasCommitted, hasRevealed, canCommit, canReveal, canViewResults, nextAction: 'results' }
  return { hasCommitted, hasRevealed, canCommit, canReveal, canViewResults, nextAction: 'wait' }
}

export function sortDashboardElections(elections: VoterElection[]) {
  const getPriority = (election: VoterElection) => {
    const viewState = getElectionViewState(election)
    if (viewState.nextAction === 'commit') return 0
    if (viewState.nextAction === 'reveal') return 1
    if (election.phase === 'registration') return 2
    if (election.phase === 'commit') return 3
    if (election.phase === 'reveal') return 4
    return 5
  }

  return [...elections].sort((left, right) => {
    const priorityDiff = getPriority(left) - getPriority(right)
    if (priorityDiff !== 0) return priorityDiff
    return new Date(left.deadlineIso).getTime() - new Date(right.deadlineIso).getTime()
  })
}

export function resolveElectionAction(election: VoterElection) {
  const viewState = getElectionViewState(election)
  if (viewState.nextAction === 'commit') return { label: 'Berikan Suara', href: `/pemilih/pemilihan/${election.id}/pilih-kandidat` }
  if (viewState.nextAction === 'reveal') return { label: 'Konfirmasi Suara', href: `/pemilih/pemilihan/${election.id}/reveal` }
  if (viewState.nextAction === 'results') return { label: 'Lihat Hasil', href: `/pemilih/pemilihan/${election.id}/hasil` }
  return { label: 'Pantau Jadwal', href: '/pemilih/bukti-saya' }
}

export function getElectionResultRows(election: VoterElection) {
  const totalVotes = election.candidates.reduce((sum, candidate) => sum + candidate.votes, 0)
  return [...election.candidates]
    .sort((left, right) => right.votes - left.votes)
    .map((candidate) => ({ ...candidate, percentage: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0, totalVotes }))
}

export function getRecentLogs(store: VoterStore): VoterLogItem[] {
  return store.elections
    .flatMap((election) => {
      const items: VoterLogItem[] = []
      if (election.commitProof) {
        items.push({ id: `${election.id}-commit`, title: `${election.title} · Pilihan tersimpan`, detail: `Kode bukti: ${formatWallet(election.commitProof.txHash)} · Blok #${formatNumber(election.commitProof.blockNumber)}`, timeLabel: formatDateTime(election.commitProof.createdAt), tone: 'success' })
      }
      if (election.phase === 'reveal' && !election.revealProof) {
        items.push({ id: `${election.id}-phase`, title: `${election.title} · Konfirmasi dibuka`, detail: 'Admin telah membuka tahap konfirmasi. Silakan sahkan suara Anda.', timeLabel: election.lastTransactionLabel, tone: 'info' })
      }
      if (election.revealProof) {
        items.push({ id: `${election.id}-reveal`, title: `${election.title} · Suara disahkan`, detail: `Kode bukti: ${formatWallet(election.revealProof.txHash)} · Blok #${formatNumber(election.revealProof.blockNumber)}`, timeLabel: formatDateTime(election.revealProof.createdAt), tone: 'success' })
      }
      return items
    })
    .slice(0, 6)
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
        lastTransactionLabel: 'Konfirmasi siap dilakukan dari browser yang sama.',
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

  return { store, actions, loading: store === null }
}

export function findElection(store: VoterStore | null, electionId: string) {
  return store?.elections.find((election) => election.id === electionId) ?? null
}
