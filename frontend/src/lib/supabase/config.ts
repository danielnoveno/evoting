import { BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_EXPLORER } from '../../../../shared/constants/network'

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && anonKey)
}

export function getSupabaseBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url === '') {
    throw new Error('Environment variable NEXT_PUBLIC_SUPABASE_URL belum diatur.')
  }
  if (!anonKey || anonKey === '') {
    throw new Error('Environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY belum diatur.')
  }

  return { url, anonKey }
}

export function getPublicAppOrigin(fallbackOrigin?: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL
  const origin = configuredOrigin?.trim().replace(/\/$/, '')

  if (origin) return origin
  return fallbackOrigin?.replace(/\/$/, '') ?? ''
}

export function getSupabaseServerConfig() {
  return {
    ...getSupabaseBrowserConfig(),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export const backendRuntimeConfig = {
  chainId: Number(process.env.NEXT_PUBLIC_BASE_SEPOLIA_CHAIN_ID ?? BASE_SEPOLIA_CHAIN_ID),
  basescanExplorerUrl: process.env.NEXT_PUBLIC_BASESCAN_EXPLORER_URL ?? BASE_SEPOLIA_EXPLORER,
}
