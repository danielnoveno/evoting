'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import {
  Loader2,
  ArrowLeft,
  User,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Lock,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useMicrosoftCampusLogin, useGoogleLogin } from '@/hooks/use-auth-session'
import { useActivationTokenPreview } from '@/hooks/use-activation-token'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { AuthSuccessRedirectModal } from '@/components/auth/auth-success-redirect-modal'
import { AuthCard, AuthHeader, AuthTitle } from '@/components/auth/auth-shell'

function ActivationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const authSessionQuery = useAuthSession()
  const microsoftLoginMutation = useMicrosoftCampusLogin()
  const googleLoginMutation = useGoogleLogin()

  const activationToken = searchParams.get('token')?.trim() ?? ''
  const tokenPreviewQuery = useActivationTokenPreview(activationToken)

  const [mounted, setMounted] = useState(false)
  const [redirectModal, setRedirectModal] = useState<{ title: string; description: string; targetLabel: string } | null>(null)
  const redirectTimerRef = useRef<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current)
    }
  }, [])

  const authSession = authSessionQuery.data
  const tokenPreview = tokenPreviewQuery.data
  const isCorrectAccount = tokenPreview && authSession?.user?.email?.toLowerCase() === tokenPreview.email.toLowerCase()

  const handleContinueToWallet = useCallback(() => {
    if (!activationToken) return
    showToast({
      tone: 'success',
      title: 'Identitas Terverifikasi',
      description: 'Lanjutkan dengan menghubungkan Smart Wallet untuk mengaktifkan hak suara.',
    })
    setRedirectModal({
      title: 'Identitas Terverifikasi',
      description: 'Verifikasi akun kampus berhasil. Anda akan diarahkan ke halaman hubungkan dompet untuk menyelesaikan aktivasi.',
      targetLabel: 'Hubungkan Dompet',
    })
    const nextParams = new URLSearchParams({ activate: 'voter', token: activationToken, redirect: '/pemilih' })
    redirectTimerRef.current = window.setTimeout(() => {
      router.replace(`/hubungkan-dompet?${nextParams.toString()}`)
    }, 1200)
  }, [activationToken, router, showToast])

  // Auto-continue trigger — SSO verifies identity; wallet binding performs final activation.
  useEffect(() => {
    if (mounted && activationToken && authSession && isCorrectAccount && tokenPreview?.isValid && !redirectModal) {
      handleContinueToWallet()
    }
  }, [mounted, activationToken, authSession, isCorrectAccount, tokenPreview, redirectModal, handleContinueToWallet])

  const handleSSOLogin = useCallback((provider: 'microsoft' | 'google') => {
    const mutation = provider === 'microsoft' ? microsoftLoginMutation : googleLoginMutation
    mutation.mutate({ nextPath: `/auth/aktivasi-voter?token=${activationToken}` })
  }, [microsoftLoginMutation, googleLoginMutation, activationToken])

  if (!mounted) return null

  const pageTitle = 'Aktivasi Hak Suara Pemilih'
  const pageSubtitle = 'Gunakan akun kampus (SSO) untuk memverifikasi identitas dan mengaktifkan hak suara Anda di Votein.'
  const isActivating = Boolean(redirectModal)

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PublicNavbar activePath="/auth/aktivasi-voter" minimal />

      <div className="flex flex-1 items-center justify-center px-4 py-6 md:px-5 lg:px-6">
        <AuthCard className="max-w-[480px]">
            <AuthHeader />
            <AuthTitle title={pageTitle} body={pageSubtitle} />

            <div className="mt-8 space-y-5">
              {tokenPreviewQuery.isLoading ? (
                <div className="space-y-4">
                  <div className="h-20 animate-pulse rounded-lg border border-slate-100 bg-slate-50" />
                  <div className="h-11 animate-pulse rounded-md bg-slate-50" />
                </div>
              ) : tokenPreviewQuery.error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-center">
                  <AlertTriangle className="mx-auto h-7 w-7 text-red-600" />
                  <h3 className="mt-3 font-semibold text-red-900">Link Aktivasi Tidak Valid</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-red-700">
                    {(tokenPreviewQuery.error as Error).message ?? 'Token aktivasi mungkin sudah kadaluwarsa atau sudah digunakan.'}
                  </p>
                  <Link href="/" className="mt-5 inline-flex text-[13px] font-semibold text-slate-900 hover:underline">
                    Kembali ke Beranda →
                  </Link>
                </div>
              ) : tokenPreview || isActivating ? (
                <>
                  {tokenPreview && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-900 ring-1 ring-slate-200">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Hak Suara Pemilih</p>
                          <p className="mt-1 truncate text-[16px] font-semibold text-slate-900">Pemilih Aktif</p>
                          <div className="mt-3 flex items-center gap-2 text-[13px] text-slate-600">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{tokenPreview.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Loading state ── */}
                  {isActivating ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Loader2 className="h-9 w-9 animate-spin text-slate-900" />
                      <p className="mt-4 font-medium text-slate-900">Mengaktifkan hak suara Anda...</p>
                      <p className="mt-1 text-[13px] text-slate-500">Mohon tunggu sebentar, kami sedang memproses aktivasi.</p>
                    </div>
                  ) : (
                    /* ── SSO flow ── */
                    <div className="space-y-4">
                      {!authSession ? (
                        <div className="space-y-4">
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="flex gap-3">
                              <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                              <p className="text-[12px] leading-5 text-amber-800">
                                Untuk keamanan, aktivasi hak suara <strong>wajib</strong> menggunakan Single Sign-On (SSO) kampus. Tidak ada password manual yang diperlukan.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSSOLogin('microsoft')}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
                              <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
                              <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
                              <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
                              <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
                            </svg>
                            Masuk dengan Microsoft SSO
                          </button>

                          {/* ponytail: Google SSO dihapus untuk voter, hanya Microsoft SSO */}
                        </div>
                      ) : isCorrectAccount ? (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-center text-[13px] font-medium text-emerald-800">
                              Anda sudah masuk dengan akun yang sesuai: <strong>{authSession.user.email}</strong>
                            </p>
                          </div>
                          <button
                            onClick={handleContinueToWallet}
                            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B]"
                          >
                            Lanjut Hubungkan Dompet
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                            <p className="text-center text-[13px] leading-relaxed text-red-700">
                              Anda masuk sebagai <strong>{authSession.user.email}</strong>, tetapi aktivasi ini untuk <strong>{tokenPreview?.email}</strong>.
                            </p>
                          </div>
                          <button
                            onClick={() => handleSSOLogin('microsoft')}
                            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#0F172A] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1E293B]"
                          >
                            Ganti Akun SSO
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="mt-8 flex items-center justify-center border-t border-slate-100 pt-6">
              <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-400 transition hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </div>
        </AuthCard>
      </div>

      {redirectModal ? (
        <AuthSuccessRedirectModal
          open
          title={redirectModal.title}
          description={redirectModal.description}
          targetLabel={redirectModal.targetLabel}
        />
      ) : null}

      <PublicFooter />
    </main>
  )
}

export default function AktivasiVoterPage() {
  return (
    <Suspense fallback={null}>
      <ActivationContent />
    </Suspense>
  )
}
