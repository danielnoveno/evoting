'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
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
  UserPlus,
  RefreshCw,
  X,
  Copy,
} from 'lucide-react'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { useAccount, useDisconnect } from 'wagmi'
import { AuthField } from '@/components/auth/auth-shell'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useMicrosoftCampusLogin, useGoogleLogin, useEmailPasswordLogin, useEmailPasswordSignUp, useResetPassword } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile } from '@/hooks/use-profile'
import { ScrollReveal, FloatingShape } from '@/components/public/parallax'
import { AsciiBackground } from '@/components/public/ascii-background'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { WalletAddress } from '@/components/ui/wallet-address'

function PortalAdminContent() {
  const router = useRouter()
  const { showToast } = useToast()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const authSessionQuery = useAuthSession()
  const currentProfileQuery = useCurrentProfile()
  const bindWalletMutation = useBindCurrentWallet()
  const microsoftLoginMutation = useMicrosoftCampusLogin()
  const googleLoginMutation = useGoogleLogin()
  const emailLoginMutation = useEmailPasswordLogin()
  const emailSignUpMutation = useEmailPasswordSignUp()
  const resetPasswordMutation = useResetPassword()

  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login')

  useEffect(() => { setMounted(true) }, [])

  const authSession = authSessionQuery.data
  const currentProfile = currentProfileQuery.data
  const isWalletBound = Boolean(address && currentProfile?.walletAddress === address)
  const completedSteps = (isConnected ? 1 : 0) + (authSession ? 1 : 0)
  const currentStepLabel = !isConnected ? 'Hubungkan Wallet' : !authSession ? 'Verifikasi Admin' : 'Akses Siap'

  useEffect(() => {
    if (mounted && isConnected && authSession && isWalletBound) {
      if (currentProfile?.role === 'super_admin') {
        showToast({ tone: 'success', title: 'Akses Diterima', description: 'Selamat datang di Portal Utama Admin.' })
        router.push('/superadmin')
      } else if (currentProfile?.role === 'admin') {
        showToast({ tone: 'success', title: 'Akses Diterima', description: 'Selamat datang di Dashboard Admin.' })
        router.push('/admin')
      } else {
        showToast({ tone: 'error', title: 'Akses Ditolak', description: 'Akun Anda tidak memiliki otoritas Administrator Kampus.' })
        disconnect()
      }
    }
  }, [mounted, isConnected, authSession, isWalletBound, currentProfile, router, disconnect, showToast])

  const handleBind = () => {
    if (!address || !authSession?.user?.email) return
    bindWalletMutation.mutate(
      {
        walletAddress: address,
        email: authSession.user.email,
        displayName: 'Administrator'
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
    } else if (authMode === 'signup') {
      emailSignUpMutation.mutate(
        { email, password },
        {
          onSuccess: () => {
            showToast({ tone: 'success', title: 'Pendaftaran Berhasil', description: 'Akun baru telah dibuat. Silakan lanjut ke langkah penautan.' })
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

  if (!mounted) return null

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-50">
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

        <div className="relative z-10 w-full max-w-[1040px] pb-4">
          <ScrollReveal variant="fade-up">
            <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Link href="/" aria-label="Tutup dan kembali ke beranda" className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-900">
                <X className="h-4 w-4" />
              </Link>

              <div className="grid max-h-[84vh] overflow-y-auto lg:grid-cols-[0.44fr_0.56fr]">
                <aside className="border-b border-slate-100 bg-white p-6 lg:border-b-0 lg:border-r lg:p-8">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <Link href="/" className="mb-5 inline-flex items-center gap-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-slate-900">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Kembali ke Beranda
                      </Link>
                      <h1 className="text-[24px] font-semibold leading-tight text-slate-900">Portal Admin</h1>
                      <p className="mt-1 text-[13px] leading-6 text-slate-400">
                        Akses untuk admin dan Tata Usaha UAJY.
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

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${!isConnected ? 'bg-slate-100' : 'bg-white'}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0F172A] text-white'}`}>
                        {isConnected ? <Check className="h-4 w-4" /> : <WalletIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-[14px] font-semibold text-slate-900">Hubungkan Wallet</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {isConnected ? 'Wallet admin sudah tersambung.' : 'Sambungkan wallet yang dipakai untuk akses admin.'}
                        </p>
                      </div>
                      {!isConnected && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>

                    <div className={`relative flex items-center gap-4 rounded-lg p-4 ${isConnected && !authSession ? 'bg-slate-100' : 'bg-white'} ${!isConnected ? 'opacity-50' : ''}`}>
                      <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${authSession ? 'bg-emerald-50 text-emerald-600' : isConnected ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {authSession ? <Check className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={isConnected ? 'text-[14px] font-semibold text-slate-900' : 'text-[14px] font-semibold text-slate-400'}>Verifikasi Admin</h2>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                          {authSession ? 'Akun institusi sudah terverifikasi.' : 'Validasi akun kampus untuk memastikan otoritas admin.'}
                        </p>
                      </div>
                      {isConnected && !authSession && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </div>
                  </div>
                </aside>

                <section className="flex min-h-[520px] flex-col justify-between bg-white p-6 lg:p-8">
                  <div className="pr-8">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{currentStepLabel}</p>

                    {!isConnected && (
                      <div className="mt-8 max-w-[420px]">
                        <h2 className="text-[20px] font-semibold text-slate-900">Hubungkan Wallet Admin</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          Sambungkan wallet yang akan digunakan sebagai identitas admin sebelum masuk ke dashboard manajemen pemilihan.
                        </p>

                        <div className="mt-8 space-y-4">
                          {[
                            'Wallet dipakai untuk mengenali sesi admin.',
                            'Alamat wallet dapat diganti sebelum validasi selesai.',
                            'Gunakan wallet dan akun kampus milik petugas berwenang.',
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
                      <div className="mt-8 max-w-[420px]">
                        <h2 className="text-[20px] font-semibold text-slate-900">Verifikasi Admin</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          Masuk dengan akun kampus untuk memeriksa apakah akun memiliki otoritas admin atau Tata Usaha.
                        </p>

                        <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Wallet terhubung</p>
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
                              title="Salin alamat wallet"
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
                            Login Staf Institusi
                          </button>

                          <button
                            onClick={handleGoogleLogin}
                            disabled={googleLoginMutation.isPending}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {googleLoginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" />}
                            Login dengan Google
                          </button>
                        </div>

                        <div className="relative my-5">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                          <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-widest"><span className="bg-white px-3 text-slate-400">Opsi Manual</span></div>
                        </div>

                        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                          <AuthField
                            label="Email Staf"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="nama@uajy.ac.id"
                          />

                          {authMode !== 'forgot' && (
                            <div className="flex flex-col gap-2">
                              <AuthField
                                label="Password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                              />
                              {authMode === 'login' && (
                                <div className="text-right">
                                  <button type="button" onClick={() => setAuthMode('forgot')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">Lupa Password?</button>
                                </div>
                              )}
                            </div>
                          )}

                          {formError && (
                            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] leading-5 text-red-600">
                              {formError}
                            </p>
                          )}

                          <button
                            type="submit"
                            disabled={emailLoginMutation.isPending || emailSignUpMutation.isPending || resetPasswordMutation.isPending}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                          >
                            {emailLoginMutation.isPending || emailSignUpMutation.isPending || resetPasswordMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : authMode === 'login' ? (
                              <Mail className="h-4 w-4" />
                            ) : authMode === 'signup' ? (
                              <UserPlus className="h-4 w-4" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            {authMode === 'login' ? 'Masuk ke Sistem' : authMode === 'signup' ? 'Daftar Akun' : 'Kirim Link Reset'}
                          </button>

                          <p className="text-center text-[12px] text-slate-500">
                            {authMode === 'login' && (
                              <>Belum punya akun? <button type="button" onClick={() => setAuthMode('signup')} className="font-semibold text-blue-600 hover:underline">Daftar</button></>
                            )}
                            {authMode === 'signup' && (
                              <>Sudah punya akun? <button type="button" onClick={() => setAuthMode('login')} className="font-semibold text-blue-600 hover:underline">Masuk</button></>
                            )}
                            {authMode === 'forgot' && (
                              <button type="button" onClick={() => setAuthMode('login')} className="font-semibold text-blue-600 hover:underline">Kembali Login</button>
                            )}
                          </p>
                        </form>
                      </div>
                    )}

                    {isConnected && authSession && !isWalletBound && (
                      <div className="mt-8 max-w-[420px]">
                        <h2 className="text-[20px] font-semibold text-slate-900">Validasi Otoritas</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">
                          Wallet dan akun kampus sudah siap. Tautkan keduanya untuk membuka dashboard admin sesuai peran akun.
                        </p>

                        <div className="mt-6 space-y-3">
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Wallet</p>
                            <WalletAddress
                              address={address ?? '-'}
                              className="mt-1 block font-mono text-[12px] font-semibold text-slate-900"
                            />
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Akun Kampus</p>
                            <p className="mt-1 truncate text-[13px] font-semibold text-slate-900" title={authSession.user?.email}>{authSession.user?.email}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isConnected && authSession && isWalletBound && (
                      <div className="mt-16 flex max-w-[420px] flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h2 className="mt-6 text-[20px] font-semibold text-slate-900">Akses Berhasil Divalidasi</h2>
                        <p className="mt-3 text-[13px] leading-6 text-slate-600">Mengarahkan Anda ke dashboard admin...</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={() => router.push('/')}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                      aria-label="Kembali"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>

                    {!isConnected && (
                      <ConnectWallet className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B]">
                        Hubungkan Wallet Admin
                        <ChevronRight className="h-4 w-4" />
                      </ConnectWallet>
                    )}

                    {isConnected && !authSession && (
                      <p className="text-right text-[12px] text-slate-400">Pilih salah satu metode masuk di atas.</p>
                    )}

                    {isConnected && authSession && !isWalletBound && (
                      <button
                        onClick={handleBind}
                        disabled={bindWalletMutation.isPending}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
                      >
                        {bindWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        Masuk Dashboard Admin
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
