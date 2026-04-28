export interface SavedVoterSetting {
  displayName: string
  photoUrl: string
  highContrast: boolean
  updatedAt: number
}

export const DEFAULT_VOTER_NAME = 'Pemilih Demo'
export const VOTER_PROFILE_UPDATED_EVENT = 'votechain:voter-profile-updated'

export function getVoterProfileStorageKey(walletId: string) {
  return `votechain_voter_setingg_${walletId}`
}

export function getProfileInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return 'VP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function getShortProfileName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return DEFAULT_VOTER_NAME
  if (parts.length === 1) return parts[0]

  return `${parts[0]} ${parts[1][0] ?? ''}.`
}

export function getShortAddress(address: string) {
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function parseSavedVoterSetting(raw: string | null): SavedVoterSetting | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<SavedVoterSetting>

    if (typeof parsed.displayName !== 'string') return null
    if (typeof parsed.photoUrl !== 'string') return null
    if (typeof parsed.highContrast !== 'boolean') return null
    if (typeof parsed.updatedAt !== 'number') return null

    return {
      displayName: parsed.displayName,
      photoUrl: parsed.photoUrl,
      highContrast: parsed.highContrast,
      updatedAt: parsed.updatedAt,
    }
  } catch {
    return null
  }
}
