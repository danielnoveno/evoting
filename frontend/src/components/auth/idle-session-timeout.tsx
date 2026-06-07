'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { authSessionQueryKey, useAuthSession } from '@/hooks/use-auth-session'
import { useCurrentProfile } from '@/hooks/use-profile'
import { signOutCurrentSession } from '@/lib/repositories/authRepository'
import { useToast } from '@/components/ui/toast-provider'
import { ModalShell } from '@/components/ui/modal-shell'

const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000
const VOTER_IDLE_TIMEOUT_MS = 30 * 60 * 1000
const REDIRECT_DELAY_MS = 3500
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
  const redirectRef = useRef<number | null>(null)
  const hasTimedOutRef = useRef(false)
  const [sessionExpired, setSessionExpired] = useState<{
    open: boolean
    targetPath: string
    roleLabel: string
  }>({ open: false, targetPath: '/', roleLabel: 'akun' })

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

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const clearRedirect = useCallback(() => {
    if (redirectRef.current !== null) {
      window.clearTimeout(redirectRef.current)
      redirectRef.current = null
    }
  }, [])

  const goToLogin = useCallback((targetPath: string) => {
    clearRedirect()
    router.replace(targetPath)
  }, [clearRedirect, router])

  const handleTimeout = useCallback(async () => {
    if (hasTimedOutRef.current) return
    hasTimedOutRef.current = true
    clearTimer()

    const targetPath = getRoleAwareLoginPath(pathname, currentProfile?.role)
    const roleLabel = currentProfile?.role === 'super_admin'
      ? 'superadmin'
      : currentProfile?.role === 'admin'
        ? 'admin organisasi'
        : 'voter/mahasiswa'

    await signOutCurrentSession().catch(() => undefined)
    void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
    void queryClient.invalidateQueries({ queryKey: ['profile'] })
    setSessionExpired({ open: true, targetPath, roleLabel })

    showToast({
      tone: 'error',
      title: 'Sesi berakhir otomatis',
      description: 'Karena tidak ada aktivitas, sesi akun ditutup. Wallet tetap tersambung, tetapi Anda perlu login ulang.',
    })

    redirectRef.current = window.setTimeout(() => {
      router.replace(targetPath)
    }, REDIRECT_DELAY_MS)
  }, [clearTimer, currentProfile?.role, pathname, queryClient, router, showToast])

  const resetTimer = useCallback(() => {
    if (!isProtectedContext || !authSession) return
    clearTimer()
    timeoutRef.current = window.setTimeout(() => {
      void handleTimeout()
    }, idleTimeoutMs)
  }, [authSession, clearTimer, handleTimeout, idleTimeoutMs, isProtectedContext])

  useEffect(() => {
    if (!isProtectedContext || !authSession) {
      clearTimer()
      if (!sessionExpired.open) {
        hasTimedOutRef.current = false
      }
      return
    }

    hasTimedOutRef.current = false
    resetTimer()

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetTimer, { passive: true })
    }

    return () => {
      clearTimer()
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetTimer)
      }
    }
  }, [authSession, clearTimer, isProtectedContext, resetTimer, sessionExpired.open])

  useEffect(() => {
    return () => {
      clearTimer()
      clearRedirect()
    }
  }, [clearRedirect, clearTimer])

  return (
    <ModalShell
      open={sessionExpired.open}
      title="Sesi login berakhir"
      description={`Tidak ada aktivitas dalam beberapa waktu, jadi sesi ${sessionExpired.roleLabel} ditutup otomatis. Wallet Anda tetap tersambung, tetapi login Microsoft/Google perlu diulang untuk membuka akses.`}
      onClose={() => goToLogin(sessionExpired.targetPath)}
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-[14px] font-semibold">Akses akun perlu divalidasi ulang</p>
            <p className="mt-2 text-[13px] leading-6 text-amber-800">
              Anda akan diarahkan otomatis ke halaman login sesuai peran. Setelah login Microsoft/Google berhasil, gunakan wallet yang masih tersambung untuk melanjutkan.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-2 text-[13px] text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Mengarahkan ke login...
        </div>
        <button
          type="button"
          onClick={() => goToLogin(sessionExpired.targetPath)}
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          Login sekarang
        </button>
      </div>
    </ModalShell>
  )
}
