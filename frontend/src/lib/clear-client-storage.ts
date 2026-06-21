'use client'

/**
 * Clears all VoteChain-related client storage (localStorage, sessionStorage, cookies).
 * Called on logout and when session is invalid after DB reset.
 */
export function clearAllClientStorage() {
  if (typeof window === 'undefined') return

  // ── localStorage: clear all VoteChain keys ──
  const voteinPrefixes = [
    'votein:',
    'votein-',
    'voter:',
    'admin-candidate:',
    'vote-commitment:',
    'form-draft:',
    'superadmin:',
  ]

  const keysToRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key) continue
    if (voteinPrefixes.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => window.localStorage.removeItem(key))

  // ── sessionStorage: clear all VoteChain keys ──
  const sessionKeysToRemove: string[] = []
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const key = window.sessionStorage.key(i)
    if (!key) continue
    if (voteinPrefixes.some((prefix) => key.startsWith(prefix))) {
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
