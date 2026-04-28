import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

type StepState = 'done' | 'active' | 'pending'

interface Step {
  label: string
  state: StepState
}

interface StepIndicatorProps {
  steps: Step[]
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="mb-6 flex w-full items-center">
      {steps.map((step, index) => (
        <div
          key={step.label}
          className="flex items-center"
          style={{ flex: index < steps.length - 1 ? '1' : 'none' }}
        >
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs',
                step.state === 'done' && 'bg-[#0F172A] text-white',
                step.state === 'active' && 'border-2 border-[#0F172A] bg-white text-[#0F172A]',
                step.state === 'pending' && 'border border-slate-200 bg-white text-slate-400',
              )}
            >
              {step.state === 'done' ? <Check className="h-3 w-3" /> : index + 1}
            </div>
            <span
              className={cn(
                'mt-1.5 whitespace-nowrap text-[11px]',
                step.state === 'pending' ? 'text-slate-400' : 'text-slate-900',
              )}
            >
              {step.label}
            </span>
          </div>

          {index < steps.length - 1 && (
            <div className={cn('mx-1 mb-4 h-px flex-1', step.state === 'done' ? 'bg-[#0F172A]' : 'bg-slate-200')} />
          )}
        </div>
      ))}
    </div>
  )
}
