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
} from 'lucide-react'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { Address, Avatar, Identity, Name } from '@coinbase/onchainkit/identity'
import { useAccount, useDisconnect } from 'wagmi'
import { AuthShell, AuthCard, AuthTitle } from '@/components/auth/auth-shell'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useMicrosoftCampusLogin } from '@/hooks/use-auth-session'
import { useBindCurrentWallet, useCurrentProfile } from '@/hooks/use-profile'
import { ScrollReveal } from '@/components/public/parallax'
import Link from 'next/link'

function PortalAdminContent() {
  const router = useRouter()
  const { showToast } = useToast()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const authSessionQuery = useAuthSession()
  const currentProfileQuery = useCurrentProfile()
  const bindWalletMutation = useBindCurrentWallet()
  const microsoftLoginMutation = useMicrosoftCampusLogin()

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const authSession = authSessionQuery.data
  const currentProfile = currentProfileQuery.data
  const isWalletBound = Boolean(address && currentProfile?.walletAddress === address)

  useEffect(() => {
    if (mounted && isConnected && authSession && isWalletBound) {
      if (currentProfile?.role === 'super_admin') {
        showToast({ tone: 'success', title: 'Akses Diterima', description: 'Selamat datang di Portal Utama Admin.' })
        router.push('/superadmin')
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

  if (!mounted) return null

  return (
    <AuthShell>
      <div className="flex w-full flex-col gap-6">
        <div className="mx-auto flex w-full max-w-[432px] flex-col gap-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </Link>

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] bg-blue-600 shadow-lg shadow-blue-200">
               <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <AuthTitle 
            title="Portal Utama Admin" 
            body="Sistem Manajemen Pemilihan Universitas Atma Jaya Yogyakarta." 
          />

          <AuthCard>
            <div className="flex flex-col gap-8">
              {/* STEP 1: WALLET */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isConnected ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                      <WalletIcon className="h-4 w-4" />
                    </div>
                    <h2 className="text-[14px] font-semibold text-slate-900">1. Otoritas Wallet</h2>
                  </div>
                  {isConnected && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                </div>

                {!isConnected ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-[13px] leading-6 text-slate-500">
                      Hubungkan wallet resmi untuk menandatangani verifikasi pemilihan.
                    </p>
                    <ConnectWallet 
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Hubungkan Wallet Admin
                      <ChevronRight className="h-4 w-4" />
                    </ConnectWallet>
                  </div>
                ) : (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
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
                      <button onClick={() => disconnect()} className="text-[11px] font-semibold text-red-600">Ganti</button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: MICROSOFT */}
              <div className={`flex flex-col gap-4 transition-opacity duration-300 ${!isConnected ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${authSession ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <h2 className="text-[14px] font-semibold text-slate-900">2. Verifikasi Staf Admin</h2>
                  </div>
                  {authSession && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                </div>

                {!authSession ? (
                  <button 
                    onClick={handleMicrosoftLogin}
                    disabled={microsoftLoginMutation.isPending}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    {microsoftLoginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Login Staf @uajy.ac.id
                  </button>
                ) : (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <p className="truncate text-[13px] font-semibold text-slate-900">{authSession.user?.email}</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* FINAL BINDING */}
              {isConnected && authSession && !isWalletBound && (
                <ScrollReveal variant="fade-up">
                  <div className="rounded-xl bg-blue-600 p-5 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="h-5 w-5 text-blue-200" />
                      <h3 className="text-[15px] font-semibold">Validasi Otoritas</h3>
                    </div>
                    <p className="mt-2 text-[13px] leading-6 text-blue-100">
                      Konfirmasikan tautan wallet untuk mengelola sistem pemilihan fakultas.
                    </p>
                    <button 
                      onClick={handleBind}
                      disabled={bindWalletMutation.isPending}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-[13px] font-semibold text-blue-600 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {bindWalletMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                      Masuk Dashboard Admin
                    </button>
                  </div>
                </ScrollReveal>
              )}
            </div>
          </AuthCard>
        </div>

        <footer className="mt-4 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">
            Official University Administration Portal
          </p>
        </footer>
      </div>
    </AuthShell>
  )
}

export default function PortalAdminPage() {
  return (
    <Suspense fallback={null}>
      <PortalAdminContent />
    </Suspense>
  )
}


