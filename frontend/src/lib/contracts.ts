export function getConfiguredRegistryAddress(): `0x${string}` | null {
  const raw = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS?.trim()
  if (!raw) return null
  if (!raw.startsWith('0x') || raw.length !== 42) return null
  return raw as `0x${string}`
}

export function getConfiguredElectionSpaceAddress(): `0x${string}` | null {
  const raw = process.env.NEXT_PUBLIC_ELECTION_SPACE_ADDRESS?.trim()
  if (!raw) return null
  if (!raw.startsWith('0x') || raw.length !== 42) return null
  return raw as `0x${string}`
}
