'use client'

/**
 * Clears Votein + Supabase auth client storage (localStorage, sessionStorage, cookies).
 * Called on logout and when session is invalid after DB reset.
 */
export function clearAllClientStorage() {
  if (typeof window === 'undefined') return

  // Supabase browser auth stores the access token in localStorage with `sb-...`.
  // If this key survives after a Supabase DB reset, the app can keep reading an old session.
  const storagePrefixes = [
    'sb-',
    'supabase-',
    'supabase.',
    'votein:',
    'votein-',
    'voter:',
    'admin-candidate:',
    'vote-commitment:',
    'form-draft:',
    'superadmin:',
  ]

  // ── localStorage ──
  const keysToRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key) continue
    if (storagePrefixes.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key))

  // ── sessionStorage ──
  const sessionKeysToRemove: string[] = []
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const key = window.sessionStorage.key(i)
    if (!key) continue
    if (storagePrefixes.some((prefix) => key.startsWith(prefix))) {
      sessionKeysToRemove.push(key)
    }
  }
  sessionKeysToRemove.forEach((key) => window.sessionStorage.removeItem(key))

  // ── Cookies: clear Supabase auth cookies ──
  const supabaseCookiePrefixes = ['sb-', 'supabase-']
  const allCookies = document.cookie.split(';')
  allCookies.forEach((cookie) => {
    const name = cookie.split('=')[0].trim()
    if (supabaseCookiePrefixes.some((prefix) => name.startsWith(prefix))) {
      // Clear for current domain and common parent domains
      const domains = [window.location.hostname, `.${window.location.hostname}`, window.location.hostname.replace(/^[^.]+\./, '.')]
      const paths = ['/', '/auth', '/api']
      domains.forEach((domain) => {
        paths.forEach((path) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${domain}`
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
        })
      })
    }
  })
}
