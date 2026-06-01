import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'

export type PlatformSettings = {
  id: string
  platform_name: string
  default_language: string
  network_name: string
  rpc_url: string | null
  registry_address: string | null
  gas_limit: number
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: 'default',
  platform_name: 'VoteIn e-Voting',
  default_language: 'Bahasa Indonesia',
  network_name: 'Base Sepolia',
  rpc_url: null,
  registry_address: null,
  gas_limit: 50
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const client = getSupabaseBrowserClient()
  if (!client) return DEFAULT_PLATFORM_SETTINGS

  try {
    const { data, error } = await client
      .schema('app')
      .from('platform_settings')
      .select('*')
      .maybeSingle()

    if (error || !data) {
      if (error) console.warn('Platform settings fetch error:', error.message)
      return DEFAULT_PLATFORM_SETTINGS
    }
    
    return data
  } catch (err) {
    console.warn('Unexpected error fetching platform settings:', err)
    return DEFAULT_PLATFORM_SETTINGS
  }
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client
    .schema('app')
    .from('platform_settings')
    .update(settings)
    .eq('id', settings.id!)
    .select()
    .single()

  if (error) throw new RepositoryError(error.message)
  return data
}
