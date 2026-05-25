import type { AppProfileRecord } from '@/lib/repositories/types'

export interface ProfileViewModel {
  displayName: string
  email: string
  walletAddress: string
  bio: string
  avatarUrl: string | null
  roleLabel: string
}

export function mapProfileToViewModel(
  profile: AppProfileRecord | null,
  fallback: Pick<ProfileViewModel, 'displayName' | 'email' | 'walletAddress' | 'bio' | 'avatarUrl'>,
): ProfileViewModel {
  return {
    displayName: profile?.displayName ?? fallback.displayName,
    email: profile?.email ?? fallback.email,
    walletAddress: profile?.walletAddress ?? fallback.walletAddress,
    bio: fallback.bio,
    avatarUrl: profile?.avatarUrl ?? fallback.avatarUrl,
    roleLabel:
      profile?.role === 'super_admin'
        ? 'Super Admin'
        : profile?.role === 'platform_admin'
          ? 'Admin Platform'
          : 'Pemilih',
  }
}
