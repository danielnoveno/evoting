import { AlertCircle, CheckCircle, Info, TriangleAlert } from 'lucide-react'
import { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type BannerVariant = 'info' | 'warning' | 'success' | 'danger'

const variantStyles: Record<BannerVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
}

const variantIcons: Record<BannerVariant, ReactNode> = {
  info: <Info className="mt-0.5 h-4 w-4" />,
  warning: <TriangleAlert className="mt-0.5 h-4 w-4" />,
  success: <CheckCircle className="mt-0.5 h-4 w-4" />,
  danger: <AlertCircle className="mt-0.5 h-4 w-4" />,
}

interface InfoBannerProps {
  variant: BannerVariant
  children: ReactNode
}

export function InfoBanner({ variant, children }: InfoBannerProps) {
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg border p-3', variantStyles[variant])}>
      {variantIcons[variant]}
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  )
}
