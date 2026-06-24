import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

/** Coerce JSON value to string array */
export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

/** Check if value is a plain object (not array, not null) */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Case-insensitive wallet address comparison */
export function sameWalletAddress(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false
  return left.toLowerCase() === right.toLowerCase()
}

/** Extract initials from a name or wallet address (max 2 chars, uppercase) */
export function getInitials(name: string | null, wallet?: string): string {
  const source = name?.trim() || wallet || ''
  if (!source) return 'VT'
  if (source.startsWith('0x')) return source.slice(2, 4).toUpperCase()

  return source
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'VT'
}

/** Relative time label (e.g., "5 menit yang lalu") */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'Baru saja'

  const now = Date.now()
  const diffMs = now - date.getTime()
  if (diffMs < 0) return 'Baru saja'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'Baru saja'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit yang lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam yang lalu`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari yang lalu`

  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

type AuthErrorLike = {
  code?: string
  status?: number
  message?: string
  details?: string
}

function getAuthErrorLike(error: unknown): AuthErrorLike {
  if (typeof error !== 'object' || error === null) return {}
  const record = error as Record<string, unknown>
  return {
    code: typeof record.code === 'string' ? record.code : undefined,
    status: typeof record.status === 'number' ? record.status : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
    details: typeof record.details === 'string' ? record.details : undefined,
  }
}

/** Check if error indicates an invalid/expired session (401, 403, JWT errors) */
export function isInvalidStoredSession(error: unknown): boolean {
  const { status, message } = getAuthErrorLike(error)
  const normalizedMessage = message?.toLowerCase() ?? ''

  return status === 401
    || status === 403
    || normalizedMessage.includes('jwt')
    || normalizedMessage.includes('session')
    || normalizedMessage.includes('expired')
    || normalizedMessage.includes('invalid')
    || normalizedMessage.includes('not found')
}

/** Clear local Supabase auth session */
export async function clearLocalAuthSession(): Promise<void> {
  const client = getSupabaseBrowserClient()
  if (!client) return
  await client.auth.signOut({ scope: 'local' }).catch(() => undefined)
}
