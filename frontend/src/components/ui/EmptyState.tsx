import { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  subtitle: string
  action?: ReactNode
}

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 h-10 w-10 rounded-full bg-slate-100" />
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-[280px] text-[13px] leading-relaxed text-slate-400">{subtitle}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
