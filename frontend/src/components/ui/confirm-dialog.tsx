'use client'

import type { ReactNode } from 'react'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  tone = 'default',
  disabled = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  disabled?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 px-4">
      <button type="button" aria-label="Tutup dialog konfirmasi" className="absolute inset-0" onClick={onCancel} />
      <div className="relative w-full max-w-[400px] rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
        <div className="mt-3 text-[14px] leading-7 text-slate-800">{description}</div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="inline-flex h-10 items-center justify-center rounded-md px-4 text-[13px] font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className={tone === 'danger'
              ? 'inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-[13px] font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40'
              : 'inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
