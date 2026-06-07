'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { authSessionQueryKey, useAuthSession } from '@/hooks/use-auth-session'
import { useCurrentProfile } from '@/hooks/use-profile'
import { signOutCurrentSession } from '@/lib/repositories/authRepository'
import { useToast } from '@/components/ui/toast-provider'

const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000
const VOTER_IDLE_TIMEOUT_MS = 30 * 60 * 1000
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
  const hasTimedOutRef = useRef(false)

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

  const handleTimeout = useCallback(async () => {
    if (hasTimedOutRef.current) return
    hasTimedOutRef.current = true
    clearTimer()

    const targetPath = getRoleAwareLoginPath(pathname, currentProfile?.role)

    await signOutCurrentSession().catch(() => undefined)
    void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
    void queryClient.invalidateQueries({ queryKey: ['profile'] })

    showToast({
      tone: 'error',
      title: 'Sesi berakhir otomatis',
      description: 'Sesi akun ditutup karena tidak ada aktivitas. Silakan masuk ulang sesuai peran akun.',
    })

    router.replace(targetPath)
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
      hasTimedOutRef.current = false
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
  }, [authSession, clearTimer, isProtectedContext, resetTimer])

  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  return null
}
