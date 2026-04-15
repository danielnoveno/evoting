import { encodePacked, keccak256, toHex } from 'viem'

export function generateSalt(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return toHex(bytes) as `0x${string}`
}

export function generateCommitment(candidateId: bigint, salt: `0x${string}`): `0x${string}` {
  return keccak256(encodePacked(['uint256', 'bytes32'], [candidateId, salt]))
}

export function saveVoteData(spaceId: string, candidateId: number, salt: `0x${string}`): void {
  const key = `votechain_vote_${spaceId}`
  localStorage.setItem(
    key,
    JSON.stringify({
      candidateId,
      salt,
      timestamp: Date.now(),
    })
  )
}

export function loadVoteData(
  spaceId: string
): { candidateId: number; salt: `0x${string}`; timestamp: number } | null {
  const key = `votechain_vote_${spaceId}`
  const raw = localStorage.getItem(key)
  if (!raw) return null
  return JSON.parse(raw) as { candidateId: number; salt: `0x${string}`; timestamp: number }
}

export function clearVoteData(spaceId: string): void {
  localStorage.removeItem(`votechain_vote_${spaceId}`)
}
