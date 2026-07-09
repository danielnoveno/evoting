import type { PublicElectionPhase } from '@/lib/repositories/types'

type ScheduleInput = {
  status?: string | null
  commitStartAt?: string | null
  revealStartAt?: string | null
  endedAt?: string | null
}

export type SchedulePhaseInfo = {
  phase: PublicElectionPhase
  label: string
  next: string
  deadlineIso: string | null
  deadlineLabel: string
}

function timeOf(value?: string | null): number {
  if (!value) return Number.NaN
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : Number.NaN
}

export function resolveSchedulePhase(input: ScheduleInput, now = Date.now()): SchedulePhaseInfo {
  const commitStart = timeOf(input.commitStartAt)
  const revealStart = timeOf(input.revealStartAt)
  const endedAt = timeOf(input.endedAt)
  const isEnded = input.status === 'archived' || (!Number.isNaN(endedAt) && now >= endedAt)

  if (isEnded) {
    return { phase: 'ended', label: 'Selesai', next: '-', deadlineIso: input.endedAt ?? null, deadlineLabel: 'Pemilihan selesai' }
  }
  if (input.status !== 'deployed') {
    return { phase: 'registration', label: 'Menunggu Dibuka', next: 'Pencoblosan', deadlineIso: input.commitStartAt ?? null, deadlineLabel: 'Pencoblosan dibuka dalam' }
  }
  if (!Number.isNaN(revealStart) && now >= revealStart) {
    return { phase: 'reveal', label: 'Konfirmasi Suara', next: 'Selesai', deadlineIso: input.endedAt ?? null, deadlineLabel: 'Penghitungan berakhir dalam' }
  }
  if (!Number.isNaN(commitStart) && now >= commitStart) {
    return { phase: 'commit', label: 'Pencoblosan', next: 'Konfirmasi Suara', deadlineIso: input.revealStartAt ?? null, deadlineLabel: 'Sisa waktu mencoblos' }
  }
  return { phase: 'commit', label: 'Menunggu Dibuka', next: 'Pencoblosan', deadlineIso: input.commitStartAt ?? null, deadlineLabel: 'Pencoblosan dibuka dalam' }
}
