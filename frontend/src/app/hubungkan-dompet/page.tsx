'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Wallet as WalletIcon,
  Loader2,
  ChevronRight,
  Link2,
  Building2,
  Mail,
  UserPlus,
  RefreshCw,
  Fingerprint,
  ArrowLeft,
} from 'lucide-react'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { Address, Avatar, Identity, Name } from '@coinbase/onchainkit/identity'
import { useAccount, useDisconnect } from 'wagmi'
import { AuthShell, AuthCard, AuthHeader, AuthTitle, AuthField } from '@/components/auth/auth-shell'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useMicrosoftCampusLogin, useEmailPasswordLogin, useEmailPasswordSignUp, useResetPassword } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile } from '@/hooks/use-profile'
import { sharedContext } from '@/lib/shared-context'
import { ScrollReveal } from '@/components/public/parallax'
import Link from 'next/link'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

function resolveRedirectTarget(redirectParam: string | null) {
  if (redirectParam?.startsWith('/')) return redirectParam
  if (redirectParam === 'pilih-kandidat') {
    return `/pemilih/pemilihan/${sharedContext.electionId}/pilih-kandidat`
  }
  return '/pemilih'
}

function ConnectWalletContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const authSessionQuery = useAuthSession()
  const currentProfileQuery = useCurrentProfile()
  const bindWalletMutation = useBindCurrentWallet()
  const microsoftLoginMutation = useMicrosoftCampusLogin()
  const emailLoginMutation = useEmailPasswordLogin()
  const emailSignUpMutation = useEmailPasswordSignUp()
  const resetPasswordMutation = useResetPassword()

  const redirectParam = searchParams.get('redirect')
  const redirectTarget = useMemo(() => resolveRedirectTarget(redirectParam), [redirectParam])

  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login')

  useEffect(() => { setMounted(true) }, [])

  const authSession = authSessionQuery.data
  const currentProfile = currentProfileQuery.data
  const isWalletBound = Boolean(address && currentProfile?.walletAddress === address)

  // Auto-redirect if everything is ready
  useEffect(() => {
    if (mounted && isConnected && authSession && isWalletBound) {
      const timer = setTimeout(() => {
         if (currentProfile?.role === 'super_admin') return router.push('/superadmin')
         if (currentProfile?.role === 'admin') return router.push('/admin')
         router.push(redirectTarget)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [mounted, isConnected, authSession, isWalletBound, router, redirectTarget, currentProfile?.role])

  const handleBind = () => {
    if (!address || !authSession?.user?.email) return
    bindWalletMutation.mutate(
      {
        walletAddress: address,
        email: authSession.user.email,
        displayName: authSession.user.user_metadata?.full_name || authSession.user.user_metadata?.name || null
      },
      {
        onSuccess: () => {
          showToast({ tone: 'success', title: 'Aktivasi Berhasil', description: 'Wallet dan Akun Kampus telah ditautkan.' })
        }
      }
    )
  }

  const handleMicrosoftLogin = () => {
    microsoftLoginMutation.mutate({ nextPath: `/hubungkan-dompet?redirect=${redirectParam}` })
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
    <AuthShell>
      <div className="flex w-full flex-col gap-6">
        <div className="mx-auto flex w-full max-w-[432px] flex-col gap-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <AuthHeader />
          <AuthTitle 
            title="Mulai Voting Digital" 
            body="Buat identitas blockchain kampus Anda dengan aman dalam hitungan detik." 
          />

          <AuthCard>
            <div className="flex flex-col gap-8">
              {/* STEP 1: SMART WALLET CREATION */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      <WalletIcon className="h-4 w-4" />
                    </div>
                    <h2 className="text-[14px] font-semibold text-slate-900">1. Identitas Blockchain</h2>
                  </div>
                  {isConnected && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                </div>

                {!isConnected ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-[13px] leading-6 text-slate-500">
                      Gunakan Sidik Jari atau FaceID untuk membuat dompet digital tanpa perlu aplikasi tambahan.
                    </p>
                    <ConnectWallet 
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0F172A] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1E293B]"
                    >
                      Hubungkan Dompet
                      <ChevronRight className="h-4 w-4" />
                    </ConnectWallet>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <Identity hasCopyAddressOnClick>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-full" />
                          <div className="min-w-0">
                            <Name className="block truncate text-[13px] font-semibold text-slate-900" />
                            <Address className="block truncate text-[11px] font-mono text-slate-500" />
                          </div>
                        </div>
                      </Identity>
                      <button 
                        onClick={() => disconnect()} 
                        className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                      >
                        Ganti
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: CAMPUS IDENTITY */}
              <div className={`flex flex-col gap-4 transition-opacity duration-300 ${!isConnected ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${authSession ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <h2 className="text-[14px] font-semibold text-slate-900">2. Verifikasi Mahasiswa</h2>
                  </div>
                  {authSession && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                </div>

                {!authSession ? (
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={handleMicrosoftLogin}
                      disabled={microsoftLoginMutation.isPending}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      {microsoftLoginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                      Masuk dengan Microsoft UAJY
                    </button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                      <div className="relative flex justify-center text-[11px] uppercase tracking-wider"><span className="bg-white px-2 text-slate-400">Atau Manual</span></div>
                    </div>

                    <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                       <AuthField 
                          label="Email Kampus" 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          placeholder="npm@students.uajy.ac.id"
                        />
                       
                       {authMode !== 'forgot' && (
                         <div className="flex flex-col gap-1.5">
                          <AuthField 
                              label="Password" 
                              type="password" 
                              value={password} 
                              onChange={e => setPassword(e.target.value)} 
                              placeholder="••••••••"
                            />
                          {authMode === 'login' && (
                            <div className="text-right">
                               <button type="button" onClick={() => setAuthMode('forgot')} className="text-[11px] font-medium text-blue-600 hover:text-blue-700">Lupa Password?</button>
                            </div>
                          )}
                         </div>
                       )}

                       {formError && (
                         <p className="rounded-md border border-red-100 bg-red-50 p-2.5 text-[12px] leading-5 text-red-600">
                           {formError}
                         </p>
                       )}
                       
                       <button 
                          type="submit"
                          disabled={emailLoginMutation.isPending || emailSignUpMutation.isPending || resetPasswordMutation.isPending}
                          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0F172A] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1E293B] disabled:opacity-50"
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
                          {authMode === 'login' ? 'Masuk' : authMode === 'signup' ? 'Daftar' : 'Kirim Link'}
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
                ) : (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-900">{authSession.user?.email}</p>
                          <p className="text-[11px] uppercase tracking-wider text-slate-500">{currentProfile?.role === 'super_admin' ? 'TU KAMPUS' : currentProfile?.role === 'admin' ? 'ORGANISASI' : 'MAHASISWA'}</p>
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* FINAL ACTIVATION CARD */}
              {isConnected && authSession && !isWalletBound && (
                <ScrollReveal variant="fade-up" delay={100}>
                  <div className="rounded-xl bg-[#0F172A] p-5 text-white shadow-lg shadow-slate-200">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="h-5 w-5 text-blue-400" />
                      <h3 className="text-[15px] font-semibold">Aktifkan Hak Suara</h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-slate-300">
                      Tautkan dompet blockchain Anda ke akun kampus untuk mengaktifkan fitur voting.
                    </p>
                    <button 
                      onClick={handleBind}
                      disabled={bindWalletMutation.isPending}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-[13px] font-semibold text-slate-900 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {bindWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                      Aktivasi Profil
                    </button>
                  </div>
                </ScrollReveal>
              )}

              {isConnected && authSession && isWalletBound && (
                <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-[16px] font-semibold text-slate-900">Akses Berhasil!</h3>
                  <p className="mt-1 text-[13px] text-slate-500">Mengarahkan ke dashboard...</p>
                </div>
              )}
            </div>
          </AuthCard>
        </div>

        <footer className="mt-4 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">
            Securely powered by Base Blockchain
          </p>
        </footer>
      </div>
    </AuthShell>
  )
}

export default function ConnectWalletPage() {
  return (
    <Suspense fallback={
       <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-900 mx-auto" />
            <p className="mt-4 text-[13px] font-medium text-slate-500">Memuat sistem...</p>
          </div>
       </div>
    }>
      <ConnectWalletContent />
    </Suspense>
  )
}
