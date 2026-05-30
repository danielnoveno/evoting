import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseBrowserConfig, isSupabaseConfigured } from '@/lib/supabase/config'
import type { Database } from '@/lib/supabase/database.types'

const PROTECTED_PREFIXES = ['/admin', '/superadmin', '/pemilih']

function getRequiredRole(pathname: string) {
  if (pathname.startsWith('/superadmin')) return 'super_admin'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/pemilih')) return 'voter'
  return null
}

export async function updateSupabaseSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request })
  }

  // Create an initial response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const { url, anonKey } = getSupabaseBrowserConfig()

  const client = createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options) {
        // Update request cookies so subsequent client calls see them
        request.cookies.set({ name, value, ...options })
        // Create a new response to ensure cookies are included
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options) {
        request.cookies.set({ name, value: '', ...options, maxAge: 0 })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({ name, value: '', ...options, maxAge: 0 })
      },
    },
  })

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  if (isProtectedRoute) {
    // getSession might refresh the token, which triggers set() above
    const { data: { session } } = await client.auth.getSession()

    if (!session) {
      const redirectUrl = new URL('/hubungkan-dompet', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      // When redirecting, we MUST include the headers from our 'response' object 
      // which contains any newly set session cookies from a refresh.
      return NextResponse.redirect(redirectUrl, {
        headers: response.headers
      })
    }

    const requiredRole = getRequiredRole(request.nextUrl.pathname)

    if (requiredRole) {
      const { data: profile } = await client
        .schema('app')
        .from('app_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const role = profile?.role

      if (requiredRole === 'super_admin' && role !== 'super_admin') {
        const portalUrl = new URL('/portal-admin', request.url)
        return NextResponse.redirect(portalUrl, { headers: response.headers })
      }

      if (requiredRole === 'admin' && role !== 'admin' && role !== 'super_admin') {
        const portalUrl = new URL('/portal-admin', request.url)
        return NextResponse.redirect(portalUrl, { headers: response.headers })
      }

      if (requiredRole === 'voter' && !role) {
        // Voters with no role yet are redirected to wallet binding
        const bindUrl = new URL('/hubungkan-dompet', request.url)
        return NextResponse.redirect(bindUrl, { headers: response.headers })
      }
    }
  }

  return response
}
