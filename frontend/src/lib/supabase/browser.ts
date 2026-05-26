'use client'

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { getSupabaseBrowserConfig, isSupabaseConfigured } from '@/lib/supabase/config'

let browserClient: SupabaseClient<Database> | null = null

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!browserClient) {
    const { url, anonKey } = getSupabaseBrowserConfig()
    browserClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return browserClient
}
