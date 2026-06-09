'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { authSessionQueryKey, useAuthSession } from '@/hooks/use-auth-session'
import { useCurrentProfile } from '@/hooks/use-profile'
import { signOutCurrentSession } from '@/lib/repositories/authRepository'
import { useToast } from '@/components/ui/toast-provider'
import { LogOut, Clock } from 'lucide-react'

const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000
const VOTER_IDLE_TIMEOUT_MS = 30 * 60 * 1000
const WARNING_BEFORE_MS = 60 * 1000 // tampilkan peringatan 1 menit sebelum timeout
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'pointerdown', 'visibilitychange'] as const

function getRoleAwareLoginPath(pathname: string, role: string | null | undefined) {
  if (role === 'super_admin' || role === 'admin') return '/portal-admin?reason=session-timeout'
  if (pathname.startsWith('/superadmin') || pathname.startsWith('/admin') || pathname.startsWith('/portal-admin')) return '/portal-admin?reason=session-timeout'

  const redirectTarget = pathname.startsWith('/pemilih') ? pathname : '/pemilih'
  return `/hubungkan-dompet?redirect=${encodeURIComponent(redirectTarget)}&reason=session-timeout`
}

export function IdleSessionTimeout() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const { data: authSession } = useAuthSession()
  const { data: currentProfile } = useCurrentProfile()
  const timeoutRef = useRef<number | null>(null)
  const warningRef = useRef<number | null>(null)
  const hasTimedOutRef = useRef(false)

  const [showWarning, setShowWarning] = useState(false)
  const [showExpired, setShowExpired] = useState(false)
  const [expiredTargetPath, setExpiredTargetPath] = useState<string | null>(null)

  const isProtectedContext = useMemo(() => (
    pathname.startsWith('/pemilih')
    || pathname.startsWith('/admin')
    || pathname.startsWith('/superadmin')
    || pathname.startsWith('/portal-admin')
  ), [pathname])

  const idleTimeoutMs = useMemo(() => {
    if (currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin') return ADMIN_IDLE_TIMEOUT_MS
    if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin') || pathname.startsWith('/portal-admin')) return ADMIN_IDLE_TIMEOUT_MS
    return VOTER_IDLE_TIMEOUT_MS
  }, [currentProfile?.role, pathname])

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningRef.current !== null) {
      window.clearTimeout(warningRef.current)
      warningRef.current = null
    }
  }, [])

  const handleForceLogout = useCallback(async (targetPath: string) => {
    hasTimedOutRef.current = true
    clearTimers()
    setShowWarning(false)
    setShowExpired(false)

    await signOutCurrentSession().catch(() => undefined)
    void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
    void queryClient.invalidateQueries({ queryKey: ['profile'] })

    router.replace(targetPath)
  }, [clearTimers, queryClient, router])

  const handleTimeout = useCallback(async () => {
    if (hasTimedOutRef.current) return
    hasTimedOutRef.current = true
    clearTimers()

    const targetPath = getRoleAwareLoginPath(pathname, currentProfile?.role)

    await signOutCurrentSession().catch(() => undefined)
    void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
    void queryClient.invalidateQueries({ queryKey: ['profile'] })

    // Simpan target path dan tampilkan modal, jangan redirect langsung
    setExpiredTargetPath(targetPath)
    setShowExpired(true)
  }, [clearTimers, currentProfile?.role, pathname, queryClient])

  const handleExtendSession = useCallback(() => {
    setShowWarning(false)
    hasTimedOutRef.current = false
    resetTimer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetTimer = useCallback(() => {
    if (!isProtectedContext || !authSession) return
    clearTimers()

    // Timer untuk peringatan (muncul WARNING_BEFORE_MS sebelum timeout)
    const warningMs = Math.max(0, idleTimeoutMs - WARNING_BEFORE_MS)
    warningRef.current = window.setTimeout(() => {
      if (!hasTimedOutRef.current) {
        setShowWarning(true)
      }
    }, warningMs)

    // Timer untuk timeout eksekusi
    timeoutRef.current = window.setTimeout(() => {
      void handleTimeout()
    }, idleTimeoutMs)
  }, [authSession, clearTimers, handleTimeout, idleTimeoutMs, isProtectedContext])

  useEffect(() => {
    if (!isProtectedContext || !authSession) {
      clearTimers()
      hasTimedOutRef.current = false
      setShowWarning(false)
      setShowExpired(false)
      setExpiredTargetPath(null)
      return
    }

    hasTimedOutRef.current = false
    setShowWarning(false)
    setShowExpired(false)
    setExpiredTargetPath(null)
    resetTimer()

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetTimer, { passive: true })
    }

    return () => {
      clearTimers()
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetTimer)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession, isProtectedContext])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin'

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
    </>
  )
}
