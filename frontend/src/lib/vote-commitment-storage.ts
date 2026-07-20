'use client'

import { encodeAbiParameters, keccak256, parseAbiParameters, type Address } from 'viem'

export interface VoteCommitmentRecord {
  candidateId: string
  salt: `0x${string}`
  commitment: `0x${string}`
  timestamp: string
}

export interface VoteCommitmentScope {
  chainId: number
  electionId: string
  contractAddress: string
  voterAddress: string
}

const STORAGE_PREFIX = 'votein-commitment:'
const STORAGE_VERSION = 'v2'
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/
const BYTES32_PATTERN = /^0x[a-fA-F0-9]{64}$/

function assertScope(scope: VoteCommitmentScope) {
  if (!Number.isSafeInteger(scope.chainId) || scope.chainId <= 0) throw new Error('Jaringan penyimpanan komitmen tidak valid.')
  if (!scope.electionId.trim()) throw new Error('ID pemilihan untuk penyimpanan komitmen belum tersedia.')
  if (!ADDRESS_PATTERN.test(scope.contractAddress)) throw new Error('Alamat kontrak untuk penyimpanan komitmen tidak valid.')
  if (!ADDRESS_PATTERN.test(scope.voterAddress)) throw new Error('Alamat dompet pemilih untuk penyimpanan komitmen tidak valid.')
}

function legacyStorageKey(electionId: string) {
  return `${STORAGE_PREFIX}${electionId}`
}

export function createVoteCommitmentScope(scope: VoteCommitmentScope): VoteCommitmentScope | null {
  try {
    assertScope(scope)
    return {
      chainId: scope.chainId,
      electionId: scope.electionId.trim(),
      contractAddress: scope.contractAddress.toLowerCase(),
      voterAddress: scope.voterAddress.toLowerCase(),
    }
  } catch {
    return null
  }
}

export function getVoteCommitmentStorageKey(scope: VoteCommitmentScope) {
  assertScope(scope)
  return [
    STORAGE_PREFIX + STORAGE_VERSION,
    scope.chainId,
    encodeURIComponent(scope.electionId.trim()),
    scope.contractAddress.toLowerCase(),
    scope.voterAddress.toLowerCase(),
  ].join(':')
}

function parseRecord(raw: string | null): VoteCommitmentRecord | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const record = value as Partial<VoteCommitmentRecord>
    if (typeof record.candidateId !== 'string' || !record.candidateId) return null
    if (typeof record.salt !== 'string' || !BYTES32_PATTERN.test(record.salt)) return null
    if (typeof record.commitment !== 'string' || !BYTES32_PATTERN.test(record.commitment)) return null
    if (typeof record.timestamp !== 'string' || Number.isNaN(Date.parse(record.timestamp))) return null
    return record as VoteCommitmentRecord
  } catch {
    return null
  }
}

function isSameRecord(left: VoteCommitmentRecord, right: VoteCommitmentRecord) {
  return left.candidateId === right.candidateId
    && left.salt.toLowerCase() === right.salt.toLowerCase()
    && left.commitment.toLowerCase() === right.commitment.toLowerCase()
}

export function generateSalt(): `0x${string}` {
  if (typeof window === 'undefined') throw new Error('Salt hanya boleh dibuat di browser pemilih.')
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`
}

export function generateCommitment(
  candidateId: number,
  salt: `0x${string}`,
  voterAddress: Address,
  electionSpaceAddress: Address,
  chainId: number,
): `0x${string}` {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters('uint256, bytes32, address, address, uint256'),
      [BigInt(candidateId), salt, voterAddress, electionSpaceAddress, BigInt(chainId)],
    ),
  )
}

export function resolveLegacyVoteCommitment(
  scope: VoteCommitmentScope,
  record: VoteCommitmentRecord,
  candidateIds: readonly string[],
): VoteCommitmentRecord | null {
  assertScope(scope)
  const candidateNumber = candidateIds.indexOf(record.candidateId) + 1
  if (candidateNumber <= 0) return null
  const expected = generateCommitment(
    candidateNumber,
    record.salt,
    scope.voterAddress as Address,
    scope.contractAddress as Address,
    scope.chainId,
  )
  return expected.toLowerCase() === record.commitment.toLowerCase() ? record : null
}

export function saveVoteCommitment(scope: VoteCommitmentScope, data: VoteCommitmentRecord) {
  if (typeof window === 'undefined') return data
  const key = getVoteCommitmentStorageKey(scope)
  const rawExisting = window.localStorage.getItem(key)
  if (rawExisting) {
    const existing = parseRecord(rawExisting)
    if (existing && isSameRecord(existing, data)) return existing
    throw new Error('Komitmen yang belum selesai sudah tersimpan untuk dompet dan pemilihan ini. Jangan membuat pilihan baru. Periksa status transaksi atau hubungi admin.')
  }
  window.localStorage.setItem(key, JSON.stringify(data))
  return data
}

export function loadVoteCommitment(
  scope: VoteCommitmentScope | null,
  candidateIds: readonly string[] = [],
): VoteCommitmentRecord | null {
  if (typeof window === 'undefined' || !scope) return null
  const scopedRecord = parseRecord(window.localStorage.getItem(getVoteCommitmentStorageKey(scope)))
  if (scopedRecord) return scopedRecord

  // Bounded migration: the legacy record is moved only when its commitment can
  // be recomputed for this exact chain, contract, voter, and candidate order.
  const legacyKey = legacyStorageKey(scope.electionId)
  const legacyRecord = parseRecord(window.localStorage.getItem(legacyKey))
  if (!legacyRecord || candidateIds.length === 0) return null
  const verifiedLegacyRecord = resolveLegacyVoteCommitment(scope, legacyRecord, candidateIds)
  if (!verifiedLegacyRecord) return null
  saveVoteCommitment(scope, verifiedLegacyRecord)
  window.localStorage.removeItem(legacyKey)
  return verifiedLegacyRecord
}

export function clearVoteCommitment(scope: VoteCommitmentScope | null) {
  if (typeof window === 'undefined' || !scope) return
  window.localStorage.removeItem(getVoteCommitmentStorageKey(scope))
}
