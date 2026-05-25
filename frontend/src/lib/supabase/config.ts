import { BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_EXPLORER } from '../../../../shared/constants/network'

function getRequiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Environment variable ${name} belum diatur.`)
  }

  return value
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function getSupabaseBrowserConfig() {
  return {
    url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
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
