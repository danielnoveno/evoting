"use client"

import { useEffect } from 'react'
import { AlertCircle, CheckCircle2, TriangleAlert, X } from 'lucide-react'

import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'danger' | 'warning' | 'info'

interface ToastNoticeProps {
  variant: ToastVariant
  title: string
  description?: string
  onClose: () => void
}

const toneStyles: Record<ToastVariant, string> = {
  success: 'border-slate-900 bg-slate-900 text-white',
  danger: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-slate-200 bg-white text-slate-800',
}

const toneIcons = {
  success: CheckCircle2,
  danger: AlertCircle,
  warning: TriangleAlert,
  info: AlertCircle,
}

export function ToastNotice({ variant, title, description, onClose }: ToastNoticeProps) {
  const Icon = toneIcons[variant]

  useEffect(() => {
    if (variant !== 'success' && variant !== 'info') {
      return
    }

    const timeout = window.setTimeout(() => {
      onClose()
    }, 3000)

    return () => window.clearTimeout(timeout)
  }, [onClose, variant])

  return (
    <div className="fixed right-4 top-4 z-[70] w-[min(320px,calc(100vw-2rem))] animate-[fadeIn_200ms_ease]">
      <div className={cn('rounded-lg border p-3 pr-10', toneStyles[variant])} role="status" aria-live="polite">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold leading-snug">{title}</p>
            {description ? <p className="mt-1 text-xs opacity-90">{description}</p> : null}
          </div>
        </div>

        <button
          aria-label="Tutup notifikasi"
          className="absolute right-2 top-2 rounded p-1 opacity-80 transition-opacity hover:opacity-100"
          onClick={onClose}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
