import { encodePacked, keccak256, toHex } from 'viem'

export function generateSalt(): `0x${string}` {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  return toHex(randomBytes) as `0x${string}`
}

export function generateCommitment(candidateId: bigint, salt: `0x${string}`): `0x${string}` {
  return keccak256(encodePacked(['uint256', 'bytes32'], [candidateId, salt]))
}

export interface LocalVoteData {
  candidateId: number
  salt: `0x${string}`
  timestamp: number
}

export function saveVoteData(spaceId: string, candidateId: number, salt: `0x${string}`) {
  const key = `votechain_vote_${spaceId}`
  const payload: LocalVoteData = {
    candidateId,
    salt,
    timestamp: Date.now(),
  }

  localStorage.setItem(key, JSON.stringify(payload))
}

export function loadVoteData(spaceId: string): LocalVoteData | null {
  const key = `votechain_vote_${spaceId}`
  const raw = localStorage.getItem(key)
  if (!raw) return null

  return JSON.parse(raw) as LocalVoteData
}

export function clearVoteData(spaceId: string) {
  localStorage.removeItem(`votechain_vote_${spaceId}`)
}
