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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-[400px] rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        <p className="mt-3 text-[14px] leading-7 text-slate-800">{description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="inline-flex h-10 items-center justify-center rounded-md px-4 text-[13px] font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={tone === 'danger'
              ? 'inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-[13px] font-medium text-red-600 hover:bg-red-50'
              : 'inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
