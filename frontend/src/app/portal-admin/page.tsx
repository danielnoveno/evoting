'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  Check,
  Wallet as WalletIcon,
  Loader2,
  ChevronRight,
  Link2,
  Building2,
  ArrowLeft,
  X,
  Copy,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useMicrosoftCampusLogin, useGoogleLogin } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile, useProfileByWallet } from '@/hooks/use-profile'
import { ScrollReveal } from '@/components/public/parallax'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { WalletAddress } from '@/components/ui/wallet-address'
import { AuthSuccessRedirectModal } from '@/components/auth/auth-success-redirect-modal'
import { sameWalletAddress } from '@/lib/repositories/helpers'

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

function safeInternalPath(value: string | null, fallback: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
  try {
    const parsed = new URL(value, 'https://votechain.local')
    if (parsed.origin !== 'https://votechain.local') return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

function resolveSuperadminRedirectTarget(redirectParam: string | null) {
  const safeRedirect = safeInternalPath(redirectParam, '/superadmin')
  return safeRedirect.startsWith('/superadmin') ? safeRedirect : '/superadmin'
}

function PortalAdminContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnectPending } = useConnect()
  const { disconnect } = useDisconnect()
  const authSessionQuery = useAuthSession()
  const currentProfileQuery = useCurrentProfile()
  const connectedWalletProfileQuery = useProfileByWallet(address)
  const bindWalletMutation = useBindCurrentWallet()
  const microsoftLoginMutation = useMicrosoftCampusLogin()
  const googleLoginMutation = useGoogleLogin()

  const [mounted, setMounted] = useState(false)
  const [formError, setFormError] = useState('')
  const [bindError, setBindError] = useState('')
  const [sessionTimeout, setSessionTimeout] = useState(false)
  const [redirectState, setRedirectState] = useState<{
    target: string
    label: string
    description: string
  } | null>(null)
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
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  // Portal-admin is superadmin/TU only. Redirect admin organisasi away.
  useEffect(() => {
    if (!mounted || !currentProfileQuery.data) return
    const role = currentProfileQuery.data.role
    if (role === 'admin') {
      router.replace('/hubungkan-dompet?activate=admin')
    } else if (role === 'voter') {
      router.replace('/hubungkan-dompet')
    }
  }, [mounted, currentProfileQuery.data, router])

  useEffect(() => {
    if (!mounted) return
    const authError = searchParams.get('authError')
    if (!authError) return

    if (authError === 'admin_pending') {
      setFormError('Undangan masih pending. Minta pengelola platform mengaktifkan undangan terlebih dahulu.')
    } else if (authError === 'activation_required') {
      setFormError('Akun ini belum memiliki undangan aktif. Gunakan email yang didaftarkan oleh pengelola platform.')
    } else if (authError === 'registry_unavailable') {
      setFormError('Data aktivasi belum bisa diperiksa. Coba lagi beberapa saat atau hubungi pengelola platform.')
    } else if (authError === 'profile_unavailable') {
      setFormError('Profil belum bisa dibaca. Jika database baru di-reset, keluar lalu masuk ulang atau aktivasi ulang.')
    } else if (authError === 'oauth_exchange_failed') {
      setFormError('Gagal verifikasi akun. Pastikan akun yang dipakai sesuai undangan.')
    } else {
      setFormError('Sesi tidak bisa divalidasi. Coba keluar, muat ulang halaman, lalu masuk kembali.')
    }
  }, [mounted, searchParams])

  useEffect(() => {
    if (!mounted || !currentProfileQuery.error) return
    setFormError(getRepositoryErrorMessage(currentProfileQuery.error, 'Profil belum bisa dimuat. Coba masuk ulang atau hubungi pengelola platform.'))
  }, [mounted, currentProfileQuery.error])

  const authSession = authSessionQuery.data
  const currentProfile = currentProfileQuery.data
  const requestedRedirect = safeInternalPath(searchParams.get('redirect'), '/superadmin')
  const activationToken = searchParams.get('token')?.trim() ?? ''
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
    ? `Akun ${authSession?.user?.email ?? 'ini'} sudah tertaut ke wallet lain. Putuskan dompet tersambung, lalu sambungkan wallet yang sesuai untuk masuk.`
    : connectedWalletOwnedByOther
      ? `Wallet tersambung sudah tertaut ke akun ${connectedWalletProfile?.email ?? 'kampus lain'}. Putuskan dompet tersambung, lalu pilih wallet yang sesuai.`
      : ''
  const isAdminAccessValidated = Boolean(authSession && isWalletBound)
  const completedSteps = (authSession ? 1 : 0) + (isAdminAccessValidated ? 1 : 0)
  const currentStepLabel = !authSession ? 'Verifikasi admin' : !isConnected ? 'Sambungkan dompet digital' : !isWalletBound ? 'Validasi otoritas' : 'Akses siap'

  // Auto-bind if both are ready but not yet bound
  useEffect(() => {
    if (mounted && isConnected && authSession && !isWalletBound && !bindWalletMutation.isPending && !bindWalletMutation.isSuccess && !bindError && !bindingBlocked) {
      handleBind()
    }
  }, [mounted, isConnected, authSession, isWalletBound, bindWalletMutation.isPending, bindWalletMutation.isSuccess, bindError, bindingBlocked])

  // Redirect after successful bind (superadmin only)
  useEffect(() => {
    if (mounted && isConnected && authSession && isWalletBound) {
      if (currentProfile?.role === 'super_admin') {
        if (redirectStartedRef.current) return
        redirectStartedRef.current = true
        const redirectTarget = resolveSuperadminRedirectTarget(searchParams.get('redirect'))
        setRedirectState({
          target: redirectTarget,
          label: 'Dashboard Superadmin',
          description: 'Akses Superadmin berhasil divalidasi. Anda akan diarahkan ke dashboard pengelolaan platform.',
        })
        showToast({ tone: 'success', title: 'Akses Diterima', description: 'Selamat datang di Portal Tata Usaha.' })
        redirectTimerRef.current = window.setTimeout(() => {
          router.replace(redirectTarget)
        }, 2200)
      }
    }
  }, [mounted, isConnected, authSession, isWalletBound, currentProfile?.role, router, searchParams, showToast])

  const handleConnectWallet = async () => {
    setFormError('')
    try {
      const connector = connectors.find((c) => c.id === 'baseAccount') || connectors[0]
      if (connector) {
        connect({ connector }, { onError: (err) => setFormError(getWalletConnectionErrorMessage(err)) })
      }
    } catch (err: any) {
      setFormError(getWalletConnectionErrorMessage(err))
    }
  }

  const handleMicrosoftLogin = async () => {
    setFormError('')
    microsoftLoginMutation.mutate({ nextPath: `/portal-admin?redirect=${encodeURIComponent(requestedRedirect)}` })
  }

  const handleGoogleLogin = async () => {
    setFormError('')
    googleLoginMutation.mutate({ nextPath: `/portal-admin?redirect=${encodeURIComponent(requestedRedirect)}` })
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
        displayName: authSession.user.user_metadata?.full_name || authSession.user.user_metadata?.name || 'Administrator',
        roleHint: 'admin-activation',
        activationToken: activationToken || undefined,
      },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Akses Berhasil Diaktifkan', description: 'Dompet digital dan akun kampus sudah sesuai.' })
          void currentProfileQuery.refetch()
        },
        onError: (err) => {
          const message = getRepositoryErrorMessage(err, 'Gagal menautkan wallet.')
          setBindError(message)
          showToast({ tone: 'error', title: 'Validasi Gagal', description: message })
        }
      }
    )
  }

  if (!mounted) return null

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 pb-10">
      <PublicNavbar activePath="/portal-admin" minimal />
       
      <div className="relative flex flex-1 items-center justify-center p-4 md:p-8">
        <ScrollReveal variant="fade-up" duration={800} className="relative z-10 w-full max-w-[1040px]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white xl:grid xl:grid-cols-[380px_1fr]">
            <aside className="relative hidden flex-col justify-between bg-slate-50/50 p-8 xl:flex">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link href="/" className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-900">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Kembali ke Beranda
                    </Link>
                    <h1 className="text-[24px] font-semibold leading-tight text-slate-900">Portal Tata Usaha</h1>
                    <p className="mt-1 text-[13px] leading-6 text-slate-400">
                      Akses pengelola platform dan superadmin.
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
                        strokeDasharray={`${completedSteps * 50} 100`}
                        className="text-emerald-500"
                      />
                    </svg>
                    <span className="absolute text-[13px] font-semibold text-slate-700">{completedSteps}/2</span>
                  </div>
                </div>

                <div className="relative mt-10 space-y-5">
                  <div className="absolute bottom-16 left-[18px] top-12 border-l border-dashed border-slate-300" aria-hidden="true" />

                  <div className={`relative flex items-center gap-4 rounded-lg p-4 ${!authSession ? 'bg-slate-100' : 'bg-white'}`}>
                    <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${authSession ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0F172A] text-white'}`}>
                      {authSession ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[14px] font-semibold text-slate-900">
                        Verifikasi Akun
                      </h2>
                      <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                        {authSession ? 'Akun institusi sudah masuk.' : 'Masuk dengan akun institusi untuk verifikasi.'}
                      </p>
                    </div>
                    {!authSession && <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </div>

                  <div className={`relative flex items-center gap-4 rounded-lg p-4 ${authSession && !isAdminAccessValidated ? 'bg-slate-100' : 'bg-white'} ${!authSession ? 'opacity-50' : ''}`}>
                    <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isAdminAccessValidated ? 'bg-emerald-50 text-emerald-600' : authSession ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {isAdminAccessValidated ? <Check className="h-4 w-4" /> : <WalletIcon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className={authSession ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>Sambungkan dompet digital</h2>
                      <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                        {isAdminAccessValidated ? 'Akses sudah tervalidasi.' : authSession ? 'Cocokkan dompet yang terdaftar.' : 'Dompet dicek setelah akun masuk.'}
                      </p>
                    </div>
                    {authSession && !isAdminAccessValidated && <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold">Gerbang Superadmin</h3>
                      <p className="text-[11px] text-slate-400">Verifikasi SSO dan wallet</p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <section className="flex min-h-[520px] flex-col justify-between bg-white p-6 xl:p-8">
              <div className="w-full">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{currentStepLabel}</p>

                {!authSession && (
                  <div className="mt-8 w-full">
                    <h2 className="text-[20px] font-semibold text-slate-900">Verifikasi Akun Institusi</h2>
                    <p className="mt-3 text-[13px] leading-6 text-slate-600">
                      Masuk dengan akun institusi untuk memverifikasi otoritas sebagai pengelola platform (Superadmin).
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
                        Masuk sebagai Staf Institusi
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
                          <h3 className="text-[13px] font-bold text-blue-900">Penting untuk Superadmin</h3>
                          <p className="text-[12px] leading-5 text-blue-800/80">
                            Akses portal ini memerlukan penautan antara akun institusi <span className="font-bold">@uajy.ac.id</span> dan alamat dompet digital yang sudah didaftarkan oleh pengelola platform.
                          </p>
                          <div className="rounded-lg bg-white/60 p-3 text-[11px] leading-relaxed text-blue-900/70 border border-blue-100/50">
                            <span className="font-bold text-blue-900 block mb-1">Catatan:</span>
                            Portal ini khusus untuk pengelola platform (Superadmin / Tata Usaha Fakultas). Admin organisasi silakan masuk melalui halaman Hubungkan Dompet.
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

                {authSession && !isConnected && (
                  <div className="mt-8 w-full">
                    <h2 className="text-[20px] font-semibold text-slate-900">Sambungkan Dompet Digital</h2>
                    <p className="mt-3 text-[13px] leading-6 text-slate-600">
                      Langkah kedua adalah menyambungkan dompet digital yang akan digunakan sebagai identitas administratif Anda. Dompet ini berfungsi untuk menandatangani aksi dan memvalidasi akses ke dashboard superadmin.
                    </p>

                    <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <ShieldCheck className="h-3 w-3" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-[13px] font-bold text-blue-900">Keamanan Administratif</h3>
                          <p className="text-[12px] leading-5 text-blue-800/80">
                            Akses ke panel pengelolaan memerlukan verifikasi dua lapis. Akun institusi memastikan identitas personal Anda, sementara dompet digital menjamin integritas aksi yang dilakukan pada blockchain.
                          </p>
                          <div className="rounded-lg bg-white/60 p-3 text-[11px] leading-relaxed text-blue-900/70 border border-blue-100/50">
                            <span className="font-bold text-blue-900 block mb-1">Penting:</span>
                            Pastikan Anda menggunakan dompet yang sama setiap kali masuk untuk menjaga konsistensi data audit.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 space-y-4">
                      {[
                        'Gunakan Smart Wallet (Coinbase Wallet) untuk pengalaman terbaik.',
                        'Dompet digital menyimpan kunci unik untuk mengakses data pemilihan.',
                        'Tidak ada biaya gas untuk proses masuk atau navigasi dashboard.',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-3 text-[13px] text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                          {item}
                        </div>
                      ))}
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
                    <h2 className="text-[20px] font-semibold text-slate-900">Validasi Otoritas</h2>
                    <p className="mt-3 text-[13px] leading-6 text-slate-600">
                      Pastikan dompet digital yang tersambung adalah dompet yang sudah terdaftar untuk akun kampus ini.
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
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Akun Kampus</p>
                        <p className="mt-1 truncate text-[13px] font-semibold text-slate-900" title={authSession.user?.email}>{authSession.user?.email}</p>
                      </div>

                      {connectedWalletOwnedByOther && connectedWalletProfile?.email && (
                        <div className="rounded-lg border border-slate-100 bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Pemilik wallet tersambung</p>
                          <p className="mt-1 truncate text-[13px] font-semibold text-slate-900" title={connectedWalletProfile.email}>{connectedWalletProfile.email}</p>
                        </div>
                      )}

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
                      {redirectState ? <Loader2 className="h-8 w-8 animate-spin" /> : <CheckCircle2 className="h-8 w-8" />}
                    </div>
                    <h2 className="mt-6 text-[20px] font-semibold text-slate-900">Akses Berhasil Divalidasi</h2>
                    <p className="mt-3 text-[13px] leading-6 text-slate-600">
                      {redirectState ? `Mengarahkan Anda ke ${redirectState.label.toLowerCase()}...` : 'Menyiapkan akses...'}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex w-full items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                {authSession && !isConnected && (
                  <button
                    type="button"
                    onClick={handleConnectWallet}
                    disabled={isConnectPending}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                  >
                    {isConnectPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Sambungkan Dompet Superadmin
                    {!isConnectPending ? <ChevronRight className="h-4 w-4" /> : null}
                  </button>
                )}

                {!authSession && (
                  <p className="text-right text-[12px] text-slate-400">Pilih salah satu metode masuk di atas.</p>
                )}

                {isConnected && authSession && !isWalletBound && (
                  <button
                    onClick={handleBind}
                    disabled={bindWalletMutation.isPending || bindingBlocked}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                  >
                    {bindWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Masuk Dashboard Superadmin
                  </button>
                )}

                {isConnected && authSession && isWalletBound && (
                  <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700">
                    {redirectState ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {redirectState ? 'Mengarahkan...' : 'Selesai'}
                  </span>
                )}
              </div>
            </section>
          </section>
        </ScrollReveal>

        {redirectState && (
          <AuthSuccessRedirectModal
            open
            description={redirectState.description}
            targetLabel={redirectState.label}
          />
        )}

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

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setSessionTimeout(false)
                    handleMicrosoftLogin()
                  }}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-[13px] font-semibold text-white transition hover:bg-slate-800"
                >
                  <svg className="h-4 w-4" viewBox="0 0 23 23" fill="none">
                    <path d="M0 0H11V11H0V0Z" fill="currentColor"/>
                    <path d="M12 0H23V11H12V0Z" fill="currentColor"/>
                    <path d="M0 12H11V23H0V12Z" fill="currentColor"/>
                    <path d="M12 12H23V23H12V12Z" fill="currentColor"/>
                  </svg>
                  Masuk dengan Microsoft SSO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSessionTimeout(false)
                    handleGoogleLogin()
                  }}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-[13px] font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" />
                  Masuk dengan Google
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <PublicFooter />
    </main>
  )
}

export default function PortalAdminPage() {
  return (
    <Suspense fallback={null}>
      <PortalAdminContent />
    </Suspense>
  )
}
