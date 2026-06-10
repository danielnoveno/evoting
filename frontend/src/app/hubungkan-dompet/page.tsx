'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
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
import { AuthField } from '@/components/auth/auth-shell'
import { useToast } from '@/components/ui/toast-provider'
import { authSessionQueryKey, useAuthSession, useMicrosoftCampusLogin, useGoogleLogin, useEmailPasswordLogin, useEmailPasswordSignUp } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile, useProfileByWallet } from '@/hooks/use-profile'
import { ScrollReveal, FloatingShape } from '@/components/public/parallax'
import { AsciiBackground } from '@/components/public/ascii-background'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { WalletAddress } from '@/components/ui/wallet-address'

function sameWalletAddress(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function resolveRedirectTarget(redirectParam: string | null) {
  if (redirectParam?.startsWith('/') && !redirectParam.startsWith('//')) return redirectParam
  return '/pemilih'
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
  const authSession = authSessionQuery.data
  const currentProfile = currentProfileQuery.data
  const connectedWalletProfile = connectedWalletProfileQuery.data

  // Determine context: prioritized by profile role if logged in, then URL param, then redirect hint
  const activationContext = useMemo((): 'admin' | 'voter' => {
    if (currentProfile?.role === 'admin' || currentProfile?.role === 'super_admin') return 'admin'
    if (activateParam === 'admin') return 'admin'
    if (redirectParam?.startsWith('/admin') || redirectParam?.startsWith('/superadmin') || redirectParam?.startsWith('/portal-admin')) return 'admin'
    return 'voter'
  }, [currentProfile?.role, activateParam, redirectParam])

  const activationMode = activateParam === '1' || activateParam === 'admin' || (Boolean(authSession) && activationContext === 'admin')
  const redirectTarget = useMemo(() => resolveRedirectTarget(redirectParam), [redirectParam])

  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [bindError, setBindError] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  useEffect(() => { setMounted(true) }, [])

  // Handle errors from URL parameters (e.g., after failed OAuth)
  useEffect(() => {
    if (!mounted) return
    const authError = searchParams.get('authError')
    if (authError) {
      if (authError === 'backend_not_configured') {
        setFormError('Sistem autentikasi belum siap. Hubungi admin.')
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
      }
    }
  }, [searchParams, mounted])

  const isWalletBound = sameWalletAddress(currentProfile?.walletAddress, address)
  const accountHasDifferentWallet = Boolean(address && currentProfile?.walletAddress && !isWalletBound)
  const connectedWalletOwnedByOther = Boolean(
    authSession?.user?.id &&
    connectedWalletProfile?.userId &&
    connectedWalletProfile.userId !== authSession.user.id,
  )
  const bindingBlocked = accountHasDifferentWallet || connectedWalletOwnedByOther
  const bindingBlockMessage = accountHasDifferentWallet
    ? `Akun ${authSession?.user?.email ?? 'ini'} sudah tertaut ke wallet lain. Putuskan dompet tersambung, lalu sambungkan wallet yang sesuai untuk melanjutkan.`
    : connectedWalletOwnedByOther
      ? `Wallet tersambung sudah tertaut ke akun ${connectedWalletProfile?.email ?? 'kampus lain'}. Putuskan dompet tersambung, lalu pilih wallet yang sesuai.`
      : ''
  const completedSteps = (isConnected ? 1 : 0) + (authSession ? 1 : 0) + (isWalletBound ? 1 : 0)
  const currentStepLabel = !isConnected
    ? activationMode ? `${activationContext === 'admin' ? 'Aktivasi admin' : 'Aktivasi voter'} · tahap 1 dari 3` : '1. Sambungkan Smart Wallet'
    : !authSession
      ? activationMode ? `${activationContext === 'admin' ? 'Aktivasi admin' : 'Aktivasi voter'} · tahap 2 dari 3` : '2. Masuk dengan akun kampus'
      : !isWalletBound
        ? activationMode ? `${activationContext === 'admin' ? 'Aktivasi admin' : 'Aktivasi voter'} · tahap 3 dari 3` : '3. Aktifkan hak suara'
        : activationMode ? `${activationContext === 'admin' ? 'Aktivasi admin' : 'Aktivasi voter'} selesai` : 'Selesai, akses siap'

  // Auto-bind if both are ready but not yet bound
  useEffect(() => {
    if (mounted && isConnected && authSession && !isWalletBound && !bindWalletMutation.isPending && !bindWalletMutation.isSuccess && !bindError && !bindingBlocked) {
      handleBind()
    }
  }, [mounted, isConnected, authSession, isWalletBound, bindWalletMutation.isPending, bindWalletMutation.isSuccess, bindError, bindingBlocked])

  // Auto-redirect if everything is ready
  useEffect(() => {
    if (mounted && currentProfile) {
      if (!redirectParam && (currentProfile.role === 'super_admin' || currentProfile.role === 'admin')) {
         router.replace('/portal-admin')
         return
      }
    }

    if (mounted && isConnected && authSession && isWalletBound) {
      const timer = setTimeout(() => {
         router.push(redirectTarget)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [mounted, isConnected, authSession, isWalletBound, router, redirectParam, redirectTarget, currentProfile])

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
        displayName: authSession.user.user_metadata?.full_name || authSession.user.user_metadata?.name || null
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
    microsoftLoginMutation.mutate({ nextPath: `/hubungkan-dompet?redirect=${encodeURIComponent(redirectTarget)}` })
  }

  const handleGoogleLogin = () => {
    googleLoginMutation.mutate({ nextPath: `/hubungkan-dompet?redirect=${encodeURIComponent(redirectTarget)}` })
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
    <main className="flex h-screen flex-col overflow-hidden bg-slate-50 pb-10">
      <PublicNavbar activePath="/hubungkan-dompet" minimal />
      
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 md:p-8">
        {/* Decorative Background Elements */}
        <AsciiBackground />
        
        <FloatingShape
          speed={-0.06}
          className="left-[-80px] top-[120px] h-[320px] w-[320px] rounded-full bg-gradient-to-br from-emerald-100/40 to-teal-50/20 blur-3xl"
        />
        <FloatingShape
          speed={0.04}
          className="right-[-60px] top-[60px] h-[260px] w-[260px] rounded-full bg-gradient-to-bl from-slate-100/60 to-blue-50/20 blur-3xl"
        />

        <div className="relative z-10 w-full max-w-[1100px] px-2 sm:px-0">
          <ScrollReveal variant="fade-up">
            <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Link href="/" aria-label="Tutup dan kembali ke beranda" className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-900">
                <X className="h-4 w-4" />
              </Link>

              <div className="grid max-h-[84vh] overflow-y-auto xl:grid-cols-[0.5fr_0.5fr]">
                <aside className="border-b border-slate-100 bg-white p-6 xl:border-b-0 xl:border-r xl:p-8">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <Link href="/" className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-900">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Beranda
                      </Link>
                      <h1 className="text-[24px] font-semibold leading-tight text-slate-900">
                        {activationMode
                          ? activationContext === 'admin' ? 'Aktivasi Akses Admin Organisasi' : 'Aktivasi Hak Suara Voter'
                          : 'Masuk ke Votein'}
                      </h1>
                      <p className="mt-1 text-[13px] leading-6 text-slate-400">
                        {activationMode
                          ? activationContext === 'admin'
                            ? 'Selamat datang, Admin! Ikuti 3 tahap verifikasi untuk membuka akses ke dashboard pengelolaan organisasi Anda.'
                            : 'Ikuti 3 tahap aktivasi singkat untuk membuka akses memilih di Votein.'
                          : 'Ikuti 3 langkah pendek. Untuk mulai menggunakan Votein.'}
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
                          strokeDasharray={`${completedSteps * 33.34} 100`}
                          className="text-emerald-500"
                        />
                      </svg>
                      <span className="absolute text-[13px] font-semibold text-slate-700">{completedSteps}/3</span>
                    </div>
                  </div>

                  <div className="relative mt-10 space-y-5">
                    <div className="absolute bottom-16 left-[18px] top-12 border-l border-dashed border-slate-300" aria-hidden="true" />

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${!isConnected ? 'bg-slate-100' : 'bg-white'}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0F172A] text-white'}`}>
                        {isConnected ? <Check className="h-4 w-4" /> : <WalletIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[14px] font-semibold text-slate-900">Sambungkan Smart Wallet</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isConnected ? 'Smart Wallet sudah tersambung.' : activationContext === 'admin' ? 'Gunakan Smart Wallet sebagai kunci digital administratif Anda.' : 'Smart Wallet dipakai sebagai identitas digital yang aman dan mudah.'}
                        </p>
                      </div>
                      {!isConnected && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${isConnected && !authSession ? 'bg-slate-100' : 'bg-white'} ${!isConnected ? 'opacity-50' : ''}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${authSession ? 'bg-emerald-50 text-emerald-600' : isConnected ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {authSession ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={isConnected ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>Verifikasi Akun Kampus</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {authSession ? 'Identitas kampus sudah diverifikasi.' : activationContext === 'admin' ? 'Masuk dengan email yang didaftarkan sebagai Admin Organisasi.' : 'Ini memastikan yang masuk benar-benar mahasiswa UAJY.'}
                        </p>
                      </div>
                      {isConnected && !authSession && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${isConnected && authSession && !isWalletBound ? 'bg-slate-100' : 'bg-white'} ${!isConnected || !authSession ? 'opacity-50' : ''}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isWalletBound ? 'bg-emerald-50 text-emerald-600' : isConnected && authSession ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {isWalletBound ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={isConnected && authSession ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>{activationContext === 'admin' ? 'Finalisasi Akses Admin' : 'Aktifkan hak suara'}</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isWalletBound ? activationContext === 'admin' ? 'Akses dashboard admin sudah aktif.' : 'Akses memilih sudah siap.' : activationContext === 'admin' ? 'Tautkan akun kampus dengan dompet untuk mengaktifkan wewenang admin.' : 'Hubungkan akun kampus dan dompet supaya kamu bisa memilih.'}
                        </p>
                      </div>
                      {isConnected && authSession && !isWalletBound && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                </aside>

                <section className="flex min-h-[520px] flex-col justify-between bg-white p-6 xl:p-8">
                  <div className="w-full">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{currentStepLabel}</p>

                    {!isConnected && (
                      <div className="mt-8 w-full">
                        <h2 className="text-[20px] font-semibold text-slate-900">{activationMode ? 'Tahap 1 — Sambungkan Smart Wallet' : 'Sambungkan Smart Wallet'}</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationMode
                            ? activationContext === 'admin'
                              ? 'Langkah awal untuk mengelola pemilihan organisasi adalah dengan menyambungkan Smart Wallet. Dompet ini akan menjadi identitas administratif Anda di blockchain.'
                              : 'Mulai aktivasi dengan menyambungkan Smart Wallet. Teknologi ini memungkinkan Anda memiliki Smart Wallet aman tanpa perlu memasang ekstensi atau menyimpan seed phrase yang rumit.'
                            : 'Votein menggunakan teknologi Smart Wallet (Akun Pintar) untuk memudahkan Anda. Cukup sambungkan, dan sistem akan mengenali identitas digital Anda secara otomatis.'}
                        </p>

                        {activationMode && (
                          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">{activationContext === 'admin' ? 'Model Aktivasi Admin' : 'Model Aktivasi Pemilih'}</p>
                            <div className="mt-3 space-y-2 text-[13px] leading-6 text-blue-900/80">
                              <p><strong>Tahap 1.</strong> Sambungkan Smart Wallet yang akan dipakai sampai voting selesai.</p>
                              <p><strong>Tahap 2.</strong> Verifikasi akun kampus UAJY agar sistem mengenali identitas {activationContext === 'admin' ? 'admin' : 'pemilih'}.</p>
                              <p><strong>Tahap 3.</strong> {activationContext === 'admin' ? 'Aktifkan akses admin' : 'Aktifkan hak suara'} dengan menautkan akun kampus dan Smart Wallet.</p>
                            </div>
                          </div>
                        )}

                        <div className="mt-8 space-y-4">
                          {[
                            'Smart Wallet dapat dibuat secara instan hanya dengan biometrik atau passkey ponsel Anda.',
                            'Tidak perlu biaya gas untuk pendaftaran dompet di jaringan Base Sepolia.',
                            'Keamanan tingkat tinggi yang menjaga privasi pilihan suara Anda tetap terenkripsi.',
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

                    {isConnected && !authSession && (
                      <div className="mt-8 w-full">
                        <h2 className="text-[20px] font-semibold text-slate-900">{activationMode ? 'Tahap 2 — Verifikasi akun kampus' : 'Masuk dengan akun kampus'}</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationContext === 'admin'
                            ? 'Setelah dompet tersambung, silakan masuk dengan email organisasi/kampus yang sudah didaftarkan oleh Superadmin sebagai pengelola.'
                            : 'Setelah dompet tersambung, masuk dengan akun kampus. Ini membantu sistem memastikan hak pilih diberikan ke mahasiswa yang benar.'}
                        </p>

                        <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
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
                        </div>

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
                              <h3 className="text-[13px] font-bold text-blue-900">{activationContext === 'admin' ? 'Penting untuk Admin Organisasi' : 'Penting untuk Pemilih'}</h3>
                              <p className="text-[12px] leading-5 text-blue-800/80">
                                {activationContext === 'admin'
                                  ? 'Alamat Smart Wallet ini akan menjadi identitas resmi Anda untuk mengelola data pemilihan pada jaringan blockchain. Pastikan dompet ini aman dan hanya Anda yang memiliki akses.'
                                  : <>Alamat Smart Wallet yang Anda gunakan akan ditautkan secara permanen dengan akun <span className="font-bold">@students.uajy.ac.id</span> Anda. Satu alamat dompet hanya untuk satu akun mahasiswa.</>}
                              </p>
                              <div className="rounded-lg bg-white/60 p-3 text-[11px] leading-relaxed text-blue-900/70 border border-blue-100/50">
                                <span className="font-bold text-blue-900 block mb-1">Tips:</span>
                                  {activationContext === 'admin'
                                    ? 'Pastikan Anda menggunakan email yang sama dengan undangan yang dikirimkan oleh Superadmin.'
                                    : 'Jika Anda baru membuat Smart Wallet, kami sarankan untuk menggunakan email mahasiswa UAJY Anda saat pendaftaran dompet agar sinkron dengan sistem Votein UAJY.'}
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
                          <h2 className="text-[20px] font-semibold text-slate-900">{activationMode ? `Tahap 3 — ${activationContext === 'admin' ? 'Finalisasi Akses Admin' : 'Aktifkan hak suara'}` : activationContext === 'admin' ? 'Finalisasi Akses Admin' : 'Aktifkan hak suara'}</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationContext === 'admin'
                            ? 'Satu langkah terakhir. Kami akan menautkan identitas kampus Anda dengan Smart Wallet ini untuk mengaktifkan wewenang penuh di Dashboard Admin.'
                            : 'Tinggal satu klik lagi. Kami akan memasangkan akun kampus dengan Smart Walletmu supaya hak memilih aktif.'}
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
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{activationContext === 'admin' ? 'Akun Admin Organisasi' : 'Akun Mahasiswa'}</p>
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
                          {activationContext === 'admin' ? 'Akses Admin Aktif' : 'Akses siap digunakan'}
                        </h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          {activationContext === 'admin' 
                            ? 'Selamat! Anda sekarang memiliki akses penuh untuk mengelola pemilihan organisasi.'
                            : 'Sebentar lagi kamu diarahkan ke halaman tujuan...'}
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

                    {!isConnected && (
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

                    {isConnected && !authSession && (
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
