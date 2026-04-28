'use client'

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  title: string
  subtitle: string
}

export function Toggle({ checked, onChange, title, subtitle }: ToggleProps) {
  return (
    <label className="flex items-start gap-3">
      <button
        aria-pressed={checked}
        className={`relative h-[18px] w-8 rounded-full transition-colors ${
          checked ? 'bg-[#0F172A]' : 'bg-slate-200'
        }`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${
            checked ? 'left-4' : 'left-0.5'
          }`}
        />
      </button>
      <span>
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-0.5 block text-xs text-slate-400">{subtitle}</span>
      </span>
    </label>
  )
}
