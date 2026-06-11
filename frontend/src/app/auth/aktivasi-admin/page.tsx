'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import {
  ShieldCheck,
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
import { useAdminInvitePreview, useClaimAdminInvite } from '@/hooks/use-admin-invite'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { ScrollReveal, FloatingShape } from '@/components/public/parallax'
import { AsciiBackground } from '@/components/public/ascii-background'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'

function ActivationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  
  const authSessionQuery = useAuthSession()
  const microsoftLoginMutation = useMicrosoftCampusLogin()
  const googleLoginMutation = useGoogleLogin()
  
  const inviteToken = searchParams.get('invite')?.trim() ?? ''
  const invitePreviewQuery = useAdminInvitePreview(inviteToken)
  const claimInviteMutation = useClaimAdminInvite()

  const [mounted, setMounted] = useState(false)
  const [claimStarted, setClaimStarted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const authSession = authSessionQuery.data
  const invitePreview = invitePreviewQuery.data
  const isSuperAdmin = invitePreview?.role === 'super_admin'
  const isAdmin = invitePreview?.role === 'admin'
  const isCorrectAccount = invitePreview && authSession?.user?.email?.toLowerCase() === invitePreview.email.toLowerCase()

  const handleClaim = useCallback(() => {
    if (claimStarted || !inviteToken) return
    setClaimStarted(true)
    
    claimInviteMutation.mutate(inviteToken, {
      onSuccess: () => {
        showToast({ 
          tone: 'success', 
          title: 'Akun Diaktifkan', 
          description: `Selamat datang, ${invitePreview?.displayName || 'Admin'}. Akun Anda telah aktif.` 
        })
        window.setTimeout(() => { 
          router.replace(isSuperAdmin ? '/portal-admin' : '/hubungkan-dompet?activate=admin&redirect=%2Fadmin') 
        }, 2000)
      },
      onError: (err) => {
        setClaimStarted(false)
        console.error('Activation failed:', err)
      }
    })
  }, [claimStarted, inviteToken, claimInviteMutation, invitePreview, isSuperAdmin, router, showToast])

  // Auto-claim trigger — for all admin roles using SSO flow
  useEffect(() => {
    if (mounted && inviteToken && authSession && isCorrectAccount && !claimStarted && invitePreview?.status !== 'active') {
      handleClaim()
    }
  }, [mounted, inviteToken, authSession, isCorrectAccount, claimStarted, invitePreview, handleClaim])

  const handleSSOLogin = useCallback((provider: 'microsoft' | 'google') => {
    const mutation = provider === 'microsoft' ? microsoftLoginMutation : googleLoginMutation
    mutation.mutate({ nextPath: `/auth/aktivasi-admin?invite=${inviteToken}` })
  }, [microsoftLoginMutation, googleLoginMutation, inviteToken])

  if (!mounted) return null

  const pageTitle = isSuperAdmin ? 'Aktivasi Akun Superadmin' : 'Aktivasi Akun Admin Organisasi'
  const pageSubtitle = 'Gunakan akun kampus (SSO) untuk memverifikasi identitas dan mengaktifkan akses Anda ke portal admin Votein.'
  const isActivating = claimInviteMutation.isPending
  const isActivationSuccess = claimInviteMutation.isSuccess
  const activationError = claimInviteMutation.error

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PublicNavbar activePath="/auth/aktivasi-admin" minimal />
      
      <div className="relative flex flex-1 items-center justify-center p-4 md:p-8">
        <AsciiBackground />
        <FloatingShape
          speed={-0.06}
          className="left-[-80px] top-[120px] h-[320px] w-[320px] rounded-full bg-gradient-to-br from-blue-100/40 to-indigo-50/20 blur-3xl"
        />
        <FloatingShape
          speed={0.04}
          className="right-[-60px] top-[60px] h-[260px] w-[260px] rounded-full bg-gradient-to-bl from-slate-100/60 to-purple-50/20 blur-3xl"
        />

        <ScrollReveal variant="fade-up" duration={800} className="relative z-10 w-full max-w-[600px]">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl md:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {isSuperAdmin ? <ShieldCheck className="h-8 w-8" /> : <Building2 className="h-8 w-8" />}
              </div>
              
              <h1 className="mt-6 text-[24px] font-bold tracking-tight text-slate-900 md:text-[28px]">
                {pageTitle}
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
                {pageSubtitle}
              </p>
            </div>

            <div className="mt-10 space-y-6">
              {invitePreviewQuery.isLoading ? (
                <div className="space-y-4">
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-50" />
                  <div className="h-12 animate-pulse rounded-xl bg-slate-50" />
                </div>
              ) : invitePreviewQuery.error && !isActivationSuccess ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
                  <h3 className="mt-3 font-semibold text-red-900">Link Aktivasi Tidak Valid</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-red-700">
                    {getRepositoryErrorMessage(invitePreviewQuery.error, 'Undangan mungkin sudah kadaluwarsa atau sudah digunakan.')}
                  </p>
                  <Link href="/portal-admin" className="mt-5 inline-flex font-semibold text-blue-600 hover:underline">
                    Kembali ke Login Portal →
                  </Link>
                </div>
              ) : invitePreview || isActivationSuccess ? (
                <>
                  {invitePreview && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Institusi / Organisasi</p>
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
                      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                      <p className="mt-4 font-medium text-slate-900">Mengaktifkan akun Anda...</p>
                      <p className="mt-1 text-[13px] text-slate-500">Mohon tunggu sebentar, kami sedang memproses data organisasi.</p>
                    </div>
                  ) : isActivationSuccess ? (
                    /* ── Success state ── */
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <h3 className="mt-6 text-[20px] font-bold text-slate-900">Aktivasi Berhasil!</h3>
                      <p className="mt-2 text-[14px] text-slate-600">Akun Anda telah aktif. Mengarahkan Anda ke portal admin...</p>
                    </div>
                  ) : (
                    /* ── SSO flow ── */
                    <div className="space-y-4">
                      {!authSession ? (
                        <div className="space-y-4">
                          <div className="rounded-xl bg-amber-50 p-4">
                            <div className="flex gap-3">
                              <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                              <p className="text-[12px] leading-5 text-amber-800">
                                Sesuai kebijakan keamanan platform, aktivasi admin <strong>wajib</strong> menggunakan Single Sign-On (SSO) kampus. Tidak ada password manual yang diperlukan.
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSSOLogin('microsoft')}
                            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 transition hover:bg-slate-50"
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
                            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 transition hover:bg-slate-50"
                          >
                            <img src="https://www.google.com/favicon.ico" className="h-5 w-5" alt="Google" />
                            Verifikasi dengan Google Workspace
                          </button>
                        </div>
                      ) : isCorrectAccount ? (
                        <div className="space-y-4">
                          <div className="rounded-xl bg-emerald-50 p-4">
                            <p className="text-center text-[13px] font-medium text-emerald-800">
                              Anda sudah masuk dengan akun yang sesuai: <strong>{authSession.user.email}</strong>
                            </p>
                          </div>
                          <button
                            onClick={handleClaim}
                            className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 font-bold text-white transition hover:bg-slate-800"
                          >
                            Konfirmasi Aktivasi Akun
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
                            className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 font-bold text-white transition hover:bg-slate-800"
                          >
                            Ganti Akun SSO
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Activation error ── */}
                  {activationError && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                      <p className="text-center text-[13px] font-medium text-red-700">
                        {getRepositoryErrorMessage(activationError, 'Gagal mengaktifkan akun. Silakan coba lagi.')}
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="mt-12 flex items-center justify-center border-t border-slate-100 pt-8">
              <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-400 transition hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
      
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
