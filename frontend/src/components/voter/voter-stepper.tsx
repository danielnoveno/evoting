'use client'

type VoterStep = {
  number: number
  label: string
  active?: boolean
  done?: boolean
}

export function VoterStepper({ steps }: { steps: VoterStep[] }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-center gap-y-3">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={step.active
              ? 'flex h-9 w-9 items-center justify-center rounded-full bg-black text-[14px] font-semibold text-white'
              : step.done
                ? 'flex h-9 w-9 items-center justify-center rounded-full bg-slate-400 text-[14px] font-semibold text-white'
                : 'flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-[14px] font-semibold text-slate-500'}>
              {step.number}
            </div>
            <p className={step.active ? 'text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-900 sm:text-[15px]' : 'text-[12px] uppercase tracking-[0.08em] text-slate-400 sm:text-[15px]'}>{step.label}</p>
          </div>
          {index < steps.length - 1 ? <div className="mx-3 h-px w-6 bg-slate-300 sm:mx-4 sm:w-8 md:w-12" /> : null}
        </div>
      ))}
      </div>
    </div>
  )
}
