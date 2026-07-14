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
import { authSessionQueryKey, useAuthSession, useMicrosoftCampusLogin, useGoogleLogin, useMagicLinkLogin } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile, useProfileByWallet, useAdminRegistryByWallet } from '@/hooks/use-profile'
import { ScrollReveal } from '@/components/public/parallax'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { WalletAddress } from '@/components/ui/wallet-address'
import { AuthSuccessRedirectModal } from '@/components/auth/auth-success-redirect-modal'
import { sameWalletAddress } from '@/lib/repositories/helpers'
import { useActivationTokenPreview } from '@/hooks/use-activation-token'

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
    return 'Browser memerlukan izin untuk membuka jendela konfirmasi. Klik tombol sambungkan lagi, lalu izinkan jendela yang muncul.'
  }
  if (message.includes('rejected') || message.includes('denied') || message.includes('cancel')) {
    return 'Pembuatan ID voting dibatalkan. Klik sambungkan lagi jika ingin melanjutkan.'
  }

  return 'Coba lagi dari perangkat atau browser yang mendukung Base Account.'
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
  const adminRegistryByWalletQuery = useAdminRegistryByWallet(address)
  const bindWalletMutation = useBindCurrentWallet()
  const microsoftLoginMutation = useMicrosoftCampusLogin()
  const googleLoginMutation = useGoogleLogin()
  const magicLinkLoginMutation = useMagicLinkLogin()

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

  // Determine context: prioritized by profile role if logged in, then admin registry by wallet, then URL param, then redirect hint
  const activationContext = useMemo((): 'admin' | 'voter' => {
    if (currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin') return 'admin'
    // ponytail: cek admin_registry langsung by wallet_address — admin mungkin belum punya app_profiles
    const adminByWallet = adminRegistryByWalletQuery.data
    if (adminByWallet?.role === 'admin' || adminByWallet?.role === 'super_admin') return 'admin'
    if (connectedWalletProfile?.role === 'admin' || connectedWalletProfile?.role === 'super_admin') return 'admin'
    if (adminInviteTokenFromRedirect) return 'admin'
    if (activateParam === 'admin') return 'admin'
    if (redirectParam?.startsWith('/admin') || redirectParam?.startsWith('/superadmin') || redirectParam?.startsWith('/portal-admin')) return 'admin'
    return 'voter'
  }, [currentProfile?.role, adminRegistryByWalletQuery.data, connectedWalletProfile?.role, adminInviteTokenFromRedirect, activateParam, redirectParam])

  const activationMode = activateParam === '1' || activateParam === 'admin' || activateParam === 'voter' || Boolean(adminInviteTokenFromRedirect) || activationContext === 'admin'
  const tokenPreviewQuery = useActivationTokenPreview(activationToken && activationContext === 'voter' ? activationToken : null)
  const voterActivationMissingToken = activationMode && activationContext === 'voter' && !activationToken
  const adminActivationMissingToken = activateParam === 'admin' && activationContext === 'admin' && !activationToken && !currentProfile
  const redirectTarget = useMemo(() => {
    if (adminInviteTokenFromRedirect) return currentProfile?.role === 'super_admin' ? '/portal-admin' : '/admin'
    return resolveRedirectTarget(redirectParam, activationContext)
  }, [redirectParam, activationContext, adminInviteTokenFromRedirect, currentProfile?.role])

  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [magicLinkSentTo, setMagicLinkSentTo] = useState('')
  const [bindError, setBindError] = useState('')
  const [redirectModal, setRedirectModal] = useState<ReturnType<typeof getRedirectModalContent> | null>(null)
  const redirectStartedRef = useRef(false)
  const redirectTimerRef = useRef<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!email && tokenPreviewQuery.data?.email) setEmail(tokenPreviewQuery.data.email)
  }, [email, tokenPreviewQuery.data?.email])

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
  // ponytail: user yang sudah aktif — wallet sudah punya profil di database (voter atau admin)
  const isReturningUser = Boolean(currentProfile || connectedWalletProfile || adminRegistryByWalletQuery.data)
  const isReturningVoter = isReturningUser && activationContext === 'voter'
  const accountHasDifferentWallet = Boolean(address && currentProfile?.walletAddress && !isWalletBound)
  const connectedWalletOwnedByOther = Boolean(
    authSession?.user?.id &&
    connectedWalletProfile?.userId &&
    connectedWalletProfile.userId !== authSession.user.id,
  )
  const firstTimeBindingRequiresActivation = Boolean(authSession && !currentProfile && !activationMode)
  const bindingBlocked = accountHasDifferentWallet || connectedWalletOwnedByOther || firstTimeBindingRequiresActivation || voterActivationMissingToken || adminActivationMissingToken
  const bindingBlockMessage = accountHasDifferentWallet
    ? `Akun ${authSession?.user?.email ?? 'ini'} sudah tertaut ke ID voting lain. Putuskan ID voting yang tersambung, lalu buat ID voting yang sesuai untuk melanjutkan.`
    : connectedWalletOwnedByOther
      ? `ID voting ini sudah tertaut ke akun ${connectedWalletProfile?.email ?? 'kampus lain'}. Putuskan ID voting yang tersambung, lalu pilih ID voting yang sesuai.`
      : firstTimeBindingRequiresActivation
        ? 'Akun ini belum diaktivasi. Gunakan tautan aktivasi dari admin sebelum membuat ID voting dan masuk dashboard.'
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
        ? activationMode ? 'Tahap 2 dari 3' : 'Tahap 1 dari 3'
        : !authSession
          ? activationMode ? 'Tahap 2 dari 3' : 'Tahap 1 dari 3'
          : !isWalletBound
            ? activationMode ? 'Tahap 3 dari 3' : 'Tahap 2 dari 3'
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

      // ponytail: voter yang sudah aktif → langsung ke halaman pemilih
      if (!redirectParam && currentProfile.role === 'voter' && isWalletBound) {
         router.replace('/pemilih')
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
    // ponytail: unified SSO-first flow — always: SSO → wallet → bind
    // If on step 3 (wallet connected, user logged in, but not bound)
    if (isConnected && authSession && !isWalletBound) {
      // Go back to step 2 by disconnecting wallet.
      disconnect()
      return
    }

    // If on step 2 (logged in, but wallet not connected)
    if (authSession && !isConnected) {
      // Go back to step 1 by signing out.
      signOutMutation.mutate()
      return
    }

    // If on step 1 (not logged in), or if flow is complete, go to home.
    router.push('/')
  }

  const handleBind = () => {
    if (!address || !authSession?.user?.email) return
    setBindError('')

    if (bindingBlockMessage) {
      setBindError(bindingBlockMessage)
      showToast({ tone: 'error', title: 'ID Voting dan Akun Tidak Cocok', description: bindingBlockMessage })
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
          showToast({ tone: 'success', title: 'Akses Berhasil Diaktifkan', description: 'ID voting dan akun kampus sudah terhubung.' })
        },
        onError: (err) => {
          const message = getRepositoryErrorMessage(err, 'ID voting belum dapat ditautkan. Coba lagi.')
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

  const handleMagicLinkLogin = (e: FormEvent) => {
    e.preventDefault()
    setFormError('')

    const normalizedEmail = email.trim().toLowerCase()
    const invitedEmail = tokenPreviewQuery.data?.email?.trim().toLowerCase()
    if (activationMode && activationContext === 'voter' && invitedEmail && normalizedEmail !== invitedEmail) {
      setFormError('Email harus sama dengan email pada undangan aktivasi pemilih.')
      return
    }

    const nextParams = new URLSearchParams()
    if (activationMode && activationContext === 'voter') nextParams.set('activate', '1')
    if (activationToken) nextParams.set('token', activationToken)
    nextParams.set('redirect', redirectTarget)

    magicLinkLoginMutation.mutate(
      { email: normalizedEmail, nextPath: `/hubungkan-dompet?${nextParams.toString()}` },
      {
        onSuccess: () => {
          setMagicLinkSentTo(normalizedEmail)
          showToast({ tone: 'success', title: 'Link Masuk Dikirim', description: 'Buka email tersebut lalu klik link masuk untuk melanjutkan aktivasi.' })
        },
        onError: (err) => {
          setFormError(getRepositoryErrorMessage(err, 'Gagal mengirim link masuk. Coba lagi.'))
        }
      }
    )
  }

  const handleConnectWallet = () => {
    const connector = connectors.find((item) => item.id === 'baseAccount') ?? connectors[0]
    if (!connector) {
      showToast({
        tone: 'error',
        title: 'ID voting belum siap',
        description: 'Sistem Base Account belum tersedia. Coba muat ulang halaman.',
      })
      return
    }

    connect(
      { connector },
      {
        onError: (error) => {
      showToast({
        tone: 'error',
        title: 'Gagal membuat ID voting',
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
                          : isReturningVoter
                            ? 'ID voting Anda sudah terdaftar. Masuk untuk melanjutkan.'
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
                        <h2 className={authSession ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>ID Voting</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isConnected ? 'ID voting sudah aktif.' : 'Buat ID voting untuk mengelola pemilihan.'}
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
                        <h2 className="text-[14px] font-semibold text-slate-900">ID Voting</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isConnected ? 'ID voting sudah aktif.' : 'Buat ID voting untuk membuktikan identitas Anda.'}
                        </p>
                      </div>
                      {!isConnected && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                      </>
                    ) : (
                      <>
                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${!authSession ? 'bg-slate-100' : 'bg-white'}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${authSession ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0F172A] text-white'}`}>
                        {authSession ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[14px] font-semibold text-slate-900">Masuk dengan Akun Kampus</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {authSession ? 'Akun kampus sudah terverifikasi.' : 'Masuk untuk verifikasi identitas Anda.'}
                        </p>
                      </div>
                      {!authSession && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${authSession && !isConnected ? 'bg-slate-100' : 'bg-white'} ${!authSession ? 'opacity-50' : ''}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-600' : authSession ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {isConnected ? <Check className="h-4 w-4" /> : <WalletIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={authSession ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>ID Voting</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isConnected ? 'ID voting sudah aktif.' : 'Buat ID voting untuk membuktikan identitas Anda.'}
                        </p>
                      </div>
                      {authSession && !isConnected && <ChevronRight className="h-4 w-4 text-slate-400" />}
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

                    {/* ponytail: tampilkan loading saat auth session masih dimuat, cegah SSO flash setelah wallet connect */}
                    {(!isAdminActivationFlow && !isVoterSsoFirstFlow && authSessionQuery.isLoading && !authSession) && (
                      <div className="mt-8 w-full">
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
                          <p className="mt-4 text-[13px] font-medium text-slate-600">Memeriksa sesi akun kampus...</p>
                        </div>
                      </div>
                    )}

                    {/* ponytail: SSO-first flow — tampilkan form login SSO dulu sebelum connect wallet */}
                    {((!isAdminActivationFlow && !isVoterSsoFirstFlow && !authSession && !authSessionQuery.isLoading) || (isAdminActivationFlow && !authSession && !authSessionQuery.isLoading)) && (
                      <div className="mt-8 w-full">
                        <h2 className="text-[20px] font-semibold text-slate-900">{isAdminActivationFlow ? 'Tahap 1 — Masuk dengan Akun Kampus' : activationMode ? 'Tahap 1 — Masuk dengan Akun Kampus' : 'Masuk dengan Akun Kampus'}</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationContext === 'admin'
                            ? 'Masuk dengan email organisasi yang sudah didaftarkan oleh Superadmin.'
                            : 'Masuk untuk memastikan Anda mahasiswa UAJY. ID voting akan ditautkan ke akun ini.'}
                        </p>

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

                        {activationMode && activationContext === 'voter' && (
                          <form onSubmit={handleMagicLinkLogin} className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200">
                                <Mail className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-[13px] font-bold text-slate-900">Masuk dengan Link Email</h3>
                                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                                  Gunakan opsi ini untuk email undangan pemilih, termasuk email domain sendiri seperti <span className="font-semibold text-slate-700">@votein.biz.id</span>.
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                              <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="email pemilih"
                                disabled={magicLinkLoginMutation.isPending || Boolean(tokenPreviewQuery.data?.email)}
                                className="h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none transition focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                              />
                              <button
                                type="submit"
                                disabled={magicLinkLoginMutation.isPending || !email.trim() || tokenPreviewQuery.isLoading}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                              >
                                {magicLinkLoginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                Kirim Link Masuk
                              </button>
                            </div>

                            {magicLinkSentTo && (
                              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[12px] leading-5 text-emerald-700">
                                Link masuk sudah dikirim ke <span className="font-semibold">{magicLinkSentTo}</span>. Buka email tersebut, lalu klik link untuk kembali ke aktivasi.
                              </p>
                            )}
                          </form>
                        )}

                        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                          <div className="flex gap-3">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <Building2 className="h-3 w-3" />
                            </div>
                            <div className="space-y-3">
                              <h3 className="text-[13px] font-bold text-blue-900">{activationContext === 'admin' ? 'Penting untuk Admin' : 'Penting untuk Pemilih'}</h3>
                              <p className="text-[12px] leading-5 text-blue-800/80">
                                {activationContext === 'admin'
                                  ? 'Gunakan email yang sama dengan undangan Superadmin. ID voting akan menjadi identitas Anda di dashboard admin.'
                                  : <>ID voting akan ditautkan permanen ke akun <span className="font-bold">@students.uajy.ac.id</span> Anda. Satu ID voting untuk satu mahasiswa.</>}
                              </p>
                              <div className="rounded-lg bg-white/60 p-3 text-[11px] leading-relaxed text-blue-900/70 border border-blue-100/50">
                                <span className="font-bold text-blue-900 block mb-1">Tips:</span>
                                  {activationContext === 'admin'
                                    ? 'Pastikan email yang Anda gunakan sama dengan yang diundang Superadmin.'
                                    : 'Gunakan email mahasiswa UAJY saat membuat ID voting agar sinkron dengan sistem.'}
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

                    {/* ponytail: tampilkan connect wallet SETELAH SSO login berhasil */}
                    {((!isAdminActivationFlow && !isVoterSsoFirstFlow && authSession && !isConnected) || (isAdminActivationFlow && authSession && !isConnected) || (isVoterSsoFirstFlow && !isConnected)) && (
                      <div className="mt-8 w-full">
                        <h2 className="text-[20px] font-semibold text-slate-900">
                          {isAdminActivationFlow
                            ? 'Tahap 2 — ID Voting'
                            : isReturningVoter
                              ? 'Buat/Masukan ID Voting'
                              : activationMode
                                ? isVoterSsoFirstFlow ? 'Tahap 2 — ID Voting' : 'Tahap 2 — ID Voting'
                                : 'Tahap 2 — ID Voting'}
                        </h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {isReturningVoter
                            ? 'ID voting Anda sudah terdaftar. Sambungkan dompet digital untuk melanjutkan masuk.'
                            : activationMode
                              ? activationContext === 'admin'
                                ? 'Buat ID voting untuk mengelola pemilihan organisasi Anda.'
                                : 'Buat ID voting untuk mulai memilih. Gratis, tanpa biaya apapun.'
                              : 'Buat ID voting untuk membuktikan identitas Anda di sistem pemilihan.'}
                        </p>

                        {activationMode && (
                          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">{activationContext === 'admin' ? 'Cara Aktivasi Admin' : 'Cara Aktivasi Pemilih'}</p>
                            <div className="mt-3 space-y-2 text-[13px] leading-6 text-blue-900/80">
                              {isVoterSsoFirstFlow ? (
                                <>
                                  <p><strong>Tahap 1.</strong> Verifikasi akun kampus sudah selesai.</p>
                                  <p><strong>Tahap 2.</strong> Buat ID voting, lalu aktifkan hak suara.</p>
                                </>
                              ) : (
                                <>
                                  <p><strong>Tahap 1.</strong> {activationContext === 'admin' ? 'Masuk dengan email organisasi yang sudah didaftarkan.' : 'Masuk dengan akun kampus untuk verifikasi identitas.'}</p>
                                  <p><strong>Tahap 2.</strong> {activationContext === 'admin' ? 'Buat ID voting untuk mengelola pemilihan.' : 'Buat ID voting untuk mulai memilih.'}</p>
                                  <p><strong>Tahap 3.</strong> {activationContext === 'admin' ? 'Aktifkan akses admin' : 'Aktifkan hak suara'} dengan menautkan akun kampus dan ID voting.</p>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Akun Kampus</p>
                          <p className="mt-1 truncate text-[13px] font-semibold text-slate-900" title={authSession?.user?.email}>{authSession?.user?.email}</p>
                        </div>

                        <div className="mt-8 space-y-4">
                          {isReturningVoter ? [
                            'ID voting Anda sudah terdaftar di sistem.',
                            'Cukup sambungkan dompet dan masuk dengan akun kampus.',
                            'Tidak perlu membuat ID voting lagi.',
                          ].map((item) => (
                            <div key={item} className="flex items-center gap-3 text-[13px] text-slate-600">
                              <span className="h-3 w-3 rounded-full border-2 border-blue-500 bg-blue-50" />
                              {item}
                            </div>
                          )) : [
                            'ID voting dibuat otomatis — tidak perlu install aplikasi tambahan.',
                            'Tidak ada biaya apapun, gratis seluruhnya.',
                            activationContext === 'admin' ? 'Anda perlu email kampus dan ID voting yang cocok.' : 'Pilihan Anda tetap terjaga sampai fase reveal.',
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
                              <p className="text-[12px] font-semibold">Jika muncul dialog konfirmasi</p>
                              <p className="mt-1 text-[12px] leading-5 text-amber-800">
                                Itu adalah permintaan izin untuk membuat ID voting. Klik tombol konfirmasi pada dialog tersebut untuk melanjutkan. Jika tidak sengaja tertutup, klik tombol sambungkan lagi.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}


                    {isConnected && authSession && !isWalletBound && (
                      <div className="mt-8 w-full">
                          <h2 className="text-[20px] font-semibold text-slate-900">{activationMode ? `Tahap ${isVoterSsoFirstFlow ? 2 : 3} — ${activationContext === 'admin' ? 'Aktifkan Akses Admin' : 'Aktifkan Hak Suara'}` : 'Aktifkan Hak Suara'}</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationContext === 'admin'
                            ? 'Tautkan akun kampus dan ID voting untuk mengaktifkan akses admin.'
                            : 'Tautkan akun kampus dan ID voting untuk mengaktifkan hak suara.'}
                        </p>

                        <div className="mt-6 space-y-3">
                          {bindingBlocked && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                              <p className="text-[12px] font-semibold text-red-700">ID voting dan akun tidak cocok</p>
                              <p className="mt-2 text-[12px] leading-5 text-red-600">{bindingBlockMessage}</p>
                              <button
                                type="button"
                                onClick={() => disconnect()}
                                className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-white px-3 text-[12px] font-semibold text-red-700 transition-colors hover:bg-red-50"
                              >
                                Putuskan & Ganti ID Voting
                              </button>
                            </div>
                          )}

                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">ID Voting</p>
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
                            : 'ID voting sudah aktif. Anda akan diarahkan ke halaman pemilih...'}
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

                    {/* ponytail: SSO-first — tampilkan tombol connect wallet hanya setelah SSO login */}
                    {!isConnected && authSession && !isWalletBound && (
                      <button
                        type="button"
                        onClick={handleConnectWallet}
                        disabled={isConnectPending}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                      >
                        {isConnectPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Buat/Masukan ID Voting
                        {!isConnectPending ? <ChevronRight className="h-4 w-4" /> : null}
                      </button>
                    )}

                    {!isConnected && !authSession && !authSessionQuery.isLoading && (
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
