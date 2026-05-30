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
} from 'lucide-react'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { useAccount, useDisconnect } from 'wagmi'
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
  if (redirectParam?.startsWith('/')) return redirectParam
  return '/pemilih'
}

function ConnectWalletContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { address, isConnected } = useAccount()
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

  const authSession = authSessionQuery.data
  const currentProfile = currentProfileQuery.data
  const connectedWalletProfile = connectedWalletProfileQuery.data
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
    ? '1. Sambungkan dompet digital'
    : !authSession
      ? '2. Masuk dengan akun kampus'
      : !isWalletBound
        ? '3. Aktifkan hak suara'
        : 'Selesai, akses siap'

  // Auto-redirect if everything is ready
  useEffect(() => {
    if (mounted && currentProfile) {
      if (currentProfile.role === 'super_admin' || currentProfile.role === 'admin') {
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
  }, [mounted, isConnected, authSession, isWalletBound, router, redirectTarget, currentProfile])

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
          showToast({ tone: 'success', title: 'Akses Berhasil Diaktifkan', description: 'Dompet digital dan akun kampus sudah terhubung.' })
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

        <div className="relative z-10 w-full max-w-[1040px] px-2 sm:px-0">
          <ScrollReveal variant="fade-up">
            <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Link href="/" aria-label="Tutup dan kembali ke beranda" className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-900">
                <X className="h-4 w-4" />
              </Link>

              <div className="grid max-h-[84vh] overflow-y-auto xl:grid-cols-[0.44fr_0.56fr]">
                <aside className="border-b border-slate-100 bg-white p-6 xl:border-b-0 xl:border-r xl:p-8">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <Link href="/" className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-900">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Beranda
                      </Link>
                      <h1 className="text-[24px] font-semibold leading-tight text-slate-900">Masuk ke Votein</h1>
                      <p className="mt-1 text-[13px] leading-6 text-slate-400">
                        Ikuti 3 langkah pendek. Untuk mulai menggunakan Votein.
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
                        <h2 className="text-[14px] font-semibold text-slate-900">Sambungkan dompet digital</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isConnected ? 'Dompet sudah tersambung.' : 'Dompet digital dipakai seperti kartu anggota untuk mengenali kamu.'}
                        </p>
                      </div>
                      {!isConnected && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${isConnected && !authSession ? 'bg-slate-100' : 'bg-white'} ${!isConnected ? 'opacity-50' : ''}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${authSession ? 'bg-emerald-50 text-emerald-600' : isConnected ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {authSession ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={isConnected ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>Masuk dengan akun kampus</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {authSession ? 'Akun kampus sudah dikenali.' : 'Ini memastikan yang masuk benar-benar mahasiswa UAJY.'}
                        </p>
                      </div>
                      {isConnected && !authSession && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${isConnected && authSession && !isWalletBound ? 'bg-slate-100' : 'bg-white'} ${!isConnected || !authSession ? 'opacity-50' : ''}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isWalletBound ? 'bg-emerald-50 text-emerald-600' : isConnected && authSession ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {isWalletBound ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={isConnected && authSession ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>Aktifkan hak suara</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isWalletBound ? 'Akses memilih sudah siap.' : 'Hubungkan akun kampus dan dompet supaya kamu bisa memilih.'}
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
                        <h2 className="text-[20px] font-semibold text-slate-900">Sambungkan dompet digital</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          Dompet digital itu seperti kartu pengenal untuk voting. Klik tombol sambungkan, lalu setujui dari aplikasi dompet yang muncul.
                        </p>

                        <div className="mt-8 space-y-4">
                          {[
                            'Kalau belum punya, aplikasi biasanya membantu membuat dompet baru.',
                            'Pakai dompet yang sama sampai proses memilih selesai.',
                            'Jangan berikan akses dompet ke orang lain, sama seperti jangan memberi password.',
                          ].map((item) => (
                            <div key={item} className="flex items-center gap-3 text-[13px] text-slate-600">
                              <span className="h-3 w-3 rounded-full border-2 border-blue-500 bg-blue-50" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isConnected && !authSession && (
                      <div className="mt-8 w-full">
                        <h2 className="text-[20px] font-semibold text-slate-900">Masuk dengan akun kampus</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          Setelah dompet tersambung, masuk dengan akun kampus. Ini membantu sistem memastikan hak pilih diberikan ke mahasiswa yang benar.
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
                              <h3 className="text-[13px] font-bold text-blue-900">Penting untuk Pemilih</h3>
                              <p className="text-[12px] leading-5 text-blue-800/80">
                                Alamat dompet digital yang Anda gunakan akan ditautkan secara permanen dengan akun <span className="font-bold">@students.uajy.ac.id</span> Anda. Satu alamat dompet hanya untuk satu akun mahasiswa.
                              </p>
                              <div className="rounded-lg bg-white/60 p-3 text-[11px] leading-relaxed text-blue-900/70 border border-blue-100/50">
                                <span className="font-bold text-blue-900 block mb-1">Tips:</span>
                                Jika Anda baru membuat dompet digital, kami sarankan untuk menggunakan email mahasiswa UAJY Anda saat pendaftaran dompet agar sinkron dengan sistem Votein UAJY.
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
                          <h2 className="text-[20px] font-semibold text-slate-900">Aktifkan hak suara</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          Tinggal satu klik lagi. Kami akan memasangkan akun kampus dengan dompet digitalmu supaya hak memilih aktif.
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
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Dompet digital</p>
                            <WalletAddress
                              address={address ?? '-'}
                              className="mt-1 block font-mono text-[12px] font-semibold text-slate-900"
                            />
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Akun Mahasiswa</p>
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
                        <h2 className="mt-6 text-[20px] font-semibold text-slate-900">Akses siap digunakan</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">Sebentar lagi kamu diarahkan ke halaman pemilihan...</p>
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
                      <ConnectWallet className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B]">
                        Sambungkan Dompet Digital
                        <ChevronRight className="h-4 w-4" />
                      </ConnectWallet>
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
                        Aktifkan Hak Suara
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
