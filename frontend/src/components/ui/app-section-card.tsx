import { ReactNode } from 'react'

export interface AppSectionCardProps {
  children: ReactNode
  className?: string
  /** If true, renders a dashed border and removes the solid background (useful for 'Add' or 'Empty' states) */
  dashed?: boolean
  onClick?: () => void
}

export function AppSectionCard({ children, className = '', dashed = false, onClick }: AppSectionCardProps) {
  const baseClasses = 'overflow-hidden rounded-xl p-5 md:p-6'
  
  const styleClasses = dashed
    ? 'border border-dashed border-slate-300 bg-transparent'
    : 'border border-slate-200 bg-white'
     
  const interactiveClasses = onClick
    ? 'cursor-pointer transition-all duration-150 hover:-translate-y-px hover:border-slate-300'
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
