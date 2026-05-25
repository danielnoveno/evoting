'use client'

import { createBrowserClient } from '@supabase/ssr'
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
    browserClient = createBrowserClient<Database>(url, anonKey)
  }

  return browserClient
}
