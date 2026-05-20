'use client'

type VoterStep = {
  label: string
  active?: boolean
  done?: boolean
}

export function VoterStepper({ steps }: { steps: VoterStep[] }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-start">
      {steps.map((step, index) => (
        <div key={step.label} className="flex flex-1 items-start">
          <div className="flex flex-col items-center">
            <div className={step.done
              ? 'flex h-7 w-7 items-center justify-center rounded-full bg-[#0F172A] text-[12px] font-semibold text-white'
              : step.active
                ? 'flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0F172A] bg-white text-[12px] font-semibold text-[#0F172A]'
                : 'flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[12px] text-slate-400'}>
              {index + 1}
            </div>
            <p className={step.done || step.active ? 'mt-1.5 text-center text-[11px] text-slate-900' : 'mt-1.5 text-center text-[11px] text-slate-400'}>{step.label}</p>
          </div>
          {index < steps.length - 1 ? <div className={`mx-2 mt-3 h-px flex-1 ${step.done ? 'bg-[#0F172A]' : 'bg-slate-200'}`} /> : null}
        </div>
      ))}
      </div>
    </div>
  )
}
