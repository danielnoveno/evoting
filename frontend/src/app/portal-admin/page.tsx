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
  Mail,
  RefreshCw,
  X,
  Copy,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { AuthField } from '@/components/auth/auth-shell'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useMicrosoftCampusLogin, useGoogleLogin, useEmailPasswordLogin, useResetPassword } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile, useProfileByWallet } from '@/hooks/use-profile'
import { ScrollReveal, FloatingShape } from '@/components/public/parallax'
import { AsciiBackground } from '@/components/public/ascii-background'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { WalletAddress } from '@/components/ui/wallet-address'
import { useActivateAdminInvite, useAdminInvitePreview } from '@/hooks/use-admin-invite'

function sameWalletAddress(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false
  return left.trim().toLowerCase() === right.trim().toLowerCase()
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
  const emailLoginMutation = useEmailPasswordLogin()
  const resetPasswordMutation = useResetPassword()
  const inviteToken = searchParams.get('invite')?.trim() ?? ''
  const invitePreviewQuery = useAdminInvitePreview(inviteToken)
  const activateInviteMutation = useActivateAdminInvite()

  const handleResetConnection = () => {
    disconnect()
    try {
      localStorage.removeItem('wagmi.store')
      localStorage.removeItem('wagmi.recentConnectorId')
      localStorage.removeItem('wagmi.connected')
      localStorage.removeItem('wagmi.walletProgress')
    } catch (e) {
      console.error('Failed to clear wagmi storage', e)
    }
    window.location.reload()
  }

  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activationPassword, setActivationPassword] = useState('')
  const [activationPasswordConfirm, setActivationPasswordConfirm] = useState('')
  const [formError, setFormError] = useState('')
  const [activationError, setActivationError] = useState('')
  const [bindError, setBindError] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'forgot'>('login')
  const [redirectState, setRedirectState] = useState<{
    target: string
    label: string
    description: string
  } | null>(null)
  const redirectStartedRef = useRef(false)
  const redirectTimerRef = useRef<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  const authSession = authSessionQuery.data
  const currentProfile = currentProfileQuery.data
  const connectedWalletProfile = connectedWalletProfileQuery.data
  const invitePreview = invitePreviewQuery.data
  const isInviteActivationMode = Boolean(inviteToken)
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
  const currentStepLabel = isInviteActivationMode ? 'Aktivasi akun' : !authSession ? 'Verifikasi admin' : !isConnected ? 'Sambungkan dompet digital' : !isWalletBound ? 'Validasi otoritas' : 'Akses siap'

  useEffect(() => {
    if (invitePreview?.email && !authSession) {
      setEmail(invitePreview.email)
    }
  }, [invitePreview?.email, authSession])

  useEffect(() => {
    // Jangan redirect jika sedang dalam mode aktivasi (ada invite token)
    if (mounted && !inviteToken && isConnected && authSession && isWalletBound) {
      if (currentProfile?.role === 'super_admin') {
        if (redirectStartedRef.current) return
        redirectStartedRef.current = true
        setRedirectState({
          target: '/superadmin',
          label: 'Portal Utama Admin',
          description: 'Akses berhasil divalidasi. Anda akan diarahkan ke portal utama admin.',
        })
        showToast({ tone: 'success', title: 'Akses Diterima', description: 'Selamat datang di Portal Utama Admin.' })
        redirectTimerRef.current = window.setTimeout(() => {
          router.push('/superadmin')
        }, 900)
      } else if (currentProfile?.role === 'admin') {
        if (redirectStartedRef.current) return
        redirectStartedRef.current = true
        setRedirectState({
          target: '/admin',
          label: 'Dashboard Admin',
          description: 'Akses berhasil divalidasi. Anda akan diarahkan ke dashboard admin.',
        })
        showToast({ tone: 'success', title: 'Akses Diterima', description: 'Selamat datang di Dashboard Admin.' })
        redirectTimerRef.current = window.setTimeout(() => {
          router.push('/admin')
        }, 900)
      } else {
        showToast({ tone: 'error', title: 'Akses Ditolak', description: 'Akun Anda tidak memiliki otoritas Administrator Kampus.' })
        disconnect()
      }
    }
  }, [mounted, isConnected, authSession, isWalletBound, currentProfile, router, disconnect, showToast])

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
        displayName: authSession.user.user_metadata?.full_name || authSession.user.user_metadata?.name || 'Administrator'
      },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Akses Berhasil Diaktifkan', description: 'Dompet digital dan akun kampus sudah sesuai.' })
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
    microsoftLoginMutation.mutate({ nextPath: '/portal-admin' })
  }

  const handleGoogleLogin = () => {
    googleLoginMutation.mutate({ nextPath: '/portal-admin' })
  }

  const handleEmailAuth = (e: React.FormEvent) => {
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
    } else if (authMode === 'forgot') {
      resetPasswordMutation.mutate(email, {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Email Terkirim', description: 'Instruksi reset password telah dikirim ke email Anda.' })
          setAuthMode('login')
        },
        onError: (err) => {
          setFormError(getRepositoryErrorMessage(err))
        }
      })
    }
  }

  const handleConnectWallet = () => {
    const connector = connectors.find((item) => item.id === 'baseAccount') ?? connectors[0]
    if (!connector) {
      showToast({
        tone: 'error',
        title: 'Dompet admin belum siap',
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
            title: 'Gagal menyambungkan dompet admin',
            description: getWalletConnectionErrorMessage(error),
          })
        },
      },
    )
  }

  const handleActivateInvite = (event: React.FormEvent) => {
    event.preventDefault()
    setActivationError('')

    if (!invitePreview) {
      setActivationError('Undangan belum dapat divalidasi. Muat ulang halaman atau minta link baru.')
      return
    }

    if (activationPassword.length < 8) {
      setActivationError('Password minimal 8 karakter.')
      return
    }

    if (activationPassword !== activationPasswordConfirm) {
      setActivationError('Konfirmasi password belum sama.')
      return
    }

    activateInviteMutation.mutate(
      { token: inviteToken, password: activationPassword },
      {
        onSuccess: (result) => {
          showToast({ tone: 'success', title: 'Akun Diaktifkan', description: 'Password berhasil dibuat. Menyiapkan sesi admin.' })
          emailLoginMutation.mutate(
            { email: result.email, password: activationPassword },
            {
              onSuccess: () => {
                showToast({ tone: 'success', title: 'Login Berhasil', description: 'Sambungkan wallet yang terdaftar untuk mengakses portal.' })
                // Hapus invite token dari URL agar user tidak stuck di mode aktivasi
                window.setTimeout(() => {
                  router.replace('/portal-admin')
                }, 400)
              },
              onError: (err) => {
                setActivationError(getRepositoryErrorMessage(err, 'Akun aktif, tetapi login otomatis gagal. Silakan login manual dengan password baru.'))
              },
            },
          )
        },
        onError: (err) => {
          setActivationError(getRepositoryErrorMessage(err, 'Aktivasi akun gagal. Coba lagi.'))
        },
      },
    )
  }

  if (!mounted) return null

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-50 pb-10">
      <PublicNavbar activePath="/portal-admin" minimal />
      
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 md:p-8">
        {/* Decorative Background Elements */}
        <AsciiBackground />
        
        <FloatingShape
          speed={-0.06}
          className="left-[-80px] top-[120px] h-[320px] w-[320px] rounded-full bg-gradient-to-br from-blue-100/40 to-indigo-50/20 blur-3xl"
        />
        <FloatingShape
          speed={0.04}
          className="right-[-60px] top-[60px] h-[260px] w-[260px] rounded-full bg-gradient-to-bl from-slate-100/60 to-purple-50/20 blur-3xl"
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
                      <h1 className="text-[24px] font-semibold leading-tight text-slate-900">Portal Admin</h1>
                      <p className="mt-1 text-[13px] leading-6 text-slate-400">
                        {isInviteActivationMode ? 'Aktivasi akun baru.' : 'Akses untuk Tata Usaha UAJY.'}
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

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${(!authSession && !isInviteActivationMode) || (isInviteActivationMode && !authSession) ? 'bg-slate-100' : 'bg-white'}`}>
                    <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${authSession ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0F172A] text-white'}`}>
                      {authSession ? <Check className="h-4 w-4" /> : isInviteActivationMode ? <ShieldCheck className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[14px] font-semibold text-slate-900">
                        {isInviteActivationMode ? 'Aktivasi Akun' : 'Verifikasi Admin'}
                      </h2>
                      <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                        {authSession ? 'Akun institusi sudah masuk.' : isInviteActivationMode ? 'Lakukan aktivasi akun melalui link email.' : 'Masuk dengan akun institusi untuk memeriksa otoritas admin.'}
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
                          {isAdminAccessValidated ? 'Akses admin sudah tervalidasi.' : authSession ? 'Cocokkan dompet yang terdaftar untuk membuka akses.' : 'Dompet dicek setelah akun admin masuk.'}
                        </p>
                      </div>
                      {authSession && !isAdminAccessValidated && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                </aside>

                <section className="flex min-h-[520px] flex-col justify-between bg-white p-6 xl:p-8">
                  <div className="w-full">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{currentStepLabel}</p>

                    {isInviteActivationMode && (
                      <div className="mt-8 w-full">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h2 className="mt-5 text-[20px] font-semibold text-slate-900">Aktivasi Akun Admin</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          Buat password pertama untuk email yang sudah diundang. Setelah aktif, sambungkan wallet yang terdaftar untuk membuka portal admin.
                        </p>

                        {invitePreviewQuery.isLoading && (
                          <div className="mt-6 space-y-3">
                            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                            <div className="h-11 animate-pulse rounded-md bg-slate-100" />
                            <div className="h-11 animate-pulse rounded-md bg-slate-100" />
                          </div>
                        )}

                        {invitePreviewQuery.error && (
                          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-[12px] font-semibold text-red-700">Link aktivasi tidak dapat digunakan</p>
                            <p className="mt-2 text-[12px] leading-5 text-red-600">
                              {getRepositoryErrorMessage(invitePreviewQuery.error, 'Undangan tidak valid atau sudah kedaluwarsa.')}
                            </p>
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => router.push('/portal-admin')}
                                className="text-[12px] font-semibold text-blue-600 hover:underline"
                              >
                                Login dengan akun yang sudah aktif →
                              </button>
                            </div>
                          </div>
                        )}

                        {invitePreview && (
                          <form onSubmit={handleActivateInvite} className="mt-6 flex flex-col gap-4">
                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">Email undangan</p>
                              <p className="mt-1 truncate text-[13px] font-semibold text-slate-900" title={invitePreview.email}>{invitePreview.email}</p>
                              {invitePreview.walletAddress && (
                                <p className="mt-2 font-mono text-[12px] leading-5 text-blue-700">Wallet terdaftar: {invitePreview.walletAddress}</p>
                              )}
                            </div>

                            <AuthField
                              label="Buat Password"
                              type="password"
                              value={activationPassword}
                              onChange={(event) => setActivationPassword(event.target.value)}
                              placeholder="Minimal 8 karakter"
                              required
                            />
                            <AuthField
                              label="Konfirmasi Password"
                              type="password"
                              value={activationPasswordConfirm}
                              onChange={(event) => setActivationPasswordConfirm(event.target.value)}
                              placeholder="Ulangi password"
                              required
                            />

                            {activationError && (
                              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-600">
                                {activationError}
                              </p>
                            )}

                            <button
                              type="submit"
                              disabled={activateInviteMutation.isPending || emailLoginMutation.isPending}
                              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                            >
                              {activateInviteMutation.isPending || emailLoginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                              {activateInviteMutation.isPending || emailLoginMutation.isPending ? 'Mengaktifkan Akun' : 'Aktifkan Akun'}
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {!isInviteActivationMode && authSession && !isConnected && (
                      <div className="mt-8 w-full">
                        <h2 className="text-[20px] font-semibold text-slate-900">Sambungkan dompet digital admin</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          Akun admin sudah masuk. Sekarang sambungkan dompet digital yang terdaftar untuk membuka dashboard manajemen pemilihan.
                        </p>

                        <div className="mt-8 space-y-4">
                          {[
                            'Dompet digital dipakai untuk mengenali sesi admin.',
                            'Alamat dompet dapat diganti sebelum validasi selesai.',
                            'Gunakan dompet dan akun kampus milik petugas berwenang.',
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

                    {!isInviteActivationMode && !authSession && (
                      <div className="mt-8 w-full">
                        <h2 className="text-[20px] font-semibold text-slate-900">Verifikasi Admin</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          Masuk dengan akun kampus untuk memeriksa apakah akun memiliki otoritas admin atau Tata Usaha.
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
                              <h3 className="text-[13px] font-bold text-blue-900">Penting untuk Admin</h3>
                              <p className="text-[12px] leading-5 text-blue-800/80">
                                Akses portal admin memerlukan penautan antara akun institusi <span className="font-bold">@uajy.ac.id</span> dan alamat dompet digital yang sudah didaftarkan oleh Superadmin.
                              </p>
                              <div className="rounded-lg bg-white/60 p-3 text-[11px] leading-relaxed text-blue-900/70 border border-blue-100/50">
                                <span className="font-bold text-blue-900 block mb-1">Catatan:</span>
                                Kami telah menonaktifkan login manual untuk menjaga integritas kredensial. Gunakan OAuth Microsoft/Google yang terhubung dengan akun kampus Anda.
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
                          {redirectState ? `Mengarahkan Anda ke ${redirectState.label.toLowerCase()}...` : 'Menyiapkan akses admin...'}
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

                    {!isInviteActivationMode && authSession && !isConnected && (
                      <button
                        type="button"
                        onClick={handleConnectWallet}
                        disabled={isConnectPending}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                      >
                        {isConnectPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Sambungkan Dompet Admin
                        {!isConnectPending ? <ChevronRight className="h-4 w-4" /> : null}
                      </button>
                    )}

                    {isInviteActivationMode && (
                      <p className="text-right text-[12px] text-slate-400">Aktifkan akun terlebih dahulu.</p>
                    )}

                    {!isInviteActivationMode && !authSession && (
                      <p className="text-right text-[12px] text-slate-400">Pilih salah satu metode masuk di atas.</p>
                    )}

                    {isConnected && authSession && !isWalletBound && (
                      <button
                        onClick={handleBind}
                        disabled={bindWalletMutation.isPending || bindingBlocked}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                      >
                        {bindWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        Masuk Dashboard Admin
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
              </div>
            </section>
          </ScrollReveal>
        </div>

        {redirectState && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-redirect-title" aria-describedby="admin-redirect-description">
            <div className="w-full max-w-[360px] rounded-xl border border-slate-200 bg-white p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
              </div>
              <h2 id="admin-redirect-title" className="mt-5 text-[16px] font-semibold text-slate-900">Akses Berhasil Divalidasi</h2>
              <p id="admin-redirect-description" className="mt-3 text-[13px] leading-6 text-slate-600">
                {redirectState.description}
              </p>
              <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3" aria-live="polite">
                <p className="text-[12px] font-semibold text-slate-900">Mengarahkan ke {redirectState.label}...</p>
                <p className="mt-1 text-[12px] leading-5 text-slate-400">Mohon tunggu sebentar, proses ini berjalan otomatis.</p>
              </div>
            </div>
          </div>
        )}
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
