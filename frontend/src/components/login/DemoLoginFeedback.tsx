'use client'

import { ToastNotice } from '@/components/ui/ToastNotice'

interface DemoLoginFeedbackProps {
  forceFail: boolean
  onForceFailChange: (value: boolean) => void
  onDismiss: () => void
  feedback?: {
    variant: 'success' | 'danger'
    message: string
  } | null
}

export function DemoLoginFeedback({ forceFail, onForceFailChange, onDismiss, feedback }: DemoLoginFeedbackProps) {
  return (
    <div className="mt-4 space-y-3">
      <label className="flex items-center gap-2 text-xs text-slate-500">
        <input checked={forceFail} onChange={(event) => onForceFailChange(event.target.checked)} type="checkbox" />
        Mode demo gagal login
      </label>

      {feedback ? (
        <ToastNotice
          description={feedback.variant === 'success' ? 'Lanjutkan demo sesuai alur peran yang dipilih.' : 'Periksa mode demo atau data input, lalu coba lagi.'}
          onClose={onDismiss}
          title={feedback.message}
          variant={feedback.variant}
        />
      ) : null}
    </div>
  )
}
