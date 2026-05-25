'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Wallet as WalletIcon,
  Loader2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Link2,
  Lock,
  UserCheck,
  Building2,
  Mail,
  UserPlus,
  RefreshCw,
  Fingerprint,
} from 'lucide-react'
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet'
import { Address, Avatar, Identity, Name } from '@coinbase/onchainkit/identity'
import { useAccount, useDisconnect } from 'wagmi'
import { AuthShell, AuthField } from '@/components/auth/auth-shell'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useMicrosoftCampusLogin, useEmailPasswordLogin, useEmailPasswordSignUp, useResetPassword } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile } from '@/hooks/use-profile'
import { sharedDummyContext } from '@/lib/dummy-shared-context'
import { ScrollReveal } from '@/components/public/parallax'
import Link from 'next/link'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

function resolveRedirectTarget(redirectParam: string | null) {
  if (redirectParam?.startsWith('/')) return redirectParam
  if (redirectParam === 'pilih-kandidat') {
    return `/pemilih/pemilihan/${sharedDummyContext.electionId}/pilih-kandidat`
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
         if (currentProfile?.role === 'platform_admin') return router.push('/admin')
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
            setFormError(getRepositoryErrorMessage(err, 'Email atau password salah.'))
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
            setFormError(getRepositoryErrorMessage(err, 'Gagal mendaftar. Pastikan email belum terdaftar.'))
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
          setFormError(getRepositoryErrorMessage(err, 'Gagal mengirim email reset. Periksa kembali email Anda.'))
        }
      })
    }
  }

  if (!mounted) return null

  return (
    <AuthShell>
      <div className="mx-auto max-w-[520px] w-full px-4 pt-10">
        <header className="text-center mb-10">
           <div className="mx-auto h-16 w-16 bg-blue-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6 border-4 border-white">
              <ShieldCheck className="h-8 w-8 text-white" />
           </div>
           <h1 className="text-[36px] font-bold tracking-tight text-slate-900 leading-tight">Mulai Voting Digital</h1>
           <p className="mt-4 text-[16px] text-slate-500 leading-relaxed max-w-[400px] mx-auto">
             Buat identitas blockchain kampus Anda dengan mudah dan aman dalam hitungan detik.
           </p>
        </header>

        <div className="space-y-5">
          {/* STEP 1: SMART WALLET CREATION */}
          <article className={`relative overflow-hidden rounded-[32px] border-2 p-7 transition-all duration-500 ${isConnected ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/50'}`}>
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isConnected ? 'bg-emerald-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                     <WalletIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-emerald-600' : 'text-blue-600'}`}>TAHAP PERTAMA</p>
                    <h2 className="text-[20px] font-bold text-slate-900">Buat Identitas Blockchain</h2>
                  </div>
               </div>
               {isConnected && <CheckCircle2 className="h-7 w-7 text-emerald-600 animate-in zoom-in duration-300" />}
            </div>

            <div className="mt-8">
              {!isConnected ? (
                <>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                       <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                       </div>
                       <p className="text-[13px] text-slate-600"><strong>Tanpa Password:</strong> Cukup gunakan Sidik Jari / FaceID.</p>
                    </div>
                    <div className="flex items-start gap-3">
                       <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                       </div>
                       <p className="text-[13px] text-slate-600"><strong>Tanpa Instalasi:</strong> Tidak butuh aplikasi atau ekstensi.</p>
                    </div>
                  </div>
                  
                  <ConnectWallet 
                    className="w-full h-16 bg-[#0052FF] text-white rounded-[20px] font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-[#0045db] transition-all shadow-lg active:scale-[0.98]"
                  >
                    <Sparkles className="h-5 w-5" />
                    Buat / Hubungkan Wallet
                    <ChevronRight className="h-5 w-5" />
                  </ConnectWallet>
                  
                  <p className="mt-4 text-center text-[11px] text-slate-400 font-medium italic">
                    Didukung oleh teknologi Coinbase Smart Wallet
                  </p>
                </>
              ) : (
                <div className="rounded-2xl bg-white p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
                  <Identity hasCopyAddressOnClick>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-full border-2 border-emerald-50" />
                      <div className="min-w-0 flex-1">
                        <Name className="block truncate text-[15px] font-bold text-slate-900" />
                        <Address className="mt-1 block truncate text-[12px] text-slate-500 font-mono" />
                      </div>
                    </div>
                  </Identity>
                  <button onClick={() => disconnect()} className="px-4 py-2 bg-slate-100 text-slate-600 text-[12px] font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">Ganti Wallet</button>
                </div>
              )}
            </div>
          </article>

          {/* STEP 2: CAMPUS IDENTITY */}
          <article className={`relative overflow-hidden rounded-[32px] border-2 p-7 transition-all duration-500 ${!isConnected ? 'opacity-40 grayscale pointer-events-none' : (authSession ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/50')}`}>
             <div className="flex items-start justify-between">
               <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${authSession ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                     <Building2 className="h-7 w-7" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${authSession ? 'text-emerald-600' : 'text-slate-400'}`}>TAHAP KEDUA</p>
                    <h2 className="text-[20px] font-bold text-slate-900">Verifikasi Mahasiswa</h2>
                  </div>
               </div>
               {authSession && <CheckCircle2 className="h-7 w-7 text-emerald-600 animate-in zoom-in duration-300" />}
            </div>

            <div className="mt-8">
              {!authSession ? (
                <div className="space-y-4">
                  <button 
                    onClick={handleMicrosoftLogin}
                    disabled={microsoftLoginMutation.isPending}
                    className="w-full h-16 bg-white text-slate-900 rounded-[20px] font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-slate-50 transition-all border-2 border-slate-900 shadow-[6px_6px_0_0_#0F172A] disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    {microsoftLoginMutation.isPending ? <Loader2 className="animate-spin h-6 w-6" /> : <Building2 className="h-5 w-5" />}
                    Masuk Microsoft UAJY
                  </button>

                  <div className="py-4 flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Atau Daftar Manual</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  <form onSubmit={handleEmailAuth} className="space-y-4">
                     <AuthField 
                        label="EMAIL KAMPUS" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="npm@students.uajy.ac.id"
                      />
                     
                     {authMode !== 'forgot' && (
                       <div className="space-y-2">
                        <AuthField 
                            label="PASSWORD" 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Buat password rahasia"
                          />
                        {authMode === 'login' && (
                          <div className="text-right">
                             <button type="button" onClick={() => setAuthMode('forgot')} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider">Lupa Password?</button>
                          </div>
                        )}
                       </div>
                     )}

                     {formError && <p className="text-red-500 text-[12px] font-bold bg-red-50 p-3 rounded-xl border border-red-100 flex gap-2 items-center"><ShieldCheck className="h-4 w-4" /> {formError}</p>}
                     
                     <button 
                        type="submit"
                        disabled={emailLoginMutation.isPending || emailSignUpMutation.isPending || resetPasswordMutation.isPending}
                        className="w-full h-14 bg-slate-900 text-white rounded-[18px] font-bold text-[15px] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
                      >
                        {emailLoginMutation.isPending || emailSignUpMutation.isPending || resetPasswordMutation.isPending ? (
                          <Loader2 className="animate-spin h-5 w-5" />
                        ) : authMode === 'login' ? (
                          <Mail className="h-5 w-5" />
                        ) : authMode === 'signup' ? (
                          <UserPlus className="h-5 w-5" />
                        ) : (
                          <RefreshCw className="h-5 w-5" />
                        )}
                        {authMode === 'login' ? 'Verifikasi & Masuk' : authMode === 'signup' ? 'Daftar Akun Baru' : 'Kirim Link Pemulihan'}
                     </button>

                     <p className="text-center text-[13px] text-slate-500">
                        {authMode === 'login' && (
                          <>Belum punya akun? <button type="button" onClick={() => setAuthMode('signup')} className="text-blue-600 font-bold hover:underline">Daftar Sekarang</button></>
                        )}
                        {authMode === 'signup' && (
                          <>Sudah punya akun? <button type="button" onClick={() => setAuthMode('login')} className="text-blue-600 font-bold hover:underline">Masuk Sekarang</button></>
                        )}
                        {authMode === 'forgot' && (
                          <><button type="button" onClick={() => setAuthMode('login')} className="text-blue-600 font-bold hover:underline">Kembali Login</button></>
                        )}
                     </p>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-5 border border-emerald-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                        <UserCheck className="h-6 w-6 text-blue-600" />
                     </div>
                     <div>
                       <p className="text-[15px] font-bold text-slate-900">{authSession.user?.email?.split('@')[0]}</p>
                       <div className="flex items-center gap-2 mt-0.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{currentProfile?.role || 'Verified Voter'}</p>
                       </div>
                     </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
              )}
            </div>
          </article>

          {/* FINAL ACTIVATION CARD */}
          {isConnected && authSession && !isWalletBound && (
             <ScrollReveal variant="fade-up" delay={200}>
              <article className="mt-8 rounded-[32px] bg-[#0052FF] p-8 text-white shadow-2xl shadow-blue-500/40 relative overflow-hidden group border-4 border-white/20">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                
                <div className="flex items-center gap-4 relative z-10">
                   <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Fingerprint className="h-7 w-7 text-white" />
                   </div>
                   <h3 className="text-[24px] font-bold tracking-tight">Satu Langkah Akhir</h3>
                </div>
                
                <p className="mt-4 text-blue-100 leading-relaxed relative z-10 text-[15px]">
                  Tautkan identitas blockchain baru Anda ke akun kampus untuk mengaktifkan hak suara permanen.
                </p>
                <button 
                  onClick={handleBind}
                  disabled={bindWalletMutation.isPending}
                  className="mt-8 w-full h-18 bg-white text-[#0052FF] rounded-[22px] font-bold text-[17px] flex items-center justify-center gap-3 hover:shadow-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-[0.98] relative z-10 py-5"
                >
                  {bindWalletMutation.isPending ? <Loader2 className="animate-spin h-7 w-7" /> : <Link2 className="h-7 w-7" />}
                  Aktivasi Profil & Masuk
                </button>
              </article>
             </ScrollReveal>
          )}

          {isConnected && authSession && isWalletBound && (
            <div className="text-center py-16 animate-in fade-in slide-in-from-bottom-6 duration-1000">
               <div className="relative inline-block">
                  <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
               </div>
               <p className="font-bold text-slate-900 text-[24px] tracking-tight">Akses Berhasil Dibuka!</p>
               <p className="text-slate-500 text-[15px] mt-2">Mengarahkan Anda ke Dashboard Voting...</p>
            </div>
          )}
        </div>

        <footer className="mt-20 text-center pb-20">
           <div className="flex items-center justify-center gap-4 opacity-30">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                Decentralized & Secure
              </p>
           </div>
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
            <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto" />
            <p className="mt-4 text-slate-400 font-medium">Memuat sistem keamanan...</p>
          </div>
       </div>
    }>
      <ConnectWalletContent />
    </Suspense>
  )
}
