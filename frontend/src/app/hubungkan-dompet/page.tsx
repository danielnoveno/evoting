'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  Check,
  Wallet as WalletIcon,
  Loader2,
  ChevronRight,
  Link2,
  Building2,
  Mail,
  UserPlus,
  ArrowLeft,
  X,
  Copy,
  AlertTriangle,
} from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { signOutCurrentSession } from '@/lib/repositories/authRepository'
import { useToast } from '@/components/ui/toast-provider'
import { authSessionQueryKey, useAuthSession, useMicrosoftCampusLogin, useGoogleLogin, useEmailPasswordLogin, useEmailPasswordSignUp } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile, useProfileByWallet } from '@/hooks/use-profile'
import { ScrollReveal } from '@/components/public/parallax'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { WalletAddress } from '@/components/ui/wallet-address'
import { AuthSuccessRedirectModal } from '@/components/auth/auth-success-redirect-modal'

function sameWalletAddress(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function resolveRedirectTarget(redirectParam: string | null, activationContext: 'admin' | 'voter') {
  if (redirectParam?.startsWith('/auth/aktivasi-admin')) return '/admin'

  if (redirectParam?.startsWith('/') && !redirectParam.startsWith('//')) {
    try {
      const parsed = new URL(redirectParam, 'https://votechain.local')
      if (parsed.origin === 'https://votechain.local') return `${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      // Abaikan redirect tidak valid dan gunakan fallback berbasis konteks.
    }
  }
  if (activationContext === 'admin') return '/admin'
  return '/pemilih'
}

function getAdminInviteTokenFromRedirect(redirectParam: string | null) {
  if (!redirectParam?.startsWith('/') || redirectParam.startsWith('//')) return ''

  try {
    const parsed = new URL(redirectParam, 'https://votechain.local')
    if (parsed.origin !== 'https://votechain.local') return ''
    if (parsed.pathname !== '/auth/aktivasi-admin') return ''
    return parsed.searchParams.get('invite')?.trim() ?? ''
  } catch {
    return ''
  }
}

function getRedirectModalContent(target: string, role: string | null | undefined) {
  if (role === 'super_admin' || target.startsWith('/superadmin')) {
    return {
      title: 'Login Berhasil',
      description: 'Anda akan diarahkan ke dashboard pengelolaan platform.',
      targetLabel: 'Dashboard Superadmin',
    }
  }

  if (role === 'admin' || target.startsWith('/admin')) {
    return {
      title: 'Akses Admin Aktif',
      description: 'Anda akan diarahkan ke dashboard pengelolaan organisasi.',
      targetLabel: 'Dashboard Admin',
    }
  }

  return {
    title: 'Hak Suara Aktif',
    description: 'Anda akan diarahkan ke halaman pemilih.',
    targetLabel: 'Dashboard Pemilih',
  }
}

function getWalletConnectionErrorMessage(error: { message?: string }) {
  const message = error.message?.toLowerCase() ?? ''
  if (message.includes('window') || message.includes('popup') || message.includes('permission')) {
    return 'Browser memerlukan izin untuk membuka jendela dompet. Klik tombol sambungkan lagi, lalu izinkan jendela yang muncul.'
  }
  if (message.includes('rejected') || message.includes('denied') || message.includes('cancel')) {
    return 'Penyambungan dompet dibatalkan. Klik sambungkan lagi jika ingin melanjutkan.'
  }

  return 'Coba lagi dari perangkat atau browser yang mendukung Smart Wallet.'
}

function ConnectWalletContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnectPending } = useConnect()
  const { disconnect } = useDisconnect()
  const queryClient = useQueryClient()
  const authSessionQuery = useAuthSession()
  const currentProfileQuery = useCurrentProfile()
  const connectedWalletProfileQuery = useProfileByWallet(address)
  const bindWalletMutation = useBindCurrentWallet()
  const microsoftLoginMutation = useMicrosoftCampusLogin()
  const googleLoginMutation = useGoogleLogin()
  const emailLoginMutation = useEmailPasswordLogin()
  const emailSignUpMutation = useEmailPasswordSignUp()

  const signOutMutation = useMutation({
    mutationFn: signOutCurrentSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const redirectParam = searchParams.get('redirect')
  const activateParam = searchParams.get('activate')
  const directActivationToken = searchParams.get('token')?.trim() ?? ''
  const adminInviteTokenFromRedirect = useMemo(() => getAdminInviteTokenFromRedirect(redirectParam), [redirectParam])
  const activationToken = directActivationToken || adminInviteTokenFromRedirect
  const authSession = authSessionQuery.data
  const currentProfile = currentProfileQuery.data
  const connectedWalletProfile = connectedWalletProfileQuery.data

  // Determine context: prioritized by profile role if logged in, then URL param, then redirect hint
  const activationContext = useMemo((): 'admin' | 'voter' => {
    if (currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin') return 'admin'
    if (adminInviteTokenFromRedirect) return 'admin'
    if (activateParam === 'admin') return 'admin'
    if (redirectParam?.startsWith('/admin') || redirectParam?.startsWith('/superadmin') || redirectParam?.startsWith('/portal-admin')) return 'admin'
    return 'voter'
  }, [currentProfile?.role, adminInviteTokenFromRedirect, activateParam, redirectParam])

  const activationMode = activateParam === '1' || activateParam === 'admin' || activateParam === 'voter' || Boolean(adminInviteTokenFromRedirect) || (Boolean(authSession) && activationContext === 'admin')
  const voterActivationMissingToken = activationMode && activationContext === 'voter' && !activationToken
  const adminActivationMissingToken = activateParam === 'admin' && activationContext === 'admin' && !activationToken && !currentProfile
  const redirectTarget = useMemo(() => {
    if (adminInviteTokenFromRedirect) return currentProfile?.role === 'super_admin' ? '/portal-admin' : '/admin'
    return resolveRedirectTarget(redirectParam, activationContext)
  }, [redirectParam, activationContext, adminInviteTokenFromRedirect, currentProfile?.role])

  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [bindError, setBindError] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [sessionTimeout, setSessionTimeout] = useState(false)
  const [redirectModal, setRedirectModal] = useState<ReturnType<typeof getRedirectModalContent> | null>(null)
  const redirectStartedRef = useRef(false)
  const redirectTimerRef = useRef<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  // Detect session-timeout redirect from middleware
  useEffect(() => {
    if (!mounted) return
    if (searchParams.get('reason') === 'session-timeout') {
      setSessionTimeout(true)
      // Clean up URL so refreshing doesn't re-show the modal
      const url = new URL(window.location.href)
      url.searchParams.delete('reason')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, mounted])

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current)
    }
  }, [])

  // Handle errors from URL parameters (e.g., after failed OAuth, stale session, or DB reset)
  useEffect(() => {
    if (!mounted) return
    const authError = searchParams.get('authError')
    if (authError) {
      if (authError === 'backend_not_configured') {
        setFormError('Sistem autentikasi belum siap. Hubungi admin.')
      } else if (authError === 'profile_unavailable') {
        setFormError('Profil akun belum bisa dibaca. Jika database baru di-reset, keluar lalu masuk ulang atau hubungi admin untuk aktivasi ulang.')
      } else if (authError === 'registry_unavailable') {
        setFormError('Data aktivasi admin belum bisa diperiksa. Coba lagi beberapa saat atau hubungi super admin.')
      } else if (authError === 'activation_required') {
        setFormError('Akun ini belum diaktivasi. Gunakan tautan aktivasi dari admin sebelum masuk dashboard.')
      } else if (authError === 'admin_pending') {
        setFormError('Undangan admin organisasi masih pending. Minta super admin mengaktifkan undangan terlebih dahulu.')
      } else if (authError === 'missing_code') {
        // Look in hash for more details if code is missing
        const hash = window.location.hash
        if (hash.includes('error=')) {
          const params = new URLSearchParams(hash.substring(1))
          const desc = params.get('error_description')
          if (desc) {
            const cleanDesc = decodeURIComponent(desc).replace(/\+/g, ' ')
            setFormError(`Gagal Login Microsoft: ${cleanDesc}`)
            return
          }
        }
        setFormError('Gagal login Microsoft: Tidak ada kode verifikasi yang diterima.')
      } else if (authError === 'oauth_exchange_failed') {
        setFormError('Gagal verifikasi akun kampus. Pastikan kredensial @uajy.ac.id Anda benar.')
      } else if (authError === 'internal_callback_error') {
        setFormError('Terjadi masalah saat menyelesaikan login. Coba keluar, hapus sesi browser, lalu masuk ulang.')
      } else {
        setFormError('Sesi tidak bisa divalidasi. Coba keluar, muat ulang halaman, lalu masuk kembali.')
      }
    }
  }, [searchParams, mounted])

  useEffect(() => {
    if (!mounted || !currentProfileQuery.error) return
    setFormError(getRepositoryErrorMessage(currentProfileQuery.error, 'Profil akun belum bisa dimuat. Coba masuk ulang atau hubungi admin.'))
  }, [mounted, currentProfileQuery.error])

  const isWalletBound = sameWalletAddress(currentProfile?.walletAddress, address)
  const accountHasDifferentWallet = Boolean(address && currentProfile?.walletAddress && !isWalletBound)
  const connectedWalletOwnedByOther = Boolean(
    authSession?.user?.id &&
    connectedWalletProfile?.userId &&
    connectedWalletProfile.userId !== authSession.user.id,
  )
  const firstTimeBindingRequiresActivation = Boolean(authSession && !currentProfile && !activationMode)
  const bindingBlocked = accountHasDifferentWallet || connectedWalletOwnedByOther || firstTimeBindingRequiresActivation || voterActivationMissingToken || adminActivationMissingToken
  const bindingBlockMessage = accountHasDifferentWallet
    ? `Akun ${authSession?.user?.email ?? 'ini'} sudah tertaut ke wallet lain. Putuskan dompet tersambung, lalu sambungkan wallet yang sesuai untuk melanjutkan.`
    : connectedWalletOwnedByOther
      ? `Wallet tersambung sudah tertaut ke akun ${connectedWalletProfile?.email ?? 'kampus lain'}. Putuskan dompet tersambung, lalu pilih wallet yang sesuai.`
      : firstTimeBindingRequiresActivation
        ? 'Akun ini belum diaktivasi. Gunakan tautan aktivasi dari admin sebelum menghubungkan wallet dan masuk dashboard.'
      : voterActivationMissingToken
        ? 'Link aktivasi tidak membawa token undangan. Minta admin mengirim ulang link aktivasi terbaru.'
      : adminActivationMissingToken
        ? 'Link aktivasi admin tidak membawa token undangan. Minta superadmin mengirim ulang link aktivasi terbaru.'
      : ''
  const isAdminActivationFlow = activationMode && activationContext === 'admin'
  const isVoterSsoFirstFlow = activationMode && activationContext === 'voter' && Boolean(authSession)
  const completedSteps = isAdminActivationFlow
    ? (authSession ? 1 : 0) + (isConnected ? 1 : 0) + (isWalletBound ? 1 : 0)
    : isVoterSsoFirstFlow
      ? (isConnected ? 1 : 0) + (isWalletBound ? 1 : 0)
      : (isConnected ? 1 : 0) + (authSession ? 1 : 0) + (isWalletBound ? 1 : 0)
  const totalSteps = isVoterSsoFirstFlow ? 2 : 3
  const currentStepLabel = isAdminActivationFlow
    ? !authSession
      ? 'Tahap 1 dari 3'
      : !isConnected
        ? 'Tahap 2 dari 3'
        : !isWalletBound
          ? 'Tahap 3 dari 3'
          : 'Aktivasi selesai'
    : isVoterSsoFirstFlow
      ? !isConnected
        ? 'Tahap 1 dari 2'
        : !isWalletBound
          ? 'Tahap 2 dari 2'
          : 'Aktivasi selesai'
      : !isConnected
        ? activationMode ? 'Tahap 1 dari 3' : 'Sambungkan Dompet'
        : !authSession
          ? activationMode ? 'Tahap 2 dari 3' : 'Masuk dengan Akun Kampus'
          : !isWalletBound
            ? activationMode ? 'Tahap 3 dari 3' : 'Aktifkan Hak Suara'
            : activationMode ? 'Aktivasi selesai' : 'Selesai'

  // Auto-bind if both are ready but not yet bound
  useEffect(() => {
    if (mounted && isConnected && authSession && !isWalletBound && !bindWalletMutation.isPending && !bindWalletMutation.isSuccess && !bindError && !bindingBlocked) {
      handleBind()
    }
  }, [mounted, isConnected, authSession, isWalletBound, bindWalletMutation.isPending, bindWalletMutation.isSuccess, bindError, bindingBlocked])

  // Auto-redirect if everything is ready
  useEffect(() => {
    if (mounted && currentProfile) {
      if (!redirectParam && currentProfile.role === 'super_admin') {
         router.replace('/portal-admin')
         return
      }

      if (!redirectParam && currentProfile.role === 'admin') {
         router.replace('/admin')
         return
      }
    }

    if (mounted && isConnected && authSession && isWalletBound) {
      if (redirectStartedRef.current) return
      redirectStartedRef.current = true

      const modalContent = getRedirectModalContent(redirectTarget, currentProfile?.role)
      setRedirectModal(modalContent)

      // Tampilkan toast selamat datang / aktivasi berhasil
      const toastTitle = activationMode ? 'Aktivasi Berhasil' : 'Login Berhasil'
      const toastDesc = activationMode
        ? 'Selamat datang! Akun Anda sudah aktif dan siap digunakan.'
        : `Selamat datang! Anda akan diarahkan ke ${modalContent.targetLabel}.`
      showToast({ tone: 'success', title: toastTitle, description: toastDesc })

      redirectTimerRef.current = window.setTimeout(() => {
        router.push(redirectTarget)
      }, 2200)
    }
  }, [mounted, isConnected, authSession, isWalletBound, router, redirectParam, redirectTarget, currentProfile, showToast, activationMode])

  const handleBack = () => {
    // If on step 3 (wallet connected, user logged in, but not bound)
    if (isConnected && authSession && !isWalletBound) {
      // Go back to step 2 by signing out.
      signOutMutation.mutate()
      return
    }

    // If on step 2 (wallet connected, but user not logged in)
    if (isConnected && !authSession) {
      // Go back to step 1 by disconnecting wallet.
      disconnect()
      return
    }
    
    // If on step 1 (wallet not connected), or if flow is complete, go to home.
    router.push('/')
  }

  const handleBind = () => {
    if (!address || !authSession?.user?.email) return
    setBindError('')

    if (bindingBlockMessage) {
      setBindError(bindingBlockMessage)
      showToast({ tone: 'error', title: 'Dompet dan Akun Tidak Cocok', description: bindingBlockMessage })
      return
    }

    bindWalletMutation.mutate(
      {
        walletAddress: address,
        email: authSession.user.email,
        displayName: authSession.user.user_metadata?.full_name || authSession.user.user_metadata?.name || null,
        roleHint: activationMode ? `${activationContext}-activation` : undefined,
        activationToken: activationToken || undefined,
      },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Akses Berhasil Diaktifkan', description: 'Smart Wallet dan akun kampus sudah terhubung.' })
        },
        onError: (err) => {
          const message = getRepositoryErrorMessage(err, 'Dompet belum dapat ditautkan. Coba lagi.')
          setBindError(message)
          showToast({ tone: 'error', title: 'Validasi Gagal', description: message })
        }
      }
    )
  }

  const handleMicrosoftLogin = () => {
    const nextParams = new URLSearchParams()
    if (isAdminActivationFlow) nextParams.set('activate', 'admin')
    if (activationMode && activationContext === 'voter') nextParams.set('activate', '1')
    if (activationToken) nextParams.set('token', activationToken)
    nextParams.set('redirect', redirectTarget)
    microsoftLoginMutation.mutate({ nextPath: `/hubungkan-dompet?${nextParams.toString()}` })
  }

  const handleGoogleLogin = () => {
    const nextParams = new URLSearchParams()
    if (isAdminActivationFlow) nextParams.set('activate', 'admin')
    if (activationMode && activationContext === 'voter') nextParams.set('activate', '1')
    if (activationToken) nextParams.set('token', activationToken)
    nextParams.set('redirect', redirectTarget)
    googleLoginMutation.mutate({ nextPath: `/hubungkan-dompet?${nextParams.toString()}` })
  }

  const handleEmailAuth = (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    
    if (authMode === 'login') {
      emailLoginMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            showToast({ tone: 'success', title: 'Login Berhasil', description: 'Identitas kampus Anda telah terverifikasi.' })
          },
          onError: (err) => {
            setFormError(getRepositoryErrorMessage(err))
          }
        }
      )
    } else if (authMode === 'signup') {
      emailSignUpMutation.mutate(
        { email, password },
        {
          onSuccess: (session) => {
            if (session) {
              showToast({ tone: 'success', title: 'Pendaftaran Berhasil', description: 'Identitas kampus Anda telah terverifikasi dan Anda telah masuk.' })
            } else {
              showToast({ tone: 'success', title: 'Pendaftaran Berhasil', description: 'Akun baru telah dibuat. Silakan cek email kampus Anda untuk aktivasi sebelum masuk.' })
              setAuthMode('login')
            }
          },
          onError: (err) => {
            setFormError(getRepositoryErrorMessage(err))
          }
        }
      )
    }
  }

  const handleConnectWallet = () => {
    const connector = connectors.find((item) => item.id === 'baseAccount') ?? connectors[0]
    if (!connector) {
      showToast({
        tone: 'error',
        title: 'Smart Wallet belum siap',
        description: 'Connector Coinbase/Base Account belum tersedia. Coba muat ulang halaman.',
      })
      return
    }

    connect(
      { connector },
      {
        onError: (error) => {
          showToast({
            tone: 'error',
            title: 'Gagal menyambungkan Smart Wallet',
            description: getWalletConnectionErrorMessage(error),
          })
        },
      },
    )
  }

  if (!mounted) return null

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 pb-10">
      <PublicNavbar activePath="/hubungkan-dompet" minimal />
       
      <div className="relative flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="relative z-10 w-full max-w-[1100px] px-2 sm:px-0">
          <ScrollReveal variant="fade-up">
            <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Link href="/" aria-label="Tutup dan kembali ke beranda" className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-900">
                <X className="h-4 w-4" />
              </Link>

              <div className="grid xl:grid-cols-[0.5fr_0.5fr]">
                <aside className="border-b border-slate-100 bg-white p-6 xl:border-b-0 xl:border-r xl:p-8">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <Link href="/" className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-900">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Beranda
                      </Link>
                      <h1 className="text-[24px] font-semibold leading-tight text-slate-900">
                        {activationMode
                          ? activationContext === 'admin' ? 'Aktivasi Admin Organisasi' : 'Aktivasi Pemilih'
                          : 'Masuk ke Votein'}
                      </h1>
                      <p className="mt-1 text-[13px] leading-6 text-slate-400">
                        {activationMode
                          ? activationContext === 'admin'
                            ? 'Ikuti 3 langkah untuk membuka akses dashboard pengelolaan organisasi.'
                            : 'Ikuti 3 langkah untuk mulai memilih di Votein.'
                          : 'Ikuti 3 langkah untuk mulai menggunakan Votein.'}
                      </p>
                    </div>

                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white">
                      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100" />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${completedSteps * (100 / totalSteps)} 100`}
                          className="text-emerald-500"
                        />
                      </svg>
                      <span className="absolute text-[13px] font-semibold text-slate-700">{completedSteps}/{totalSteps}</span>
                    </div>
                  </div>

                  <div className="relative mt-10 space-y-5">
                    <div className={`absolute border-l border-dashed border-slate-300 ${isVoterSsoFirstFlow ? 'bottom-16 left-[18px] top-12' : 'bottom-16 left-[18px] top-12'}`} aria-hidden="true" />

                    {isAdminActivationFlow ? (
                      <>
                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${!authSession ? 'bg-slate-100' : 'bg-white'}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${authSession ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0F172A] text-white'}`}>
                        {authSession ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[14px] font-semibold text-slate-900">Masuk dengan Akun Kampus</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {authSession ? 'Akun kampus sudah terverifikasi.' : 'Masuk dengan email organisasi yang sudah didaftarkan.'}
                        </p>
                      </div>
                      {!authSession && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${authSession && !isConnected ? 'bg-slate-100' : 'bg-white'} ${!authSession ? 'opacity-50' : ''}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-600' : authSession ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {isConnected ? <Check className="h-4 w-4" /> : <WalletIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={authSession ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>Sambungkan Dompet</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isConnected ? 'Dompet sudah tersambung.' : 'Hubungkan dompet untuk identitas admin.'}
                        </p>
                      </div>
                      {authSession && !isConnected && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                      </>
                    ) : isVoterSsoFirstFlow ? (
                      <>
                    <div className={`relative flex items-center gap-4 rounded-lg p-4 bg-white`}>
                      <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[14px] font-semibold text-slate-900">Verifikasi Akun Kampus</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          Akun kampus sudah terverifikasi.
                        </p>
                      </div>
                    </div>

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${!isConnected ? 'bg-slate-100' : 'bg-white'}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0F172A] text-white'}`}>
                        {isConnected ? <Check className="h-4 w-4" /> : <WalletIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[14px] font-semibold text-slate-900">Sambungkan Dompet</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isConnected ? 'Dompet sudah tersambung.' : 'Hubungkan dompet sebagai identitas digital.'}
                        </p>
                      </div>
                      {!isConnected && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                      </>
                    ) : (
                      <>
                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${!isConnected ? 'bg-slate-100' : 'bg-white'}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0F172A] text-white'}`}>
                        {isConnected ? <Check className="h-4 w-4" /> : <WalletIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[14px] font-semibold text-slate-900">Sambungkan Dompet</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isConnected ? 'Dompet sudah tersambung.' : 'Hubungkan dompet sebagai identitas digital.'}
                        </p>
                      </div>
                      {!isConnected && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${isConnected && !authSession ? 'bg-slate-100' : 'bg-white'} ${!isConnected ? 'opacity-50' : ''}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${authSession ? 'bg-emerald-50 text-emerald-600' : isConnected ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {authSession ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={isConnected ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>Masuk dengan Akun Kampus</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {authSession ? 'Akun kampus sudah terverifikasi.' : 'Pastikan yang masuk benar mahasiswa UAJY.'}
                        </p>
                      </div>
                      {isConnected && !authSession && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                      </>
                    )}

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${((!isVoterSsoFirstFlow && isConnected && authSession) || (isVoterSsoFirstFlow && isConnected)) && !isWalletBound ? 'bg-slate-100' : 'bg-white'} ${(!isVoterSsoFirstFlow && (!isConnected || !authSession)) || (isVoterSsoFirstFlow && !isConnected) ? 'opacity-50' : ''}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isWalletBound ? 'bg-emerald-50 text-emerald-600' : isConnected && authSession ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {isWalletBound ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={isConnected && authSession ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>{activationContext === 'admin' ? 'Aktifkan Akses Admin' : 'Aktifkan Hak Suara'}</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isWalletBound ? activationContext === 'admin' ? 'Akses admin sudah aktif.' : 'Hak suara sudah aktif.' : 'Tautkan akun kampus dan dompet.'}
                        </p>
                      </div>
                      {isConnected && authSession && !isWalletBound && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                </aside>

                <section className="flex min-h-[520px] flex-col justify-between bg-white p-6 xl:p-8">
                  <div className="w-full">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{currentStepLabel}</p>

                    {((!isAdminActivationFlow && !isVoterSsoFirstFlow && !isConnected) || (isAdminActivationFlow && authSession && !isConnected) || (isVoterSsoFirstFlow && !isConnected)) && (
                      <div className="mt-8 w-full">
                        <h2 className="text-[20px] font-semibold text-slate-900">{isAdminActivationFlow ? 'Tahap 2 — Sambungkan Dompet' : activationMode ? isVoterSsoFirstFlow ? 'Tahap 2 — Sambungkan Dompet' : 'Tahap 1 — Sambungkan Dompet' : 'Sambungkan Dompet'}</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationMode
                            ? activationContext === 'admin'
                              ? 'Hubungkan dompet yang akan digunakan untuk mengelola pemilihan organisasi.'
                              : 'Hubungkan dompet yang akan digunakan untuk memilih. Tidak perlu biaya gas.'
                            : 'Cukup sambungkan dompet, dan sistem akan mengenali Anda secara otomatis.'}
                        </p>

                        {activationMode && (
                          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">{activationContext === 'admin' ? 'Cara Aktivasi Admin' : 'Cara Aktivasi Pemilih'}</p>
                            <div className="mt-3 space-y-2 text-[13px] leading-6 text-blue-900/80">
                              {isVoterSsoFirstFlow ? (
                                <>
                                  <p><strong>Tahap 1.</strong> Verifikasi akun kampus sudah selesai.</p>
                                  <p><strong>Tahap 2.</strong> Sambungkan dompet digital, lalu aktifkan hak suara.</p>
                                </>
                              ) : (
                                <>
                                  <p><strong>Tahap 1.</strong> {activationContext === 'admin' ? 'Masuk dengan email organisasi yang sudah didaftarkan.' : 'Sambungkan dompet yang akan dipakai untuk memilih.'}</p>
                                  <p><strong>Tahap 2.</strong> {activationContext === 'admin' ? 'Sambungkan dompet yang akan dipakai sebagai identitas admin.' : 'Masuk dengan akun kampus untuk verifikasi identitas.'}</p>
                                  <p><strong>Tahap 3.</strong> {activationContext === 'admin' ? 'Aktifkan akses admin' : 'Aktifkan hak suara'} dengan menautkan akun kampus dan dompet.</p>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-8 space-y-4">
                          {[
                            'Dompet bisa dibuat secara instan tanpa biaya gas.',
                            'Tidak perlu biaya gas di jaringan Base Sepolia.',
                            activationContext === 'admin' ? 'Anda perlu email kampus dan dompet yang cocok.' : 'Pilihan Anda tetap terjaga sampai fase reveal.',
                          ].map((item) => (
                            <div key={item} className="flex items-center gap-3 text-[13px] text-slate-600">
                              <span className="h-3 w-3 rounded-full border-2 border-blue-500 bg-blue-50" />
                              {item}
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                          <div className="flex gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                              <p className="text-[12px] font-semibold">Jika muncul dialog dari Base Account</p>
                              <p className="mt-1 text-[12px] leading-5 text-amber-800">
                                Itu adalah permintaan izin dari penyedia dompet. Ikuti tombol konfirmasi pada dialog tersebut untuk melanjutkan. Jika tidak sengaja tertutup, klik tombol sambungkan lagi.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {((isConnected && !authSession) || (isAdminActivationFlow && !authSession)) && (
                      <div className="mt-8 w-full">
                        <h2 className="text-[20px] font-semibold text-slate-900">{isAdminActivationFlow ? 'Tahap 1 — Masuk dengan Akun Kampus' : activationMode ? 'Tahap 2 — Masuk dengan Akun Kampus' : 'Masuk dengan Akun Kampus'}</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationContext === 'admin'
                            ? 'Masuk dengan email organisasi yang sudah didaftarkan oleh Superadmin.'
                            : 'Setelah dompet tersambung, masuk untuk memastikan Anda mahasiswa UAJY.'}
                        </p>

                        {isConnected && <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Dompet tersambung</p>
                          <div className="mt-2 flex min-w-0 items-center gap-2">
                            <WalletAddress
                              address={address ?? ''}
                              className="min-w-0 flex-1 font-mono text-[12px] font-semibold text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (address) {
                                  navigator.clipboard.writeText(address)
                                  showToast({ tone: 'success', title: 'Alamat Disalin', description: 'Alamat dompet disalin ke clipboard.' })
                                }
                              }}
                              title="Salin alamat dompet"
                              className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-700"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => disconnect()}
                              className="shrink-0 rounded-md border border-red-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50"
                            >
                              Ganti
                            </button>
                          </div>
                        </div>}

                        <div className="mt-6 flex flex-col gap-3">
                          <button
                            onClick={handleMicrosoftLogin}
                            disabled={microsoftLoginMutation.isPending}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {microsoftLoginMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg className="h-4 w-4" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
                                <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
                                <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
                                <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
                              </svg>
                            )}
                            Masuk dengan Microsoft UAJY
                          </button>

                          <button
                            onClick={handleGoogleLogin}
                            disabled={googleLoginMutation.isPending}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {googleLoginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" />}
                            Masuk dengan Google
                          </button>
                        </div>

                        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                          <div className="flex gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <Building2 className="h-3 w-3" />
                            </div>
                            <div className="space-y-3">
                              <h3 className="text-[13px] font-bold text-blue-900">{activationContext === 'admin' ? 'Penting untuk Admin' : 'Penting untuk Pemilih'}</h3>
                              <p className="text-[12px] leading-5 text-blue-800/80">
                                {activationContext === 'admin'
                                  ? 'Gunakan email yang sama dengan undangan Superadmin. Dompet ini akan menjadi identitas Anda di dashboard admin.'
                                  : <>Dompet akan ditautkan permanen ke akun <span className="font-bold">@students.uajy.ac.id</span> Anda. Satu dompet untuk satu mahasiswa.</>}
                              </p>
                              <div className="rounded-lg bg-white/60 p-3 text-[11px] leading-relaxed text-blue-900/70 border border-blue-100/50">
                                <span className="font-bold text-blue-900 block mb-1">Tips:</span>
                                  {activationContext === 'admin'
                                    ? 'Pastikan email yang Anda gunakan sama dengan yang diundang Superadmin.'
                                    : 'Gunakan email mahasiswa UAJY saat membuat dompet agar sinkron dengan sistem.'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {formError && (
                          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-600">
                            {formError}
                          </div>
                        )}
                      </div>
                    )}


                    {isConnected && authSession && !isWalletBound && (
                      <div className="mt-8 w-full">
                          <h2 className="text-[20px] font-semibold text-slate-900">{activationMode ? `Tahap ${isVoterSsoFirstFlow ? 2 : 3} — ${activationContext === 'admin' ? 'Aktifkan Akses Admin' : 'Aktifkan Hak Suara'}` : activationContext === 'admin' ? 'Aktifkan Akses Admin' : 'Aktifkan Hak Suara'}</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationContext === 'admin'
                            ? 'Tautkan akun kampus dan dompet untuk mengaktifkan akses admin.'
                            : 'Tautkan akun kampus dan dompet untuk mengaktifkan hak suara.'}
                        </p>

                        <div className="mt-6 space-y-3">
                          {bindingBlocked && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                              <p className="text-[12px] font-semibold text-red-700">Dompet dan akun tidak cocok</p>
                              <p className="mt-2 text-[12px] leading-5 text-red-600">{bindingBlockMessage}</p>
                              <button
                                type="button"
                                onClick={() => disconnect()}
                                className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-[12px] font-semibold text-red-700 transition-colors hover:bg-red-50"
                              >
                                Putuskan & Ganti Dompet
                              </button>
                            </div>
                          )}

                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Smart Wallet</p>
                            <WalletAddress
                              address={address ?? '-'}
                              className="mt-1 block font-mono text-[12px] font-semibold text-slate-900"
                            />
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{activationContext === 'admin' ? 'Akun Admin' : 'Akun Mahasiswa'}</p>
                            <p className="mt-1 truncate text-[13px] font-semibold text-slate-900" title={authSession.user?.email}>{authSession.user?.email}</p>
                          </div>

                          {bindError && (
                            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-600">
                              {bindError}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {isConnected && authSession && isWalletBound && (
                      <div className="mt-16 flex w-full flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h2 className="mt-6 text-[20px] font-semibold text-slate-900">
                          {activationContext === 'admin' ? 'Akses Admin Aktif' : 'Hak Suara Aktif'}
                        </h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationContext === 'admin' 
                            ? 'Anda bisa mengelola pemilihan dari dashboard.'
                            : 'Anda akan diarahkan ke halaman pemilih...'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex w-full items-center justify-between gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                      aria-label="Kembali"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    {!isConnected && (!isAdminActivationFlow || authSession) && (
                      <button
                        type="button"
                        onClick={handleConnectWallet}
                        disabled={isConnectPending}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                      >
                        {isConnectPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Sambungkan Smart Wallet
                        {!isConnectPending ? <ChevronRight className="h-4 w-4" /> : null}
                      </button>
                    )}

                    {((isConnected && !authSession) || (isAdminActivationFlow && !authSession)) && (
                      <p className="text-right text-[12px] text-slate-400">Pilih salah satu metode masuk di atas.</p>
                    )}

                    {isConnected && authSession && !isWalletBound && (
                      <button
                        onClick={handleBind}
                        disabled={bindWalletMutation.isPending || bindingBlocked}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                      >
                        {bindWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        {activationContext === 'admin' ? 'Aktifkan Akses Admin' : 'Aktifkan Hak Suara'}
                      </button>
                    )}

                    {isConnected && authSession && isWalletBound && (
                      <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Selesai
                      </span>
                    )}
                  </div>
                </section>
              </div>
            </section>
          </ScrollReveal>

            {/* <ScrollReveal variant="fade-up" delay={500} className="mt-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
                Sambungkan Dompet Digital Kamu
              </p>
            </ScrollReveal> */}
          </div>
        </div>

        {redirectModal ? (
          <AuthSuccessRedirectModal
            open
            title={redirectModal.title}
            description={redirectModal.description}
            targetLabel={redirectModal.targetLabel}
          />
        ) : null}

        {sessionTimeout ? (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-timeout-title"
            aria-describedby="session-timeout-description"
          >
            <div className="w-full max-w-[360px] rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle className="h-7 w-7" aria-hidden="true" />
              </div>

              <h2 id="session-timeout-title" className="mt-5 text-[16px] font-semibold text-slate-900">
                Sesi Berakhir
              </h2>
              <p id="session-timeout-description" className="mt-3 text-[13px] leading-6 text-slate-600">
                Sesi Anda telah berakhir karena waktu aktif habis. Silakan masuk kembali untuk melanjutkan.
              </p>

              <button
                type="button"
                onClick={() => setSessionTimeout(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-slate-800"
              >
                Masuk Kembali
              </button>
            </div>
          </div>
        ) : null}

        <PublicFooter />
      </main>
    )
  }

export default function ConnectWalletPage() {
  return (
    <Suspense fallback={
       <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900 mx-auto" />
            <p className="mt-4 text-[12px] font-medium text-slate-500">Memuat sistem...</p>
          </div>
       </div>
    }>
      <ConnectWalletContent />
    </Suspense>
  )
}
