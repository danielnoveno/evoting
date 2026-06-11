'use client'

import { Loader2 } from 'lucide-react'

interface AuthSuccessRedirectModalProps {
  open: boolean
  title?: string
  description: string
  targetLabel: string
}

export function AuthSuccessRedirectModal({
  open,
  title = 'Akses Berhasil Divalidasi',
  description,
  targetLabel,
}: AuthSuccessRedirectModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-success-redirect-title"
      aria-describedby="auth-success-redirect-description"
    >
      <div className="w-full max-w-[360px] rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
        </div>

        <h2 id="auth-success-redirect-title" className="mt-5 text-[16px] font-semibold text-slate-900">
          {title}
        </h2>
        <p id="auth-success-redirect-description" className="mt-3 text-[13px] leading-6 text-slate-600">
          {description}
        </p>

        <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3" aria-live="polite">
          <p className="text-[12px] font-semibold text-slate-900">Mengarahkan ke {targetLabel}...</p>
          <p className="mt-1 text-[12px] leading-5 text-slate-400">Mohon tunggu sebentar, proses ini berjalan otomatis.</p>
        </div>
      </div>
    </div>
  )
}
