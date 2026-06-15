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

function getPathWithSearch(request: NextRequest) {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`
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
        request.cookies.set(name, value)
        // Create a new response to ensure cookies are included
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options) {
        request.cookies.set(name, '')
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  if (isProtectedRoute) {
    // getSession might refresh the token, which triggers set() above
    const { data: { session } } = await client.auth.getSession()

    if (!session) {
      const requiredRole = getRequiredRole(request.nextUrl.pathname)
      const redirectUrl = requiredRole === 'super_admin'
        ? new URL('/portal-admin', request.url)
        : new URL('/hubungkan-dompet', request.url)
      if (requiredRole) {
        redirectUrl.searchParams.set('redirect', getPathWithSearch(request))
      }
      if (requiredRole === 'admin') {
        redirectUrl.searchParams.set('activate', 'admin')
      }
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
        .select('role,email')
        .eq('user_id', session.user.id)
        .maybeSingle()

      const role = profile?.role

      if (profile?.email) {
        const { data: adminRegistry } = await client
          .schema('app')
          .from('admin_registry')
          .select('assigned_role,status')
          .eq('email', profile.email.toLowerCase())
          .maybeSingle()

        const hasPendingAdminInvite = adminRegistry
          && (adminRegistry.assigned_role === 'admin' || adminRegistry.assigned_role === 'super_admin')
          && adminRegistry.status !== 'active'

        if (hasPendingAdminInvite) {
          const activationUrl = new URL('/hubungkan-dompet', request.url)
          activationUrl.searchParams.set('activate', 'admin')
          activationUrl.searchParams.set('redirect', adminRegistry.assigned_role === 'super_admin' ? '/portal-admin' : '/admin')
          return NextResponse.redirect(activationUrl, { headers: response.headers })
        }
      }

      if (requiredRole === 'super_admin' && role !== 'super_admin') {
        const fallbackUrl = new URL(role === 'admin' ? '/admin' : '/hubungkan-dompet', request.url)
        if (role !== 'admin') fallbackUrl.searchParams.set('redirect', '/pemilih')
        return NextResponse.redirect(fallbackUrl, { headers: response.headers })
      }

      if (requiredRole === 'admin' && role !== 'admin' && role !== 'super_admin') {
        const fallbackUrl = new URL('/hubungkan-dompet', request.url)
        fallbackUrl.searchParams.set('redirect', '/pemilih')
        return NextResponse.redirect(fallbackUrl, { headers: response.headers })
      }

      if (requiredRole === 'voter' && !role) {
        // Voters with no role yet are redirected to wallet binding
        const bindUrl = new URL('/hubungkan-dompet', request.url)
        bindUrl.searchParams.set('redirect', getPathWithSearch(request))
        return NextResponse.redirect(bindUrl, { headers: response.headers })
      }
    }
  }

  return response
}
