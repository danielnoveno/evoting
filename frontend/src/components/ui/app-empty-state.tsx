import { ReactNode } from 'react'

export interface AppEmptyStateProps {
  title: string
  description: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function AppEmptyState({ title, description, icon, action, className = '' }: AppEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center ${className}`}>
      {icon ? (
        <div className="mb-4 flex h-10 w-10 items-center justify-center text-slate-300">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[14px] font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-[520px] text-[13px] leading-6 text-slate-400">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
