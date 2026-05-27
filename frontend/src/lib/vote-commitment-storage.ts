'use client'

import { encodePacked, keccak256 } from 'viem'

export interface VoteCommitmentRecord {
  candidateId: string
  salt: `0x${string}`
  commitment: `0x${string}`
  timestamp: string
}

function storageKey(electionId: string) {
  return `votein-commitment:${electionId}`
}

const STORAGE_PREFIX = 'votein-commitment:'

export function generateSalt(): `0x${string}` {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`
}

export function generateCommitment(candidateId: number, salt: `0x${string}`): `0x${string}` {
  return keccak256(encodePacked(['uint256', 'bytes32'], [BigInt(candidateId), salt]))
}

export function saveVoteCommitment(electionId: string, data: VoteCommitmentRecord) {
  window.localStorage.setItem(storageKey(electionId), JSON.stringify(data))
}

export function loadVoteCommitment(electionId: string): VoteCommitmentRecord | null {
  const raw = window.localStorage.getItem(storageKey(electionId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as VoteCommitmentRecord
  } catch {
    return null
  }
}

export function clearVoteCommitment(electionId: string) {
  window.localStorage.removeItem(storageKey(electionId))
}

export function clearAllVoteCommitments() {
  const keysToRemove: string[] = []
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (key?.startsWith(STORAGE_PREFIX)) keysToRemove.push(key)
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key))
}
