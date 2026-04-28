import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-[#0F172A] text-white hover:bg-[#1E293B] disabled:opacity-40',
  secondary:
    'bg-white text-[#0F172A] border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-[#0F172A]',
  destructive: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-[30px] px-3 text-xs',
  md: 'h-9 px-4 text-[13px]',
  lg: 'h-[42px] px-5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading,
      fullWidth,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150',
          'disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </button>
    )
  },
)

Button.displayName = 'Button'
