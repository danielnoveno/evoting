'use client'

export interface VoteCommitmentRecord {
  candidateId: string
  salt: `0x${string}`
  commitment: `0x${string}`
  timestamp: string
}

export type DemoVoteCommitmentData = VoteCommitmentRecord

function toHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`
}

function storageKey(electionId: string) {
  return `votein-demo-commitment:${electionId}`
}

const STORAGE_PREFIX = 'votein-demo-commitment:'

export function generateDemoSalt(): `0x${string}` {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return toHex(randomBytes)
}

export const generateSalt = generateDemoSalt

export async function generateDemoCommitment(
  electionId: string,
  candidateId: string,
  salt: `0x${string}`,
): Promise<`0x${string}`> {
  const content = `${electionId}:${candidateId}:${salt}`
  const bytes = new TextEncoder().encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  return toHex(new Uint8Array(hashBuffer))
}

export const generateCommitment = generateDemoCommitment

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
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key))
}

export const saveDemoVoteCommitment = saveVoteCommitment
export const loadDemoVoteCommitment = loadVoteCommitment
export const clearDemoVoteCommitment = clearVoteCommitment
export const clearAllDemoVoteCommitments = clearAllVoteCommitments
