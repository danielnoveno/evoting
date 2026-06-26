import type { NextRequest } from 'next/server'

/**
 * Resolve the public-facing origin for building activation / invite links.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL (explicit production domain)
 * 2. NEXT_PUBLIC_APP_URL   (alias)
 * 3. Host header from the incoming request (works behind reverse proxies)
 * 4. request.nextUrl.origin (Next.js parsed origin)
 *
 * ponYtail: centralised so API routes don't silently diverge.
 */
export function getRequestOrigin(request: NextRequest): string {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL

  if (configuredOrigin?.trim()) {
    return configuredOrigin.trim().replace(/\/$/, '')
  }

  // Host header is the most reliable fallback behind Vercel / Cloudflare / nginx.
  const host = request.headers.get('host')
  if (host) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https'
    return `${proto}://${host}`.replace(/\/$/, '')
  }

  return request.nextUrl.origin.replace(/\/$/, '')
}
