'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Wallet as WalletIcon,
  Key,
  Loader2,
  ChevronRight,
  Mail,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building2,
  Link2,
} from 'lucide-react'
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet'
import { Address, Avatar, Identity, Name } from '@coinbase/onchainkit/identity'
import { useAccount, useDisconnect } from 'wagmi'
import { AuthCard, AuthField, AuthHeader, AuthNotice, AuthShell, AuthTitle } from '@/components/auth/auth-shell'
import { resolveCampusLoginRole } from '@/lib/dummy-auth-seeds'
import { sharedDummyContext } from '@/lib/dummy-shared-context'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useEmailPasswordLogin, useMicrosoftCampusLogin, useLogoutSession } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile } from '@/hooks/use-profile'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { getCurrentProfileRole } from '@/lib/repositories/profileRepository'

type ActiveTab = 'wallet' | 'campus'

const PROTECTED_APP_PREFIXES = ['/admin', '/superadmin', '/pemilih'] as const

function resolveRedirectTarget(redirectParam: string | null) {
  if (redirectParam?.startsWith('/')) return redirectParam
  if (redirectParam === 'pilih-kandidat') {
    return `/pemilih/pemilihan/${sharedDummyContext.electionId}/pilih-kandidat`
  }

  return '/pemilih'
}

function formatShortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function isUajyEmail(email: string | null | undefined) {
  if (!email) return false

  const normalized = email.trim().toLowerCase()
  return normalized.endsWith('@uajy.ac.id') || normalized.endsWith('@students.uajy.ac.id')
}

function LoginStepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = [
    { id: 1, label: 'Buat Wallet' },
    { id: 2, label: 'Identifikasi Kampus' },
    { id: 3, label: 'Tautkan & Lanjut' },
  ] as const

  return (
    <div className="mt-6">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Langkah Masuk</p>
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const done = step.id < currentStep
          const active = step.id === currentStep

          return (
            <div key={step.id} className="flex flex-1 items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] ${done ? 'bg-[#0F172A] text-white' : active ? 'border-2 border-[#0F172A] bg-white font-semibold text-slate-900' : 'border border-slate-200 bg-white text-slate-400'}`}>
                  {step.id}
                </div>
                <span className={`hidden whitespace-nowrap text-[11px] sm:inline ${done || active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? <div className={`h-px flex-1 ${done ? 'bg-[#0F172A]' : 'bg-slate-200'}`} /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

async function resolveRoleBasedDestination(requestedTarget: string) {
  if (requestedTarget !== '/pemilih') return requestedTarget

  try {
    const role = await getCurrentProfileRole()

    if (role === 'super_admin') return '/superadmin'
    if (role === 'platform_admin') return '/admin'
  } catch {
    return requestedTarget
  }

  return requestedTarget
}

function ConnectWalletContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const { address, isConnected, status } = useAccount()
  const { disconnect } = useDisconnect()
  const authSessionQuery = useAuthSession()
  const currentProfileQuery = useCurrentProfile()

  const redirectParam = searchParams.get('redirect')
  const redirectTarget = useMemo(() => resolveRedirectTarget(redirectParam), [redirectParam])

  const [activeTab, setActiveTab] = useState<ActiveTab>('wallet')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const loginMutation = useEmailPasswordLogin()
  const logoutMutation = useLogoutSession()

  useEffect(() => {
    setMounted(true)
  }, [])
  const microsoftLoginMutation = useMicrosoftCampusLogin()
  const bindWalletMutation = useBindCurrentWallet()
  const [walletMessage, setWalletMessage] = useState('')
  const [walletCtaPulse, setWalletCtaPulse] = useState(false)
  const walletHandledRef = useRef(false)

  const emailDomainValid = useMemo(() => {
    const normalized = email.trim().toLowerCase()
    return normalized.endsWith('@students.uajy.ac.id') || normalized.endsWith('@uajy.ac.id')
  }, [email])

  const onchainKitConfigured = Boolean(process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY)
  const authError = searchParams.get('authError')
  const authSession = authSessionQuery.data
  const currentProfile = currentProfileQuery.data
  const sessionEmail = authSession?.user?.email ?? null
  const sessionDisplayName =
    typeof authSession?.user?.user_metadata?.full_name === 'string'
      ? authSession.user.user_metadata.full_name
      : typeof authSession?.user?.user_metadata?.name === 'string'
        ? authSession.user.user_metadata.name
        : sessionEmail?.split('@')[0] ?? null
  const isWalletBoundToCurrentAccount = Boolean(address && currentProfile?.walletAddress === address)
  const currentProfileHasDifferentWallet = Boolean(currentProfile?.walletAddress && address && currentProfile.walletAddress !== address)
  const canBindMicrosoftToWallet = Boolean(authSession && sessionEmail && address)
  const hasValidCampusSession = Boolean(authSession && isUajyEmail(sessionEmail))
  const isVotingRedirect = redirectTarget.startsWith('/pemilih')
  const canContinueToProtectedVoting = !isVotingRedirect || (hasValidCampusSession && isConnected && isWalletBoundToCurrentAccount)
  const currentStep: 1 | 2 | 3 = !isConnected ? 1 : !hasValidCampusSession ? 2 : 3
  const requiresCampusSessionAfterWallet = useMemo(() => {
    if (!isSupabaseConfigured()) return false

    return PROTECTED_APP_PREFIXES.some((prefix) => redirectTarget.startsWith(prefix))
  }, [redirectTarget])

  useEffect(() => {
    if (!isConnected) {
      setActiveTab('wallet')
      return
    }

    if (!hasValidCampusSession) {
      setActiveTab('campus')
      return
    }

    if (!isWalletBoundToCurrentAccount) {
      setActiveTab('wallet')
      setWalletCtaPulse(true)
    }
  }, [hasValidCampusSession, isConnected, isWalletBoundToCurrentAccount])

  useEffect(() => {
    if (!walletCtaPulse) return

    const timer = window.setTimeout(() => {
      setWalletCtaPulse(false)
    }, 3500)

    return () => window.clearTimeout(timer)
  }, [walletCtaPulse])

  useEffect(() => {
    if (authError === 'oauth_exchange_failed') {
      setFormError('Login Microsoft kampus gagal diproses. Coba lagi atau gunakan login email kampus biasa.')
      setActiveTab('campus')
      return
    }

    if (authError === 'missing_code') {
      setFormError('Balasan dari Microsoft tidak lengkap. Silakan ulangi proses login kampus.')
      setActiveTab('campus')
      return
    }

    if (authError === 'backend_not_configured') {
      setFormError('Backend login kampus belum siap untuk Microsoft SSO.')
      setActiveTab('campus')
    }
  }, [authError])

  useEffect(() => {
    if (!isConnected || !address) {
      walletHandledRef.current = false
      return
    }

    if (walletHandledRef.current) return
    walletHandledRef.current = true

    showToast({
      tone: 'success',
      title: 'Smart Wallet berhasil terhubung',
      description: 'Kamu sekarang bisa lanjut memakai wallet Base Sepolia milikmu.',
    })

    if (!hasValidCampusSession) {
      setWalletMessage('Smart Wallet sudah aktif. Langkah berikutnya, identifikasi akun kampusmu agar sistem bisa menentukan apakah kamu voter, admin, atau superadmin.')
      setActiveTab('campus')
      return
    }

    if (requiresCampusSessionAfterWallet || !isWalletBoundToCurrentAccount) {
      setWalletMessage('Smart Wallet sudah aktif. Langkah berikutnya, tautkan wallet ini ke akun kampus agar bisa dipakai masuk ke area aplikasi.')
      return
    }

    setWalletMessage('Smart Wallet aktif. Kamu akan diarahkan ke halaman tujuan.')
    const timer = window.setTimeout(() => {
      router.push(redirectTarget)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [address, hasValidCampusSession, isConnected, isWalletBoundToCurrentAccount, redirectTarget, requiresCampusSessionAfterWallet, router, showToast])

  const handlePostLoginRedirect = (role?: 'admin' | 'superadmin' | 'voter') => {
    if (!isConnected) {
      setSuccessMessage('Identifikasi kampus berhasil. Sekarang hubungkan Smart Wallet terlebih dahulu.')
      setActiveTab('wallet')
      setWalletCtaPulse(true)
      return
    }

    if (role === 'voter' && isVotingRedirect && !isWalletBoundToCurrentAccount) {
      setSuccessMessage('Identitas kampus berhasil dikenali. Sekarang tautkan Smart Wallet ini ke akun kampusmu agar bisa lanjut voting.')
      setActiveTab('wallet')
      setWalletCtaPulse(true)
      return
    }

    if (role === 'admin') {
      router.push('/admin')
      return
    }

    if (role === 'superadmin' || role === 'developer') {
      router.push('/superadmin')
      return
    }

    router.push(redirectTarget)
  }

  const handleRoleAwareRedirect = async (fallbackRole?: 'admin' | 'superadmin' | 'voter') => {
    if (!isConnected) {
      handlePostLoginRedirect(fallbackRole)
      return
    }

    const destination = isSupabaseConfigured()
      ? await resolveRoleBasedDestination(redirectTarget)
      : redirectTarget

    if ((destination === '/pemilih' && isVotingRedirect) || !isWalletBoundToCurrentAccount) {
      handlePostLoginRedirect('voter')
      return
    }

    router.push(destination)
  }

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

    const tryDummyFallback = () => {
      const dummyRole = resolveCampusLoginRole(email, password)
      if (dummyRole) {
        setSuccessMessage('Masuk via Mode Pengembangan (Dummy). Catatan: Fitur "Tautkan Wallet" tidak akan berfungsi tanpa akun Supabase asli.')
        window.setTimeout(() => {
          setIsSubmitting(false)
          if (dummyRole === 'admin') {
            void handleRoleAwareRedirect('admin')
            return
          }
          if (dummyRole === 'superadmin' || dummyRole === 'developer') {
            void handleRoleAwareRedirect('superadmin')
            return
          }
          void handleRoleAwareRedirect('voter')
        }, 1500)
        return true
      }
      return false
    }

    if (isSupabaseConfigured()) {
      loginMutation.mutate(
        { email, password },
        {
          onSuccess: async () => {
            setSuccessMessage('Login Supabase berhasil. Menyiapkan sesi...')
            window.setTimeout(async () => {
              setIsSubmitting(false)
              await handleRoleAwareRedirect()
            }, 900)
          },
          onError: (error) => {
            if (tryDummyFallback()) return
            setIsSubmitting(false)
            setFormError(getRepositoryErrorMessage(error, 'Email kampus atau password tidak cocok.'))
          },
        },
      )
      return
    }

    if (!tryDummyFallback()) {
      setIsSubmitting(false)
      setFormError('Sistem login tidak tersedia and akun tidak dikenali.')
    }
  }

  const handleMicrosoftCampusLogin = () => {
    setFormError('')
    setSuccessMessage('')

    if (!isSupabaseConfigured()) {
      setFormError('Backend login kampus belum dikonfigurasi.')
      return
    }

    microsoftLoginMutation.mutate(
      { nextPath: redirectTarget },
      {
        onError: (error) => {
          setFormError(getRepositoryErrorMessage(error, 'Login Microsoft kampus belum berhasil. Coba lagi.'))
        },
      },
    )
  }

  const handleBindWallet = () => {
    if (!address) {
      setWalletMessage('Hubungkan Smart Wallet terlebih dahulu sebelum menautkan akun kampus.')
      return
    }

    bindWalletMutation.mutate(
      {
        walletAddress: address,
        email: sessionEmail,
        displayName: currentProfile?.displayName ?? sessionDisplayName,
        avatarUrl: currentProfile?.avatarUrl ?? null,
        roleHint: currentProfile?.roleHint ?? 'microsoft-bound-wallet',
      },
      {
        onSuccess: (profile) => {
          setWalletMessage(`Wallet ${formatShortAddress(profile.walletAddress)} berhasil ditautkan ke akun kampus ${profile.email ?? sessionEmail ?? ''}.`)
          showToast({
            tone: 'success',
            title: 'Wallet berhasil ditautkan',
            description: 'Login kampus dan Smart Wallet kamu sekarang sudah tersambung.',
          })

          setSuccessMessage('Akun kampus dan Smart Wallet sudah tersambung. Kamu akan diarahkan ke halaman tujuan.')

          window.setTimeout(() => {
            void handleRoleAwareRedirect('voter')
          }, 900)
        },
        onError: (error) => {
          setWalletMessage(getRepositoryErrorMessage(error, 'Gagal menautkan wallet ke akun kampus.'))
        },
      },
    )
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader />
        
        <AuthTitle
          title="Masuk ke Votein"
          body="Hubungkan Smart Wallet, kenali akun kampus, lalu lanjut masuk."
        />

        <LoginStepIndicator currentStep={currentStep} />

        <div className="mt-6 flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('wallet')
              setWalletCtaPulse(false)
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-[12px] font-semibold transition-all ${
              activeTab === 'wallet'
                ? 'bg-white text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
               }`}
          >
            <WalletIcon className="h-3.5 w-3.5" />
            Smart Wallet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campus')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-[12px] font-semibold transition-all ${
              activeTab === 'campus'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            Akun SIA Kampus
          </button>
        </div>

        {activeTab === 'wallet' && (
          <div className="mt-6 space-y-4">
            {!hasValidCampusSession ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-[12px] leading-6 text-blue-800">
                <p className="font-semibold text-blue-900">Langkah berikutnya: kenali akun kampus</p>
                <p className="mt-1">
                  Setelah wallet terhubung, buka tab <span className="font-semibold text-blue-900">Akun SIA Kampus</span> untuk mengenali peranmu.
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-blue-300">
                  Coinbase Smart Wallet
                </span>
                <span className="text-[10px] font-medium text-slate-400">Base Sepolia</span>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Metode Utama</p>
                <h3 className="mt-1 text-[18px] font-bold tracking-tight">Masuk dengan email atau akun sosial</h3>
                <p className="mt-2 text-[12px] leading-5 text-slate-300">
                  Modal Coinbase akan membantu membuat atau membuka Smart Wallet kamu tanpa perlu ekstensi browser.
                </p>
              </div>

              <div className="mt-6 grid gap-2 border-t border-white/10 pt-4 text-[11px] text-slate-300 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                  Satu identitas wallet untuk Base Sepolia
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  Cocok untuk pemilih non-teknis
                </div>
              </div>
            </div>

            {!onchainKitConfigured ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-6 text-amber-800">
                API key OnchainKit belum diatur. Hubungkan Smart Wallet tidak bisa dibuka sampai konfigurasi frontend dilengkapi.
              </div>
            ) : null}

            {!mounted || !isConnected ? (
              <div className={`rounded-xl bg-white p-4 transition-all ${walletCtaPulse ? 'border-2 border-[#0F172A]' : 'border border-slate-200'}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Hubungkan Wallet</p>
                {walletCtaPulse ? (
                  <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] leading-5 text-blue-800">
                    Akun kampus sudah dikenali. Sekarang hubungkan Smart Wallet di bawah ini.
                  </div>
                ) : null}
                <p className="mt-2 text-[13px] leading-6 text-slate-600">
                  Gunakan email atau akun sosial yang tersedia di Coinbase untuk membuat atau membuka Smart Wallet.
                </p>

                <div className="mt-4">
                {onchainKitConfigured ? (
                  mounted ? (
                    <ConnectWallet
                      onConnect={() => {
                        setWalletMessage('Membuka Coinbase Smart Wallet. Pilih email atau akun sosial yang tersedia di modal login.')
                        setWalletCtaPulse(false)
                      }}
                      className={`group inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-md px-5 text-[14px] font-medium text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${walletCtaPulse ? 'bg-[#0F172A] shadow-[0_0_0_3px_rgba(15,23,42,0.08)] hover:bg-[#1E293B]' : 'bg-[#0F172A] hover:bg-[#1E293B]'}`}
                    >
                      <Mail className="h-4 w-4" />
                      {status === 'connecting' || status === 'reconnecting'
                        ? 'Membuka pilihan login...'
                        : 'Lanjut dengan Email / Sosial'}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </ConnectWallet>
                  ) : (
                    <div className="flex h-[42px] w-full items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[14px] font-medium text-white">
                      <Mail className="h-4 w-4" />
                      Lanjut dengan Email / Sosial
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )
                ) : (
                  <div className="flex h-[42px] w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-5 text-[13px] font-medium text-slate-400">
                    <Mail className="h-4 w-4" />
                    Hubungkan Smart Wallet belum tersedia
                  </div>
                )}
                </div>
              </div>
            ) : (
              <Wallet>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-slate-900">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[16px] font-semibold text-slate-900">Smart Wallet terhubung</h3>
                      <p className="mt-1 text-[12px] leading-5 text-slate-600">
                        Wallet kamu siap dipakai untuk tanda tangan transaksi di jaringan Base Sepolia.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4">
                    <Identity hasCopyAddressOnClick>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10" />
                        <div className="min-w-0">
                          <Name className="block truncate text-[13px] font-semibold text-slate-900" />
                          <Address className="mt-1 block truncate text-[11px] text-slate-500" />
                        </div>
                      </div>
                    </Identity>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
                      <span className="text-slate-500">Alamat aktif</span>
                      <span className="font-mono text-slate-700">{address ? formatShortAddress(address) : '-'}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {walletMessage ? (
                      <div className={`rounded-lg px-4 py-3 text-[12px] leading-6 ${requiresCampusSessionAfterWallet ? 'border border-blue-200 bg-blue-50 text-blue-800' : 'border border-emerald-200 bg-white text-emerald-700'}`}>
                        {walletMessage}
                      </div>
                    ) : null}

                    {authSession ? (
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-[12px] leading-6 text-slate-700">
                        <div className="flex items-start gap-2">
                          <Link2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                          <div>
                            <p className="font-semibold text-slate-900">Status akun kampus</p>
                            <p className="mt-1">
                              Masuk sebagai <span className="font-semibold text-slate-900">{sessionEmail ?? 'akun kampus aktif'}</span>.
                              {isWalletBoundToCurrentAccount
                                ? ' Wallet ini sudah cocok dengan akunmu.'
                                : ' Tautkan wallet ini agar identitas kampus dan wallet sama.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {requiresCampusSessionAfterWallet ? (
                      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-[12px] leading-6 text-slate-700">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                          <p>
                            Area aplikasi tetap memakai akun kampus. Wallet ini dipakai untuk transaksi on-chain.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {canBindMicrosoftToWallet && !isWalletBoundToCurrentAccount ? (
                        <button
                          type="button"
                          onClick={handleBindWallet}
                          disabled={bindWalletMutation.isPending}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {bindWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                          {currentProfileHasDifferentWallet ? 'Perbarui Tautan Wallet' : 'Tautkan ke Akun Kampus'}
                        </button>
                      ) : null}

                      {requiresCampusSessionAfterWallet ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (isVotingRedirect && !isWalletBoundToCurrentAccount) return
                            setActiveTab('campus')
                          }}
                          disabled={isVotingRedirect && !isWalletBoundToCurrentAccount}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-medium text-white hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                        >
                          {isVotingRedirect && !isWalletBoundToCurrentAccount ? 'Tautkan Wallet Dulu' : 'Lanjut ke Voting'}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!canContinueToProtectedVoting) return
                            router.push(redirectTarget)
                          }}
                          disabled={!canContinueToProtectedVoting}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-5 text-[13px] font-medium text-white hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                        >
                          {isVotingRedirect && !isWalletBoundToCurrentAccount ? 'Tautkan Wallet Dulu' : 'Lanjut ke Halaman Tujuan'}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          disconnect()
                          setWalletMessage('')
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                      >
                        Putuskan Wallet
                      </button>
                    </div>
                  </div>
                </div>
              </Wallet>
            )}
          </div>
        )}

        {activeTab === 'campus' && (
          <form className="mt-6" onSubmit={handleCampusSubmit}>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Akses Microsoft UAJY</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Masuk dengan akun kampus untuk mengenali apakah kamu voter, admin, atau superadmin.
              </p>

              {authSession ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] leading-6 text-emerald-800">
                    Kamu sudah masuk sebagai <span className="font-semibold">{sessionEmail ?? 'akun kampus aktif'}</span>. Jika wallet sudah aktif, kembali ke tab sebelah untuk menautkannya.
                  </div>
                  <button
                    type="button"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {logoutMutation.isPending ? 'Mengakhiri sesi...' : 'Keluar dari Akun Kampus'}
                  </button>
                </div>
              ) : null}

              {!authSession && isVotingRedirect ? (
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[12px] leading-6 text-blue-800">
                  Urutannya: <span className="font-semibold">hubungkan wallet</span>, <span className="font-semibold">masuk akun kampus</span>, lalu <span className="font-semibold">tautkan wallet</span>.
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleMicrosoftCampusLogin}
                disabled={microsoftLoginMutation.isPending}
                className="mt-4 inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-900 transition-colors duration-150 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {microsoftLoginMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                {microsoftLoginMutation.isPending ? 'Mengarahkan ke Microsoft...' : 'Masuk dengan Microsoft UAJY'}
              </button>

              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                Jika login Microsoft belum tersedia, gunakan form email dan password di bawah.
              </p>
            </div>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[11px] text-slate-400">atau</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

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
                Demo lokal: voter (voter12345), admin (admin12345), superadmin (superadmin123456).
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
