import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'
import { getSupabaseBrowserConfig, isSupabaseConfigured } from '@/lib/supabase/config'

export async function GET(request: NextRequest) {
  const fallbackUrl = new URL('/hubungkan-dompet', request.url)

  if (!isSupabaseConfigured()) {
    fallbackUrl.searchParams.set('authError', 'backend_not_configured')
    return NextResponse.redirect(fallbackUrl)
  }

  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next')
  const nextPath = next?.startsWith('/') ? next : '/pemilih'
  const errorRedirectUrl = new URL('/hubungkan-dompet', request.url)
  errorRedirectUrl.searchParams.set('redirect', nextPath)

  if (!code) {
    errorRedirectUrl.searchParams.set('authError', 'missing_code')
    return NextResponse.redirect(errorRedirectUrl)
  }

  const response = NextResponse.next()
  const { url, anonKey } = getSupabaseBrowserConfig()
  const client = createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options) {
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options) {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 })
      },
    },
  })

  const { error } = await client.auth.exchangeCodeForSession(code)
  if (error) {
    errorRedirectUrl.searchParams.set('authError', 'oauth_exchange_failed')
    return NextResponse.redirect(errorRedirectUrl)
  }

  const { data: sessionData } = await client.auth.getSession()
  const userId = sessionData.session?.user.id

  let resolvedPath = nextPath

  if (userId && nextPath === '/pemilih') {
    const { data: profile } = await client
      .schema('app')
      .from('app_profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (profile?.role === 'super_admin') {
      resolvedPath = '/superadmin'
    } else if (profile?.role === 'platform_admin') {
      resolvedPath = '/admin'
    }
  }

  const redirectUrl = new URL(resolvedPath, request.url)

  return NextResponse.redirect(redirectUrl, { headers: response.headers })
}
