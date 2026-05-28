import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { getSupabaseServerConfig } from '@/lib/supabase/config'

export function getSupabaseServiceRoleClient(): SupabaseClient<Database, any> | null {
  const { url, serviceRoleKey } = getSupabaseServerConfig()

  if (!serviceRoleKey) return null

  return createClient<Database, 'app'>(url, serviceRoleKey, {
    db: {
      schema: 'app',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
