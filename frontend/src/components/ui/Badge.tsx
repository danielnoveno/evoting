import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type BadgeVariant = 'active' | 'commit' | 'reveal' | 'ended' | 'info' | 'danger'

const variantStyles: Record<BadgeVariant, string> = {
  active: 'bg-emerald-50 text-emerald-800',
  commit: 'bg-amber-50 text-amber-800',
  reveal: 'bg-blue-50 text-blue-800',
  ended: 'bg-slate-100 text-slate-600',
  info: 'bg-blue-50 text-blue-800',
  danger: 'bg-red-50 text-red-800',
}

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
