'use client'

import { encodeAbiParameters, keccak256, parseAbiParameters, type Address } from 'viem'

export interface VoteCommitmentRecord {
  candidateId: string
  candidateNumber?: number
  salt: `0x${string}`
  commitment: `0x${string}`
  timestamp: string
  automaticReveal?: {
    status: 'prepared' | 'submitted' | 'failed'
    savedAt?: string
    errorMessage?: string
  }
}

function storageKey(electionId: string) {
  return `votein-commitment:${electionId}`
}

const STORAGE_PREFIX = 'votein-commitment:'

export function generateSalt(): `0x${string}` {
  if (typeof window === 'undefined') {
    throw new Error('Salt hanya boleh dibuat di browser pemilih.')
  }
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

export function saveVoteCommitment(electionId: string, data: VoteCommitmentRecord) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(electionId), JSON.stringify(data))
}

export function updateVoteCommitment(electionId: string, updater: (current: VoteCommitmentRecord) => VoteCommitmentRecord) {
  const current = loadVoteCommitment(electionId)
  if (!current) return null
  const next = updater(current)
  saveVoteCommitment(electionId, next)
  return next
}

export function loadVoteCommitment(electionId: string): VoteCommitmentRecord | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(storageKey(electionId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as VoteCommitmentRecord
  } catch {
    return null
  }
}

export function clearVoteCommitment(electionId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(storageKey(electionId))
}

export function clearAllVoteCommitments() {
  if (typeof window === 'undefined') return
  const keysToRemove: string[] = []
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (key?.startsWith(STORAGE_PREFIX)) keysToRemove.push(key)
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key))
}
