'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import {
  Loader2,
  ArrowLeft,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Lock,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { useAuthSession, useMicrosoftCampusLogin, useGoogleLogin } from '@/hooks/use-auth-session'
import { useAdminInvitePreview } from '@/hooks/use-admin-invite'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { AuthSuccessRedirectModal } from '@/components/auth/auth-success-redirect-modal'
import { AuthCard, AuthHeader, AuthTitle } from '@/components/auth/auth-shell'

function getActivationRedirectModalContent(isSuperAdmin: boolean) {
  if (isSuperAdmin) {
    return {
      title: 'Identitas Terverifikasi',
      description: 'Verifikasi akun kampus berhasil. Anda akan diarahkan ke halaman validasi portal admin.',
      targetLabel: 'Portal Admin',
    }
  }

  return {
    title: 'Identitas Terverifikasi',
    description: 'Verifikasi akun kampus berhasil. Anda akan diarahkan ke halaman hubungkan dompet untuk menyelesaikan aktivasi.',
    targetLabel: 'Hubungkan Dompet',
  }
}

function ActivationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  
  const authSessionQuery = useAuthSession()
  const microsoftLoginMutation = useMicrosoftCampusLogin()
  const googleLoginMutation = useGoogleLogin()
  
  const inviteToken = searchParams.get('invite')?.trim() ?? ''
  const invitePreviewQuery = useAdminInvitePreview(inviteToken)

  const [mounted, setMounted] = useState(false)
  const [redirectModal, setRedirectModal] = useState<ReturnType<typeof getActivationRedirectModalContent> | null>(null)
  const redirectTimerRef = useRef<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current)
    }
  }, [])

  const authSession = authSessionQuery.data
  const invitePreview = invitePreviewQuery.data
  const isSuperAdmin = invitePreview?.role === 'super_admin'
  const isCorrectAccount = invitePreview && authSession?.user?.email?.toLowerCase() === invitePreview.email.toLowerCase()

  const handleContinueToWallet = useCallback(() => {
    if (!inviteToken) return
    showToast({
      tone: 'success',
      title: 'Identitas Terverifikasi',
      description: 'Lanjutkan dengan menghubungkan Smart Wallet admin organisasi.',
    })
    setRedirectModal(getActivationRedirectModalContent(isSuperAdmin))
    const redirect = isSuperAdmin ? '/portal-admin' : '/admin'
    const nextParams = new URLSearchParams({ activate: 'admin', token: inviteToken, redirect })
    redirectTimerRef.current = window.setTimeout(() => {
      router.replace(`/hubungkan-dompet?${nextParams.toString()}`)
    }, 1200)
  }, [inviteToken, isSuperAdmin, router, showToast])

  // Auto-continue trigger — SSO verifies identity; wallet binding performs final activation.
  useEffect(() => {
    if (mounted && inviteToken && authSession && isCorrectAccount && invitePreview?.status !== 'active' && !redirectModal) {
      handleContinueToWallet()
    }
  }, [mounted, inviteToken, authSession, isCorrectAccount, invitePreview, redirectModal, handleContinueToWallet])

  const handleSSOLogin = useCallback((provider: 'microsoft' | 'google') => {
    const mutation = provider === 'microsoft' ? microsoftLoginMutation : googleLoginMutation
    mutation.mutate({ nextPath: `/auth/aktivasi-admin?invite=${inviteToken}` })
  }, [microsoftLoginMutation, googleLoginMutation, inviteToken])

  if (!mounted) return null

  const pageTitle = isSuperAdmin ? 'Aktivasi Akun Superadmin' : 'Aktivasi Akun Admin Organisasi'
  const pageSubtitle = 'Gunakan akun kampus (SSO) untuk memverifikasi identitas dan mengaktifkan akses Anda ke portal admin Votein.'
  const isActivating = Boolean(redirectModal)
  const isActivationSuccess = false

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PublicNavbar activePath="/auth/aktivasi-admin" minimal />
      
      <div className="flex flex-1 items-center justify-center px-4 py-6 md:px-5 lg:px-6">
        <AuthCard className="max-w-[480px]">
            <AuthHeader />
            <AuthTitle title={pageTitle} body={pageSubtitle} />

            <div className="mt-8 space-y-5">
              {invitePreviewQuery.isLoading ? (
                <div className="space-y-4">
                  <div className="h-20 animate-pulse rounded-lg border border-slate-100 bg-slate-50" />
                  <div className="h-11 animate-pulse rounded-md bg-slate-50" />
                </div>
              ) : invitePreviewQuery.error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-center">
                  <AlertTriangle className="mx-auto h-7 w-7 text-red-600" />
                  <h3 className="mt-3 font-semibold text-red-900">Link Aktivasi Tidak Valid</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-red-700">
                    {getRepositoryErrorMessage(invitePreviewQuery.error, 'Undangan mungkin sudah kadaluwarsa atau sudah digunakan.')}
                  </p>
                  <Link href="/portal-admin" className="mt-5 inline-flex text-[13px] font-semibold text-slate-900 hover:underline">
                    Kembali ke Login Portal →
                  </Link>
                </div>
              ) : invitePreview || isActivationSuccess ? (
                <>
                  {invitePreview && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-900 ring-1 ring-slate-200">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">Institusi / Organisasi</p>
                          <p className="mt-1 truncate text-[16px] font-semibold text-slate-900">{invitePreview.displayName || (isSuperAdmin ? 'Superadmin' : 'Admin Organisasi')}</p>
                          <div className="mt-3 flex items-center gap-2 text-[13px] text-slate-600">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{invitePreview.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Loading state ── */}
                  {isActivating ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Loader2 className="h-9 w-9 animate-spin text-slate-900" />
                      <p className="mt-4 font-medium text-slate-900">Mengaktifkan akun Anda...</p>
                      <p className="mt-1 text-[13px] text-slate-500">Mohon tunggu sebentar, kami sedang memproses data organisasi.</p>
                    </div>
                  ) : isActivationSuccess ? (
                    /* ── Success state ── */
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <h3 className="mt-6 text-[20px] font-bold text-slate-900">Aktivasi Berhasil!</h3>
                      <p className="mt-2 text-[14px] text-slate-600">Akun Anda telah aktif. Mengarahkan Anda ke portal admin...</p>
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
                                Sesuai kebijakan keamanan platform, aktivasi admin <strong>wajib</strong> menggunakan Single Sign-On (SSO) kampus. Tidak ada password manual yang diperlukan.
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
                            Verifikasi dengan Microsoft SSO
                          </button>
                          
                          <button
                            onClick={() => handleSSOLogin('google')}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <img src="https://www.google.com/favicon.ico" className="h-5 w-5" alt="Google" />
                            Verifikasi dengan Google Workspace
                          </button>
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
                            Lanjut Hubungkan Dompet Admin
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                            <p className="text-center text-[13px] leading-relaxed text-red-700">
                              Anda masuk sebagai <strong>{authSession.user.email}</strong>, tetapi undangan ini untuk <strong>{invitePreview?.email}</strong>.
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

                  {/* ── Activation error ── */}
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

export default function AktivasiAdminPage() {
  return (
    <Suspense fallback={null}>
      <ActivationContent />
    </Suspense>
  )
}
