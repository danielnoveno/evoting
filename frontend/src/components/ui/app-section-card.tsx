import { ReactNode } from 'react'

export interface AppSectionCardProps {
  children: ReactNode
  className?: string
  /** If true, renders a dashed border and removes the solid background (useful for 'Add' or 'Empty' states) */
  dashed?: boolean
  onClick?: () => void
}

export function AppSectionCard({ children, className = '', dashed = false, onClick }: AppSectionCardProps) {
  const baseClasses = 'rounded-[28px] overflow-hidden p-6 md:p-7'
  
  const styleClasses = dashed
    ? 'border-2 border-dashed border-slate-300 bg-transparent'
    : 'bg-white border border-slate-200 shadow-sm'
    
  const interactiveClasses = onClick
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300'
    : ''

  return (
    <section 
      className={`${baseClasses} ${styleClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
    >
      {children}
    </section>
  )
}
