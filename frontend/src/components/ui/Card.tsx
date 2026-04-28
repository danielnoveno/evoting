import { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type CardVariant = 'base' | 'hover' | 'selected' | 'flat'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

const cardVariants: Record<CardVariant, string> = {
  base: 'bg-white border border-slate-200 rounded-xl p-5',
  hover: 'bg-white border border-slate-200 rounded-xl p-5 transition-all duration-150 hover:border-slate-300 hover:-translate-y-px',
  selected: 'bg-white border-2 border-[#0F172A] rounded-xl p-5',
  flat: 'bg-slate-50 border border-slate-100 rounded-lg p-3',
}

export function Card({ variant = 'base', className, ...props }: CardProps) {
  return <div className={cn(cardVariants[variant], className)} {...props} />
}

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400',
        className,
      )}
      {...props}
    />
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('my-4 h-px bg-slate-100', className)} />
}
