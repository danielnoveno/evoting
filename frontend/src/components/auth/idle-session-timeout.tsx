'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { authSessionQueryKey, useAuthSession } from '@/hooks/use-auth-session'
import { useCurrentProfile } from '@/hooks/use-profile'
import { signOutCurrentSession } from '@/lib/repositories/authRepository'
import { MANUAL_LOGOUT_EVENT, isManualLogoutInProgress } from '@/lib/auth-session-events'
import { LogOut, Clock } from 'lucide-react'

const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000 // 15 menit untuk admin/superadmin
const VOTER_IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 menit untuk pemilih
const WARNING_BEFORE_MS = 60 * 1000 // peringatan 1 menit sebelum timeout
const LAST_ACTIVITY_STORAGE_KEY = 'votechain:last-activity-at'
const SESSION_DEBUG_STORAGE_KEY = 'votechain:session-debug'
// Hindari `mousemove` dan `visibilitychange` supaya testing idle timeout tidak
// terus-terusan reset hanya karena cursor bergerak kecil atau tab berubah fokus.
// Timer hanya diperpanjang lewat aktivitas yang lebih disengaja.
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'] as const
const CLOCK_CHECK_EVENTS = ['focus', 'pageshow'] as const

function getRoleAwareLoginPath(pathname: string, role: string | null | undefined) {
  if (role === 'super_admin') {
    const redirectTarget = pathname.startsWith('/superadmin') ? pathname : '/superadmin'
    return `/portal-admin?redirect=${encodeURIComponent(redirectTarget)}&reason=session-timeout`
  }

  if (role === 'admin') {
    const redirectTarget = pathname.startsWith('/admin') ? pathname : '/admin'
    return `/hubungkan-dompet?activate=admin&redirect=${encodeURIComponent(redirectTarget)}&reason=session-timeout`
  }

  if (pathname.startsWith('/superadmin')) return `/portal-admin?redirect=${encodeURIComponent(pathname)}&reason=session-timeout`
  if (pathname.startsWith('/admin')) return `/hubungkan-dompet?activate=admin&redirect=${encodeURIComponent(pathname)}&reason=session-timeout`
  if (pathname.startsWith('/portal-admin')) return '/portal-admin?redirect=%2Fsuperadmin&reason=session-timeout'

  const redirectTarget = pathname.startsWith('/pemilih') ? pathname : '/pemilih'
  return `/hubungkan-dompet?redirect=${encodeURIComponent(redirectTarget)}&reason=session-timeout`
}

export function IdleSessionTimeout() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: authSession } = useAuthSession()
  const { data: currentProfile } = useCurrentProfile()
  const timeoutRef = useRef<number | null>(null)
  const warningRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const hasTimedOutRef = useRef(false)

  const [showWarning, setShowWarning] = useState(false)
  const [showExpired, setShowExpired] = useState(false)
  const [expiredTargetPath, setExpiredTargetPath] = useState<string | null>(null)
  const [isDebugEnabled, setIsDebugEnabled] = useState(false)
  const [debugTick, setDebugTick] = useState(0)

  const isAppProtectedRoute = useMemo(() => (
    pathname.startsWith('/pemilih')
    || pathname.startsWith('/admin')
    || pathname.startsWith('/superadmin')
  ), [pathname])

  const isProtectedContext = useMemo(() => (
    isAppProtectedRoute || pathname.startsWith('/portal-admin')
  ), [isAppProtectedRoute, pathname])

  const shouldTrackSession = useMemo(() => (
    Boolean(authSession) && (isAppProtectedRoute || pathname.startsWith('/portal-admin'))
  ), [authSession, isAppProtectedRoute, pathname])

  const clearAuthQueryCache = useCallback(() => {
    queryClient.setQueryData(authSessionQueryKey, null)
    queryClient.removeQueries({ queryKey: ['profile'] })
  }, [queryClient])

  const idleTimeoutMs = useMemo(() => {
    if (currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin') return ADMIN_IDLE_TIMEOUT_MS
    if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin') || pathname.startsWith('/portal-admin')) return ADMIN_IDLE_TIMEOUT_MS
    return VOTER_IDLE_TIMEOUT_MS
  }, [currentProfile?.role, pathname])

  const clearDelayTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningRef.current !== null) {
      window.clearTimeout(warningRef.current)
      warningRef.current = null
    }
  }, [])

  const clearTimers = useCallback(() => {
    clearDelayTimers()
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [clearDelayTimers])

  const readLastActivityAt = useCallback(() => {
    const storedValue = window.localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY)
    const parsedValue = storedValue ? Number.parseInt(storedValue, 10) : Number.NaN
    if (Number.isFinite(parsedValue) && parsedValue > 0) return parsedValue
    const now = Date.now()
    window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(now))
    return now
  }, [])

  const writeLastActivityAt = useCallback((timestamp: number) => {
    window.localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(timestamp))
  }, [])

  const handleForceLogout = useCallback(async (targetPath: string) => {
    hasTimedOutRef.current = true
    clearTimers()
    setShowWarning(false)
    setShowExpired(false)

    // Sign out in background, then redirect
    void signOutCurrentSession().catch(() => undefined)
    clearAuthQueryCache()

    // Gunakan window.location.href untuk memastikan seluruh state terhapus total
    window.location.href = targetPath
  }, [clearAuthQueryCache, clearTimers])

  const handleTimeout = useCallback(async () => {
    if (isManualLogoutInProgress()) {
      hasTimedOutRef.current = true
      clearTimers()
      setShowWarning(false)
      setShowExpired(false)
      setExpiredTargetPath(null)
      return
    }

    if (hasTimedOutRef.current) return
    hasTimedOutRef.current = true
    clearTimers()

    const targetPath = getRoleAwareLoginPath(pathname, currentProfile?.role)

    // Langsung tampilkan modal expired, jangan tunggu signout selesai
    setExpiredTargetPath(targetPath)
    setShowExpired(true)
    
    // Lakukan signout di background
    void signOutCurrentSession()
      .then(() => clearAuthQueryCache())
      .catch(() => undefined)
  }, [clearAuthQueryCache, clearTimers, currentProfile?.role, pathname])

  const scheduleFromLastActivity = useCallback((lastActivityAt: number) => {
    if (!shouldTrackSession) return
    if (isManualLogoutInProgress()) return
    clearDelayTimers()

    const elapsedMs = Date.now() - lastActivityAt
    const remainingMs = idleTimeoutMs - elapsedMs

    if (remainingMs <= 0) {
      void handleTimeout()
      return
    }

    const warningMs = remainingMs - WARNING_BEFORE_MS
    if (warningMs <= 0) {
      setShowWarning(true)
    } else {
      warningRef.current = window.setTimeout(() => {
        if (!hasTimedOutRef.current && !isManualLogoutInProgress()) setShowWarning(true)
      }, warningMs)
    }

    timeoutRef.current = window.setTimeout(() => {
      if (!isManualLogoutInProgress()) void handleTimeout()
    }, remainingMs)
  }, [clearDelayTimers, handleTimeout, idleTimeoutMs, shouldTrackSession])

  const markActivity = useCallback(() => {
    if (!shouldTrackSession || hasTimedOutRef.current) return
    const now = Date.now()
    writeLastActivityAt(now)
    setShowWarning(false)
    scheduleFromLastActivity(now)
  }, [scheduleFromLastActivity, shouldTrackSession, writeLastActivityAt])

  const checkClock = useCallback(() => {
    if (!shouldTrackSession || hasTimedOutRef.current) return
    const lastActivityAt = readLastActivityAt()
    scheduleFromLastActivity(lastActivityAt)
  }, [readLastActivityAt, scheduleFromLastActivity, shouldTrackSession])

  const handleExtendSession = useCallback(() => {
    hasTimedOutRef.current = false
    markActivity()
  }, [markActivity])

  useEffect(() => {
    if (isManualLogoutInProgress()) {
      hasTimedOutRef.current = true
      clearTimers()
      setShowWarning(false)
      setShowExpired(false)
      setExpiredTargetPath(null)
      return
    }

    if (!shouldTrackSession) {
      clearTimers()
      hasTimedOutRef.current = false
      setShowWarning(false)
      if (!showExpired) setExpiredTargetPath(null)
      return
    }

    hasTimedOutRef.current = false
    setShowWarning(false)
    setShowExpired(false)
    setExpiredTargetPath(null)
    const now = Date.now()
    writeLastActivityAt(now)
    scheduleFromLastActivity(now)
    intervalRef.current = window.setInterval(checkClock, 1000)

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActivity, { passive: true })
    }

    for (const eventName of CLOCK_CHECK_EVENTS) {
      window.addEventListener(eventName, checkClock, { passive: true })
    }
    document.addEventListener('visibilitychange', checkClock, { passive: true })

    return () => {
      clearTimers()
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActivity)
      }
      for (const eventName of CLOCK_CHECK_EVENTS) {
        window.removeEventListener(eventName, checkClock)
      }
      document.removeEventListener('visibilitychange', checkClock)
    }
  }, [checkClock, clearTimers, markActivity, scheduleFromLastActivity, shouldTrackSession, showExpired, writeLastActivityAt])

  useEffect(() => {
    const suppressTimeoutModal = () => {
      hasTimedOutRef.current = true
      clearTimers()
      setShowWarning(false)
      setShowExpired(false)
      setExpiredTargetPath(null)
    }

    window.addEventListener(MANUAL_LOGOUT_EVENT, suppressTimeoutModal)
    return () => window.removeEventListener(MANUAL_LOGOUT_EVENT, suppressTimeoutModal)
  }, [clearTimers])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  useEffect(() => {
    const enabled = window.localStorage.getItem(SESSION_DEBUG_STORAGE_KEY) === '1'
    setIsDebugEnabled(enabled)
    if (!enabled) return

    const interval = window.setInterval(() => {
      setDebugTick((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin'
  const debugLastActivityAt = isDebugEnabled ? readLastActivityAt() : Date.now()
  const debugElapsedSeconds = Math.max(0, Math.floor((Date.now() - debugLastActivityAt) / 1000))
  const debugRemainingSeconds = Math.max(0, Math.ceil((idleTimeoutMs - (Date.now() - debugLastActivityAt)) / 1000))

  // ─── Modal Peringatan (1 menit sebelum timeout) ──────────────────────
  const warningModal = showWarning ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-[420px] rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <Clock className="h-7 w-7 text-amber-600" />
        </div>
        <h2 className="mt-4 text-center text-[20px] font-semibold text-slate-900">
          Sesi akan berakhir
        </h2>
        <p className="mt-3 text-center text-[14px] leading-7 text-slate-500">
          Sesi akun akan segera ditutup karena tidak ada aktivitas. Pilih &ldquo;Tetap Terhubung&rdquo; untuk melanjutkan.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleForceLogout.bind(null, expiredTargetPath ?? (isAdmin ? '/portal-admin?reason=session-timeout' : '/hubungkan-dompet?reason=session-timeout'))}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar Sekarang
          </button>
          <button
            type="button"
            onClick={handleExtendSession}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-[14px] font-semibold text-white transition hover:bg-slate-800"
          >
            Tetap Terhubung
          </button>
        </div>
      </div>
    </div>
  ) : null

  // ─── Modal Sesi Berakhir ─────────────────────────────────────────────
  const expiredModal = showExpired && expiredTargetPath ? (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-[420px] rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <LogOut className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="mt-4 text-center text-[20px] font-semibold text-slate-900">
          Sesi berakhir
        </h2>
        <p className="mt-3 text-center text-[14px] leading-7 text-slate-500">
          Sesi akun ditutup karena tidak ada aktivitas. Silakan masuk ulang sesuai peran akun untuk melanjutkan.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => handleForceLogout(expiredTargetPath)}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-6 text-[14px] font-semibold text-white transition hover:bg-slate-800"
          >
            Login Ulang
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      {warningModal}
      {expiredModal}
      {isDebugEnabled ? (
        <div className="fixed bottom-4 right-4 z-[130] w-[320px] rounded-2xl border border-slate-200 bg-white/95 p-4 text-[12px] text-slate-700 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900">Session timeout debug</p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">ON</span>
          </div>
          <dl className="mt-3 grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 gap-y-1.5">
            <dt>Protected route</dt><dd className="font-mono">{String(isProtectedContext)}</dd>
            <dt>Auth session</dt><dd className="font-mono">{String(Boolean(authSession))}</dd>
            <dt>Role</dt><dd className="font-mono">{currentProfile?.role ?? '-'}</dd>
            <dt>Path</dt><dd className="truncate font-mono">{pathname}</dd>
            <dt>Last activity</dt><dd className="font-mono">{new Date(debugLastActivityAt).toLocaleTimeString('id-ID')}</dd>
            <dt>Elapsed</dt><dd className="font-mono">{debugElapsedSeconds}s</dd>
            <dt>Remaining</dt><dd className="font-mono">{debugRemainingSeconds}s</dd>
            <dt>Warning</dt><dd className="font-mono">{String(showWarning)}</dd>
            <dt>Expired</dt><dd className="font-mono">{String(showExpired)}</dd>
            <dt>Tick</dt><dd className="font-mono">{debugTick}</dd>
          </dl>
          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            Matikan: <code>localStorage.removeItem('{SESSION_DEBUG_STORAGE_KEY}')</code> lalu refresh.
          </p>
        </div>
      ) : null}
    </>
  )
}
