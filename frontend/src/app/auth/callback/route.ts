import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'
import { getSupabaseBrowserConfig, isSupabaseConfigured } from '@/lib/supabase/config'

function safeInternalPath(value: string | null, fallback = '/pemilih') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const parsed = new URL(value, 'https://votechain.local')
    if (parsed.origin !== 'https://votechain.local') return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const nextPath = safeInternalPath(next)

  const isAuthAdmin = nextPath.startsWith('/portal-admin') || nextPath.startsWith('/superadmin') || nextPath.startsWith('/admin')
  const errorRedirectUrl = new URL(isAuthAdmin ? '/portal-admin' : '/hubungkan-dompet', request.url)
  errorRedirectUrl.searchParams.set('redirect', nextPath)

  if (!isSupabaseConfigured()) {
    errorRedirectUrl.searchParams.set('authError', 'backend_not_configured')
    return NextResponse.redirect(errorRedirectUrl)
  }

  if (code) {
    const cookieStore = cookies()
    const { url, anonKey } = getSupabaseBrowserConfig()
    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    })

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Auth callback exchange error:', error)
        errorRedirectUrl.searchParams.set('authError', 'oauth_exchange_failed')
        return NextResponse.redirect(errorRedirectUrl)
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      let resolvedPath = nextPath

      if (user) {
        const { data: profile } = await supabase
          .schema('app')
          .from('app_profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profile?.role === 'super_admin') {
          if (!nextPath.startsWith('/superadmin') && !nextPath.startsWith('/portal-admin')) {
            resolvedPath = '/portal-admin'
          }
        } else if (profile?.role === 'admin') {
          if (!nextPath.startsWith('/admin') && !nextPath.startsWith('/portal-admin')) {
            resolvedPath = '/portal-admin'
          }
        }
      }

      return NextResponse.redirect(new URL(resolvedPath, request.url))
    } catch (err) {
      console.error('Unexpected error in auth callback:', err)
      errorRedirectUrl.searchParams.set('authError', 'internal_callback_error')
      return NextResponse.redirect(errorRedirectUrl)
    }
  }

  errorRedirectUrl.searchParams.set('authError', 'missing_code')
  return NextResponse.redirect(errorRedirectUrl)
}
