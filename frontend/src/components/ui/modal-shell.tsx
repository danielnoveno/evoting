'use client'

import { ReactNode } from 'react'

export function ModalShell({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-900/35 px-4">
      <button type="button" aria-label="Tutup modal" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[560px] rounded-[30px] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <h2 className="text-[22px] font-semibold text-slate-900">{title}</h2>
        {description ? <p className="mt-3 text-[15px] leading-7 text-slate-500">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
