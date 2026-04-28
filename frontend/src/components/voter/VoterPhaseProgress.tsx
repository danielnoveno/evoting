import { cn } from '@/lib/utils'

interface VoterPhaseProgressProps {
  activeStep: 1 | 2 | 3 | 4
}

const labels = ['Commit', 'Konfirmasi', 'Reveal', 'Result'] as const

export function VoterPhaseProgress({ activeStep }: VoterPhaseProgressProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {labels.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3 | 4
        const isActive = step === activeStep
        const isDone = step < activeStep

        return (
          <div className="flex items-center gap-4" key={label}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full border text-xl font-semibold',
                  isActive && 'border-black bg-black text-white',
                  isDone && 'border-slate-400 bg-slate-400 text-white',
                  !isActive && !isDone && 'border-slate-300 bg-transparent text-slate-400',
                )}
              >
                {step}
              </div>
              <p
                className={cn(
                  'font-label text-[13px] font-semibold uppercase tracking-[0.14em]',
                  isActive ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {label}
              </p>
            </div>

            {step < 4 ? <div className="h-px w-12 bg-slate-300" /> : null}
          </div>
        )
      })}
    </div>
  )
}
