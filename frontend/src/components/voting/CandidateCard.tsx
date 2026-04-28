import { Card } from '@/components/ui/Card'

interface CandidateCardProps {
  name: string
  nim: string
  selected?: boolean
}

export function CandidateCard({ name, nim, selected = false }: CandidateCardProps) {
  return (
    <Card variant={selected ? 'selected' : 'base'}>
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-full bg-slate-100" />
        <div className={`h-[22px] w-[22px] rounded-full border ${selected ? 'border-[#0F172A] bg-[#0F172A]' : 'border-slate-200 bg-white'}`} />
      </div>
      <p className="mt-3 text-[15px] font-semibold text-slate-900">{name}</p>
      <p className="font-mono text-xs text-slate-400">{nim}</p>
      <div className="my-2 h-px bg-slate-100" />
      <p className="text-[13px] leading-relaxed text-slate-600">Ringkasan visi dan misi kandidat ditampilkan di area ini.</p>
    </Card>
  )
}
