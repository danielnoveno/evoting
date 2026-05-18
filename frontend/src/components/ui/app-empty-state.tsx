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
    <div className={`flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center ${className}`}>
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-7 text-slate-500">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
