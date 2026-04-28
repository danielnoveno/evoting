import { Clock3, RadioTower } from 'lucide-react'

import { AdminCandidate, AdminPhase } from '@/lib/admin-demo-data'

import { Card, SectionLabel } from '@/components/ui/Card'

interface AdminMonitoringPanelProps {
  phase: AdminPhase
  committedCount: number
  revealedCount: number
  registeredCount: number
  candidates: AdminCandidate[]
}

function getWidthClass(percent: number): string {
  if (percent >= 100) return 'w-full'
  if (percent >= 90) return 'w-11/12'
  if (percent >= 80) return 'w-10/12'
  if (percent >= 70) return 'w-9/12'
  if (percent >= 60) return 'w-8/12'
  if (percent >= 50) return 'w-6/12'
  if (percent >= 40) return 'w-5/12'
  if (percent >= 30) return 'w-4/12'
  if (percent >= 20) return 'w-3/12'
  if (percent >= 10) return 'w-2/12'
  if (percent > 0) return 'w-1/12'
  return 'w-0'
}

function phaseDescription(phase: AdminPhase): string {
  if (phase === 'registration') return 'Pendaftaran pemilih sedang berlangsung.'
  if (phase === 'commit') return 'Pemilih mengirim hash pilihan (commit).'
  if (phase === 'reveal') return 'Pemilih membuka pilihan (reveal).'
  return 'Voting selesai. Data siap direkap.'
}

export function AdminMonitoringPanel({
  phase,
  committedCount,
  revealedCount,
  registeredCount,
  candidates,
}: AdminMonitoringPanelProps) {
  const participation = registeredCount > 0 ? (committedCount / registeredCount) * 100 : 0

  const safeTotal = Math.max(revealedCount, 1)

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-2">
        <SectionLabel className="mb-0">MONITORING REAL-TIME</SectionLabel>
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
          <RadioTower className="h-3 w-3" />
          Node aktif
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Fase Aktif</p>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{phase}</p>
          <p className="mt-1 text-xs text-slate-500">{phaseDescription(phase)}</p>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Commit Masuk</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{committedCount.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-slate-500">Dari {registeredCount.toLocaleString('id-ID')} pemilih</p>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Reveal Masuk</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{revealedCount.toLocaleString('id-ID')}</p>
          <p className="mt-1 text-xs text-slate-500">Menunggu penyelesaian fase</p>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Partisipasi</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{Math.round(participation)}%</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-200">
            <div className={`h-full rounded bg-[#0F172A] ${getWidthClass(participation)}`} />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-100 p-3">
        <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
          <Clock3 className="h-3.5 w-3.5" />
          Perolehan suara (sementara)
        </div>

        <div className="space-y-2.5">
          {candidates.map((candidate) => {
            const percentage = Math.round((candidate.votes / safeTotal) * 100)

            return (
              <div key={candidate.id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-900">{candidate.name}</p>
                  <p className="text-xs font-semibold text-slate-600">{percentage}%</p>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-slate-200">
                  <div className={`h-full rounded bg-slate-400 ${getWidthClass(percentage)}`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
