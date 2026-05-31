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

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client
    .schema('app')
    .from('platform_settings')
    .select('*')
    .single()

  if (error) throw new RepositoryError(error.message)
  return data
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
