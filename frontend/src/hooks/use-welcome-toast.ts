'use client'

import { useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import { useCurrentProfile } from '@/hooks/use-profile'

const WELCOME_STORAGE_KEY = 'votein_welcome_shown'

/**
 * Menampilkan toast "Selamat datang" sekali per sesi login
 * ketika user pertama kali tiba di dashboard setelah login.
 *
 * Menggunakan sessionStorage supaya reset saat user benar-benar login ulang
 * (bukan saat navigasi antar halaman).
 */
export function useWelcomeToast() {
  const { showToast } = useToast()
  const { data: profile, isLoading } = useCurrentProfile()
  const shownRef = useRef(false)

  useEffect(() => {
    if (isLoading || !profile || shownRef.current) return

    // Cek apakah sudah pernah ditampilkan di sesi ini
    if (typeof window !== 'undefined' && sessionStorage.getItem(WELCOME_STORAGE_KEY)) {
      return
    }

    shownRef.current = true
    sessionStorage.setItem(WELCOME_STORAGE_KEY, '1')

    const roleLabel = profile.role === 'super_admin'
      ? 'Superadmin'
      : profile.role === 'admin'
        ? 'Admin'
        : 'Pemilih'

    const displayName = profile.displayName || profile.email?.split('@')[0] || 'Peserta'

    showToast({
      tone: 'success',
      title: 'Selamat datang, ' + displayName + '!',
      description: `Anda masuk sebagai ${roleLabel}. Selamat menggunakan Votein.`,
    })
  }, [profile, isLoading, showToast])
}
