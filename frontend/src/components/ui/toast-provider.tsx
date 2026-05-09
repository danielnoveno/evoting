'use client'

import { X } from 'lucide-react'
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

type ToastTone = 'success' | 'error' | 'info'

type ToastItem = {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function toneClassName(tone: ToastTone) {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (tone === 'error') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-slate-200 bg-white text-slate-700'
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((items) => items.filter((item) => item.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((items) => [...items, { ...toast, id }])
    window.setTimeout(() => dismissToast(id), toast.tone === 'error' ? 5000 : 3200)
  }, [dismissToast])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-[360px] flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ${toneClassName(toast.tone)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-[12px] leading-6 opacity-90">{toast.description}</p> : null}
              </div>
              <button type="button" onClick={() => dismissToast(toast.id)} className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/60">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
