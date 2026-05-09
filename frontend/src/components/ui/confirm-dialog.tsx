'use client'

import { ReactNode } from 'react'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  tone = 'default',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/35 px-4">
      <div className="w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <h2 className="text-[20px] font-semibold text-slate-900">{title}</h2>
        <p className="mt-3 text-[15px] leading-7 text-slate-500">{description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-700 hover:bg-slate-200">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={tone === 'danger'
              ? 'inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-[14px] font-medium text-white hover:bg-red-700'
              : 'inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white hover:bg-slate-900'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
