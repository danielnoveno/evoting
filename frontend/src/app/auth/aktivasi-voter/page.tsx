'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import {
  Loader2,
  ArrowLeft,
  User,
  AlertTriangle,
  Mail,
} from 'lucide-react'
import { useActivationTokenPreview } from '@/hooks/use-activation-token'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'
import { AuthSuccessRedirectModal } from '@/components/auth/auth-success-redirect-modal'
import { AuthCard, AuthHeader, AuthTitle } from '@/components/auth/auth-shell'

function ActivationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

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

  const tokenPreview = tokenPreviewQuery.data

  const handleContinueToWallet = useCallback(() => {
    if (!activationToken) return
    // ponytail: wallet-first — langsung ke hubungkan-dompet tanpa SSO di sini
    const nextParams = new URLSearchParams({ activate: 'voter', token: activationToken, redirect: '/pemilih' })
    router.replace(`/hubungkan-dompet?${nextParams.toString()}`)
  }, [activationToken, router])

  // ponytail: wallet-first — auto-redirect ke hubungkan-dompet begitu token valid
  useEffect(() => {
    if (mounted && activationToken && tokenPreview?.isValid && !redirectModal) {
      handleContinueToWallet()
    }
  }, [mounted, activationToken, tokenPreview, redirectModal, handleContinueToWallet])

  if (!mounted) return null

  const pageTitle = 'Aktivasi Hak Suara Pemilih'
  const pageSubtitle = 'Memverifikasi token aktivasi dan mengarahkan ke halaman hubungkan dompet.'
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
                    /* ponytail: wallet-first — tidak ada SSO di halaman ini, langsung redirect */
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Loader2 className="h-9 w-9 animate-spin text-slate-900" />
                      <p className="mt-4 font-medium text-slate-900">Mempersiapkan aktivasi...</p>
                      <p className="mt-1 text-[13px] text-slate-500">Anda akan diarahkan ke halaman hubungkan dompet.</p>
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
