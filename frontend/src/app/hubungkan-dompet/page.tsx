'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useMemo, useState, useEffect, Suspense } from 'react'
import {
  Fingerprint,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Key,
  Loader2,
  Lock,
  ChevronRight
} from 'lucide-react'
import { AuthCard, AuthField, AuthHeader, AuthNotice, AuthShell, AuthTitle } from '@/components/auth/auth-shell'
import { resolveCampusLoginRole } from '@/lib/dummy-auth-seeds'
import { sharedDummyContext } from '@/lib/dummy-shared-context'
import { useToast } from '@/components/ui/toast-provider'

type ActiveTab = 'wallet' | 'campus'
type WalletState = 'idle' | 'preparing' | 'biometric' | 'success'

function ConnectWalletContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const redirectParam = searchParams.get('redirect')

  const [activeTab, setActiveTab] = useState<ActiveTab>('wallet')
  
  // Wallet state machine simulation
  const [walletState, setWalletState] = useState<WalletState>('idle')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailDomainValid = useMemo(() => {
    const normalized = email.trim().toLowerCase()
    return normalized.endsWith('@students.uajy.ac.id') || normalized.endsWith('@uajy.ac.id')
  }, [email])

  const handleConnectSamsungWallet = async () => {
    if (walletState !== 'idle') return

    setWalletState('preparing')
    
    await new Promise((resolve) => setTimeout(resolve, 1200))
    
    setWalletState('biometric')
  }

  const handleBiometricConfirm = async () => {
    if (walletState !== 'biometric') return

    await new Promise((resolve) => setTimeout(resolve, 1400))
    
    setWalletState('success')
    showToast({
      tone: 'success',
      title: 'Koneksi Berhasil',
      description: 'Wallet berhasil dihubungkan dengan identitas Anda.',
    })

    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    if (redirectParam === 'pilih-kandidat') {
      router.push(`/pemilih/pemilihan/${sharedDummyContext.electionId}/pilih-kandidat`)
    } else {
      router.push('/pemilih')
    }
  }

  useEffect(() => {
    if (walletState === 'biometric') {
      const timer = setTimeout(() => {
        handleBiometricConfirm()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [walletState])

  const handleCampusSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setEmailError('')
    setPasswordError('')
    setFormError('')
    setSuccessMessage('')

    let hasError = false

    if (!email.trim()) {
      setEmailError('Email kampus wajib diisi.')
      hasError = true
    } else if (!emailDomainValid) {
      setEmailError('Gunakan email dengan domain students.uajy.ac.id atau uajy.ac.id.')
      hasError = true
    }

    if (!password.trim()) {
      setPasswordError('Password wajib diisi.')
      hasError = true
    }

    if (hasError) {
      setFormError('Periksa kembali data login Anda.')
      return
    }

    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 750))

    const role = resolveCampusLoginRole(email, password)

    if (!role) {
      setIsSubmitting(false)
      setFormError('Email kampus atau password tidak cocok. Coba lagi.')
      return
    }

    setSuccessMessage('Login berhasil. Menyiapkan akses akun Anda...')

    window.setTimeout(() => {
      setIsSubmitting(false)
      if (role === 'admin') {
        router.push('/admin')
        return
      }

      if (role === 'superadmin') {
        router.push('/superadmin')
        return
      }

      if (redirectParam === 'pilih-kandidat') {
        router.push(`/pemilih/pemilihan/${sharedDummyContext.electionId}/pilih-kandidat`)
      } else {
        router.push('/pemilih')
      }
    }, 900)
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader />
        
        <AuthTitle
          title="Masuk ke Votein"
          body="Pilih metode masuk yang aman untuk melanjutkan proses voting dan melihat bukti suara Anda."
        />

        <div className="mt-6 flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              if (walletState === 'idle' || walletState === 'success') {
                setActiveTab('wallet')
              }
            }}
            disabled={walletState === 'preparing' || walletState === 'biometric'}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-[12px] font-semibold transition-all ${
              activeTab === 'wallet'
                ? 'bg-white text-slate-900'
                : 'text-slate-500 hover:text-slate-900 disabled:opacity-50'
             }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Samsung Wallet
          </button>
          <button
            type="button"
            onClick={() => {
              if (walletState === 'idle' || walletState === 'success') {
                setActiveTab('campus')
              }
            }}
            disabled={walletState === 'preparing' || walletState === 'biometric'}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-[12px] font-semibold transition-all ${
              activeTab === 'campus'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 disabled:opacity-50'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            Akun SIA Kampus
          </button>
        </div>

        {activeTab === 'wallet' && (
          <div className="mt-6">
            {walletState === 'idle' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-blue-300">
                      Akses Cepat
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">Base Sepolia</span>
                  </div>

                  <div className="mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Metode Utama</p>
                    <h3 className="mt-1 text-[18px] font-bold tracking-tight">Samsung Wallet</h3>
                    <p className="mt-2 text-[12px] leading-5 text-slate-300">
                      Hubungkan wallet Anda untuk masuk lebih cepat dan melanjutkan proses voting tanpa mengisi ulang data pemilih.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-[11px] text-slate-300">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                      Anti-Sybil
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300">
                      <Fingerprint className="h-3.5 w-3.5 text-blue-400" />
                      Biometrik
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConnectSamsungWallet}
                  className="group relative flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[#0F172A] px-5 text-[14px] font-semibold text-white transition-all hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Hubungkan Samsung Wallet
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <p className="text-center text-[11px] leading-relaxed text-slate-500">
                  Gunakan metode ini jika wallet Anda sudah terdaftar untuk ruang voting yang akan diikuti.
                </p>
              </div>
            )}

            {walletState === 'preparing' && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
                <h3 className="mt-5 text-[16px] font-semibold text-slate-900">Mempersiapkan wallet...</h3>
                <p className="mt-2 max-w-[280px] text-[12px] leading-5 text-slate-500">
                  Menyiapkan koneksi aman agar Anda bisa melanjutkan ke ruang voting tanpa hambatan.
                </p>
              </div>
            )}

            {walletState === 'biometric' && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <button
                  type="button"
                  onClick={handleBiometricConfirm}
                  className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
                  aria-label="Konfirmasi Sidik Jari"
                >
                  <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/20 opacity-75" />
                  <span className="absolute -inset-2 animate-pulse rounded-full bg-blue-400/10" />
                  <Fingerprint className="relative h-10 w-10 animate-pulse text-blue-600" />
                </button>
                
                <h3 className="mt-6 text-[16px] font-semibold text-slate-900">Otorisasi Biometrik</h3>
                <p className="mt-2 max-w-[280px] text-[12px] leading-5 text-slate-500">
                  Letakkan sidik jari Anda pada sensor atau klik ikon pemindai untuk menyelesaikan proses masuk.
                </p>
                <div className="mt-4 rounded-full bg-slate-100 px-3.5 py-1 text-[11px] font-medium text-slate-600">
                  Menunggu verifikasi perangkat...
                </div>
              </div>
            )}

            {walletState === 'success' && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <h3 className="mt-5 text-[17px] font-bold text-slate-900">Samsung Wallet Terhubung!</h3>
                
                <div className="mt-4 w-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-left text-[12px]">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400">Pemilih</span>
                    <span className="font-semibold text-slate-800">Aditya Pratama</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 py-2">
                    <span className="text-slate-400">Alamat Wallet</span>
                    <span className="font-mono font-medium text-slate-700">0x71C7...976F</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">Status</span>
                    <span className="font-semibold text-emerald-600">Siap Digunakan</span>
                  </div>
                </div>

                <p className="mt-5 animate-pulse text-[11px] font-semibold text-slate-500">
                  Mengalihkan Anda ke ruang pemilihan...
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'campus' && (
          <form className="mt-6" onSubmit={handleCampusSubmit}>
            <div className="space-y-3">
              <AuthField
                label="Email Kampus"
                placeholder="nama@students.uajy.ac.id / nama@uajy.ac.id"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={emailError}
                autoComplete="email"
                disabled={isSubmitting}
              />
              <AuthField
                label="Password"
                placeholder="Masukkan password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={passwordError}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            {formError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-[12px] leading-6 text-red-700">
                {formError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[12px] leading-6 text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#0F172A] px-5 text-[14px] font-medium text-white hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Memeriksa...' : 'Masuk'}
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-1 text-center text-[11px] leading-relaxed text-slate-500">
              <p>
                Akun akan disesuaikan otomatis berdasarkan data pengguna yang terdaftar di sistem kampus.
              </p>
              <p className="font-medium text-slate-600">
                Gunakan: voter (voter12345), admin (admin12345), superadmin (superadmin123456).
              </p>
            </div>
          </form>
        )}

        <AuthNotice />
      </AuthCard>
    </AuthShell>
  )
}

export default function ConnectWalletPage() {
  return (
    <Suspense fallback={
      <AuthShell>
        <AuthCard>
          <AuthHeader />
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="mt-4 text-[13px] text-slate-500">Memuat halaman masuk...</p>
          </div>
        </AuthCard>
      </AuthShell>
    }>
      <ConnectWalletContent />
    </Suspense>
  )
}
