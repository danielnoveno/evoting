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

  const response = NextResponse.next({ request })
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

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  if (isProtectedRoute) {
    const { data } = await client.auth.getSession()

    if (!data.session) {
      const redirectUrl = new URL('/hubungkan-dompet', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    const requiredRole = getRequiredRole(request.nextUrl.pathname)

    if (requiredRole) {
      const { data: profile } = await client
        .schema('app')
        .from('app_profiles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .maybeSingle()

      const role = profile?.role

      if (requiredRole === 'super_admin' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/hubungkan-dompet', request.url))
      }

      if (requiredRole === 'admin' && role !== 'admin' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/hubungkan-dompet', request.url))
      }

      if (requiredRole === 'voter' && !role) {
        return NextResponse.redirect(new URL('/hubungkan-dompet', request.url))
      }
    }
  }

  return response
}
