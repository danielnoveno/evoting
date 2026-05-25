'use client'

import { isSupabaseConfigured } from '@/lib/supabase/config'

export function BackendStatusBanner() {
  if (isSupabaseConfigured()) {
    return null
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 md:px-6">
      Backend Supabase belum dikonfigurasi. Aplikasi masih berjalan dalam mode transisi pengembangan.
    </div>
  )
}
