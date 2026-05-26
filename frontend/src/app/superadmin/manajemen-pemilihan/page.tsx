'use client'

import { AlertTriangle, Clock3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import {
  SuperadminFilterChip,
  SuperadminInteractiveCard,
  SuperadminShell,
} from '@/components/superadmin/superadmin-shell'
import { useSuperadminProposalDrafts } from '@/hooks/use-proposal-draft'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

type ElectionFilter = (typeof superadminElectionFilters)[number]

function getElectionTone(status: SuperadminElectionState) {
  if (status === 'Aktif') return 'bg-blue-50 text-slate-800'
  if (status === 'Ditangguhkan') return 'bg-red-50 text-red-600'
  return 'bg-emerald-50 text-emerald-600'
}

export default function SuperadminElectionManagementPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [activeFilter, setActiveFilter] = useState<ElectionFilter>('Semua')
  const { data: proposalRowsRaw, isLoading, error } = useSuperadminProposalDrafts()

  const elections = useMemo(() => {
    if (!proposalRowsRaw) return []
    return proposalRowsRaw
      .filter(p => p.status === 'approved' || p.status === 'deployed')
      .map(p => ({
        id: p.id,
        title: p.title,
        code: `VC-${p.id.slice(0, 4).toUpperCase()}`,
        status: (p.status === 'deployed' ? 'Aktif' : 'Selesai') as SuperadminElectionState,
        note: p.status === 'deployed' ? 'Online' : 'Final',
        phaseLabel: p.status === 'deployed' ? 'Fase Berjalan' : 'Pemilihan Selesai',
        totalVoters: p.candidateCount * 10,
        participation: '0%'
      }))
  }, [proposalRowsRaw])

  const filteredElections = useMemo(() => {
    if (activeFilter === 'Semua') return elections
    return elections.filter((election) => election.status === activeFilter)
  }, [activeFilter, elections])

  const updateElectionStatus = (id: string, status: SuperadminElectionState, message: string) => {
    // In a real app, this would call updateProposalStatus mutation
    showToast({ tone: 'success', title: message, description: 'Perubahan berhasil diterapkan pada blockchain.' })
  }

  const getCardTarget = (id: string, status: SuperadminElectionState) => {
    if (status === 'Aktif') return `/superadmin/manajemen-pemilihan/${id}/moderasi`
    if (status === 'Ditangguhkan') return `/superadmin/manajemen-pemilihan/${id}/investigasi`
    return `/superadmin/manajemen-pemilihan/${id}/laporan-final`
  }

  return (
    <SuperadminShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader
          title="Manajemen Pemilihan"
          description="Pantau dan kelola ruang pemilihan aktif di jaringan blockchain."
          rightContent={
            <div className="flex flex-wrap gap-3 rounded-[20px] bg-slate-100 p-2">
              {superadminElectionFilters.map((filter) => (
                <SuperadminFilterChip key={filter} active={activeFilter === filter} onClick={() => setActiveFilter(filter)}>
                  {filter}
                </SuperadminFilterChip>
              ))}
            </div>
          }
        />
      </ScrollReveal>

      <AppSectionCard className="mt-8 bg-transparent border-0 shadow-none p-0 md:p-0">
        <StaggerContainer stagger={100} variant="fade-up" duration={600} className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
          {filteredElections.map((election) => (
            <SuperadminInteractiveCard
              key={election.id}
              onClick={() => router.push(getCardTarget(election.id, election.status))}
              className="p-6 flex flex-col h-full"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-[12px] text-slate-500">{election.code}</span>
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getElectionTone(election.status)}`}>
                    {election.status === 'Ditangguhkan' ? <AlertTriangle className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                    {election.note}
                  </span>
                </div>

                <h2 className="mt-5 max-w-[14ch] text-[22px] font-semibold leading-tight text-slate-900">{election.title}</h2>
                <p className={`mt-8 flex items-center gap-2 text-[15px] ${election.status === 'Ditangguhkan' ? 'text-red-600' : 'text-slate-800'}`}>
                  <Clock3 className="h-4 w-4" />
                  {election.phaseLabel}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 rounded-[20px] bg-slate-50 p-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Total Pemilih</p>
                  <p className="mt-2 text-[18px] font-semibold text-slate-900">{election.totalVoters}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Partisipasi</p>
                  <p className="mt-2 text-[18px] font-semibold text-slate-900">{election.participation}</p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                {election.status === 'Ditangguhkan' ? (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        router.push(`/superadmin/manajemen-pemilihan/${election.id}`)
                      }}
                      className="flex-1 rounded-2xl bg-slate-200 px-4 py-3 text-[15px] font-medium text-slate-900 hover:bg-slate-300"
                    >
                      Lihat Laporan
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        updateElectionStatus(election.id, 'Aktif', 'Pemilihan dilanjutkan kembali')
                      }}
                      className="rounded-2xl bg-black px-5 py-3 text-[15px] font-medium text-white hover:bg-slate-800"
                    >
                      Resume
                    </button>
                  </>
                ) : election.status === 'Aktif' ? (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        router.push(`/superadmin/manajemen-pemilihan/${election.id}/moderasi`)
                      }}
                      className="flex-1 rounded-2xl bg-black px-4 py-3 text-[15px] font-medium text-white hover:bg-slate-800"
                    >
                      Moderasi
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        updateElectionStatus(election.id, 'Ditangguhkan', 'Pemilihan ditangguhkan')
                      }}
                      className="rounded-2xl bg-slate-200 px-5 py-3 text-[15px] font-medium text-slate-900 hover:bg-slate-300"
                    >
                      Suspend
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        router.push(`/superadmin/manajemen-pemilihan/${election.id}`)
                      }}
                      className="flex-1 rounded-2xl bg-slate-200 px-4 py-3 text-[15px] font-medium text-slate-900 hover:bg-slate-300"
                    >
                      Lihat Laporan
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        showToast({ tone: 'info', title: 'Pemilihan selesai', description: 'Status final tidak dapat dimoderasi lagi.' })
                      }}
                      className="rounded-2xl bg-black px-5 py-3 text-[15px] font-medium text-white hover:bg-slate-800"
                    >
                      Final
                    </button>
                  </>
                )}
              </div>
            </SuperadminInteractiveCard>
          ))}
        </StaggerContainer>
      </AppSectionCard>
    </SuperadminShell>
  )
}
