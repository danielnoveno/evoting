interface MetricCardProps {
  label: string
  value: string
  subValue?: string
}

export function MetricCard({ label, value, subValue }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-400">
        {label}
      </p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {subValue ? <p className="mt-1 text-xs text-slate-400">{subValue}</p> : null}
    </div>
  )
}
