'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Wallet as WalletIcon,
  Loader2,
  ChevronRight,
  Link2,
  Building2,
  Fingerprint,
  ArrowLeft,
  Lock,
  Mail,
  UserPlus,
  RefreshCw,
} from 'lucide-react'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { Address, Avatar, Identity, Name } from '@coinbase/onchainkit/identity'
import { useAccount, useDisconnect } from 'wagmi'
import { AuthCard, AuthField } from '@/components/auth/auth-shell'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useMicrosoftCampusLogin, useGoogleLogin, useEmailPasswordLogin, useEmailPasswordSignUp, useResetPassword } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile } from '@/hooks/use-profile'
import { ScrollReveal, FloatingShape, StaggerContainer } from '@/components/public/parallax'
import { AsciiBackground } from '@/components/public/ascii-background'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

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

        <div className="relative z-10 w-full max-w-[350px] pb-4">
          <ScrollReveal variant="fade-up">
            <AuthCard className="flex max-h-[84vh] max-w-none flex-col overflow-hidden border-slate-200/60 bg-white/90 p-0 shadow-[0_20px_50px_rgba(15,23,42,0.1)] backdrop-blur-md">
                
                {/* Header: Fixed within the card */}
                <div className="flex flex-shrink-0 flex-col items-center px-2 pt-4">
                  <div className="w-full">
                    <Link href="/" className="-ml-3 mb-2 inline-flex items-center gap-2 text-[12px] font-medium text-slate-400 transition-colors hover:text-slate-900">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Kembali ke Beranda
                    </Link>
                  </div>

                  <div className="mt-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F172A] shadow-xl shadow-slate-200 ring-4 ring-white">
                    <img src="/favicon.png" alt="Votein Logo" className="h-10 w-10 object-contain" />
                  </div>

                  <div className="mt-4 text-center">
                    <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 md:text-[30px]">Portal Admin</h1>
                    <p className="mx-auto mt-1 max-w-[300px] text-[14px] leading-relaxed text-slate-500">
                      Portal untuk Tata Usaha Universitas Atma Jaya Yogyakarta.
                    </p>
                  </div>
                </div>

                {/* Steps: Scrollable content */}
                <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto px-2 pb-6">
                  <StaggerContainer stagger={100} className="space-y-10">
                    {/* STEP 1: WALLET */}
                    <div className="flex flex-col gap-6 border-b border-slate-100 pb-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isConnected ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                            <WalletIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-[15px] font-bold text-slate-900">1. Sambungkan Wallet</h2>
                            <p className="text-[12px] text-slate-500">Hubungkan dompet Web3</p>
                          </div>
                        </div>
                        {isConnected && <CheckCircle2 className="h-6 w-6 text-blue-600" />}
                      </div>

                      {!isConnected ? (
                        <div className="flex flex-col gap-4">
                          <p className="text-[13px] leading-6 text-slate-600">
                            Sambungkan wallet yang terdaftar sebagai admin.
                          </p>
                          <ConnectWallet 
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-[14px] font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
                          >
                            Hubungkan Wallet Admin
                            <ChevronRight className="h-4 w-4" />
                          </ConnectWallet>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                          <div className="flex items-center justify-between gap-3 min-w-0 w-full">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                                <WalletIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p 
                                  className="select-all font-mono text-[12px] font-bold text-slate-900 cursor-pointer hover:text-slate-800 transition-colors"
                                  onClick={() => {
                                    if (address) {
                                      navigator.clipboard.writeText(address)
                                      showToast({ tone: 'success', title: 'Alamat Disalin', description: 'Alamat dompet disalin ke clipboard.' })
                                    }
                                  }}
                                  title="Klik untuk menyalin alamat lengkap"
                                >
                                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                                </p>
                              </div>
                            </div>
                            <button 
                              onClick={() => disconnect()} 
                              className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-600 shadow-sm hover:bg-red-50 border border-blue-100/50 transition-colors"
                            >
                              Ganti
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* STEP 2: MICROSOFT */}
                    <div className={`flex flex-col gap-6 transition-opacity duration-300 ${!isConnected ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${authSession ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-[15px] font-bold text-slate-900">2. Verifikasi Kampus</h2>
                            <p className="text-[12px] text-slate-500">Login akun Microsoft @uajy.ac.id</p>
                          </div>
                        </div>
                        {authSession && <CheckCircle2 className="h-6 w-6 text-indigo-600" />}
                      </div>

                      {!authSession ? (
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-3">
                            <button 
                              onClick={handleMicrosoftLogin}
                              disabled={microsoftLoginMutation.isPending}
                              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-900 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
                            >
                              {microsoftLoginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                              Login Staf Institusi (Microsoft)
                            </button>

                            <button 
                              onClick={handleGoogleLogin}
                              disabled={googleLoginMutation.isPending}
                              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-900 transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50"
                            >
                              {googleLoginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" />}
                              Login dengan Google
                            </button>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest"><span className="bg-white/50 px-3 text-slate-400 backdrop-blur-sm">Opsi Manual</span></div>
                          </div>

                          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                            <AuthField 
                                label="Email Staff" 
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
                                    <button type="button" onClick={() => setAuthMode('forgot')} className="text-[12px] font-bold text-blue-600 hover:text-blue-700">Lupa Password?</button>
                                  </div>
                                )}
                              </div>
                            )}

                            {formError && (
                              <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-[12px] leading-5 text-red-600">
                                {formError}
                              </p>
                            )}
                            
                            <button 
                                type="submit"
                                disabled={emailLoginMutation.isPending || emailSignUpMutation.isPending || resetPasswordMutation.isPending}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 text-[14px] font-bold text-white transition-all hover:bg-[#1E293B] shadow-lg shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
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

                            <p className="text-center text-[13px] text-slate-500">
                                {authMode === 'login' && (
                                  <>Belum punya akun? <button type="button" onClick={() => setAuthMode('signup')} className="font-bold text-blue-600 hover:underline">Daftar</button></>
                                )}
                                {authMode === 'signup' && (
                                  <>Sudah punya akun? <button type="button" onClick={() => setAuthMode('login')} className="font-bold text-blue-600 hover:underline">Masuk</button></>
                                )}
                                {authMode === 'forgot' && (
                                  <button type="button" onClick={() => setAuthMode('login')} className="font-bold text-blue-600 hover:underline">Kembali Login</button>
                                )}
                            </p>
                          </form>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex items-center justify-between gap-3 min-w-0 w-full">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm text-indigo-600">
                                <ShieldCheck className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] font-bold text-slate-900" title={authSession.user?.email}>{authSession.user?.email}</p>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                  {!currentProfile 
                                    ? 'SIAP DIAKTIVASI' 
                                    : currentProfile.role === 'super_admin' 
                                      ? 'TU KAMPUS' 
                                      : currentProfile.role === 'admin' 
                                        ? 'ORGANISASI' 
                                        : 'MAHASISWA'}
                                </p>
                              </div>
                            </div>
                            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* FINAL BINDING */}
                    {isConnected && authSession && !isWalletBound && (
                      <div className="mt-2 pb-2">
                        <div className="rounded-2xl bg-[#0F172A] p-8 text-white shadow-2xl shadow-slate-300">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                              <Fingerprint className="h-6 w-6" />
                            </div>
                            <h3 className="text-[16px] font-bold">Validasi Otoritas</h3>
                          </div>
                          <p className="mt-5 text-[14px] leading-7 text-slate-300">
                            Hubungkan identitas kampus Anda dengan alamat wallet untuk mendapatkan akses penuh ke manajemen pemilihan.
                          </p>
                          <button 
                            onClick={handleBind}
                            disabled={bindWalletMutation.isPending}
                            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-[14px] font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50"
                          >
                            {bindWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                            Masuk Dashboard Admin
                          </button>
                        </div>
                      </div>
                    )}

                    {isConnected && authSession && isWalletBound && (
                      <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <h3 className="mt-6 text-[18px] font-bold text-slate-900">Akses Berhasil Divalidasi!</h3>
                        <p className="mt-2 text-[14px] text-slate-500">Mengarahkan Anda ke dashboard pemilihan...</p>
                      </div>
                    )}
                  </StaggerContainer>
                </div>
              </AuthCard>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={500} className="mt-8 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
                Portal Tata Usaha Universitas Atma Jaya Yogyakarta
              </p>
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
