import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { getSupabaseBrowserConfig, isSupabaseConfigured } from '@/lib/supabase/config'

export function getSupabaseServerClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  const cookieStore = cookies()
  const { url, anonKey } = getSupabaseBrowserConfig()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set() {
        // Server Component tidak melakukan mutasi cookie pada phase ini.
      },
      remove() {
        // Server Component tidak melakukan mutasi cookie pada phase ini.
      },
    },
  })
}
