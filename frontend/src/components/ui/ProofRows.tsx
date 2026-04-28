interface ProofRow {
  key: string
  value: string
  mono?: boolean
}

interface ProofRowsProps {
  rows: ProofRow[]
}

export function ProofRows({ rows }: ProofRowsProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-100">
      {rows.map((row) => (
        <div
          className="flex items-start justify-between gap-4 border-b border-slate-100 px-3.5 py-2.5 last:border-b-0"
          key={row.key}
        >
          <span className="min-w-[110px] text-xs font-semibold text-slate-400">{row.key}</span>
          <span
            className={row.mono ? 'break-all text-right font-mono text-[11px] text-slate-600' : 'text-right text-xs text-slate-900'}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  )
}
