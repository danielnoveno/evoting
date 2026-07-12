'use client'

import { BriefcaseBusiness, ChartNoAxesColumn, Grid2x2, PauseCircle, Plus, Settings2, ShieldCheck, Trophy, UsersRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AdminFilterPill, AdminShell } from '@/components/admin/admin-shell'
import { OnboardingTour } from '@/components/admin/onboarding-tour'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { adminElectionFilters, AdminElectionRecord, AdminElectionStatus } from '@/lib/admin-election-data'
import { useToast } from '@/components/ui/toast-provider'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

import { useAdminElectionList } from '@/hooks/use-admin-proposal-list'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { getElectionResultsFromIndexer } from '@/lib/repositories/electionRepository'

function getToneClasses(tone: AdminElectionRecord['iconTone']) {
  if (tone === 'emerald') return 'bg-emerald-50 text-emerald-700'
  if (tone === 'orange') return 'bg-red-50 text-red-600'
  return 'bg-blue-50 text-blue-600'
}

function getActionToneClasses(tone: AdminElectionRecord['actionTone']) {
  if (tone === 'indigo') return 'bg-indigo-50 text-indigo-600'
  if (tone === 'blue') return 'bg-blue-50 text-blue-600 hover:bg-blue-100'
  return 'bg-slate-100 text-slate-700 hover:bg-slate-200'
}

function ElectionIcon({ status }: { status: AdminElectionStatus }) {
  if (status === 'aktif') return <BriefcaseBusiness className="h-5 w-5" />
  if (status === 'ditangguhkan') return <PauseCircle className="h-5 w-5" />
  return <ShieldCheck className="h-5 w-5" />
}

function formatDateLong(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(date) + ' WIB'
}

function ElectionCard({ election }: { election: AdminElectionRecord }) {
  const router = useRouter()
  const contractAddress = election.detail.parameterVoting.contract.address
  const isDeployed = Boolean(contractAddress && contractAddress.startsWith('0x') && contractAddress.length === 42)

  const resultsQuery = useQuery({
    queryKey: ['admin', 'election-results', election.id],
    queryFn: () => getElectionResultsFromIndexer(isDeployed ? contractAddress : null),
    enabled: election.status === 'selesai' && isDeployed,
    staleTime: 0,
    retry: false,
  })

  if (election.status === 'ditangguhkan') {
    return (
      <AppSectionCard className="flex h-full min-h-[388px] flex-col opacity-75">
        <div className="flex h-full flex-1 flex-col">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <ElectionIcon status={election.status} />
              </div>
              <div className="min-w-0 pt-1">
                <h2 className="max-w-[16ch] text-[20px] font-semibold text-slate-900 2xl:max-w-[12ch]">{election.title}</h2>
                <p className="mt-3 max-w-[420px] text-[15px] leading-7 text-slate-500 2xl:max-w-[340px]">{election.meta}</p>
              </div>
            </div>
            <div className="flex min-h-[84px] flex-col justify-between gap-4 sm:items-end">
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-red-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-600 sm:self-auto">
                <PauseCircle className="h-3.5 w-3.5" />
                Ditangguhkan
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-[14px] font-semibold text-red-700">Pemilihan Ditangguhkan</p>
              <p className="mt-2 text-[13px] leading-6 text-red-600">
                Pemilihan ini telah ditangguhkan oleh superadmin. Hubungi superadmin untuk informasi lebih lanjut mengenai alasan penangguhan.
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-[14px] font-medium text-slate-400 sm:px-5">
                <ChartNoAxesColumn className="h-4 w-4" />
                Monitoring Tidak Tersedia
              </span>
            </div>
          </div>
        </div>
      </AppSectionCard>
    )
  }

  if (election.status === 'selesai') {
    return (
      <AppSectionCard onClick={() => router.push(`/admin/manajemen-pemilihan/${election.id}`)} className="flex h-full min-h-[388px] flex-col">
        <div className="flex h-full flex-1 flex-col">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 pt-1">
                <h2 className="max-w-[16ch] text-[20px] font-semibold text-slate-900 2xl:max-w-[12ch]">{election.title}</h2>
                <p className="mt-3 max-w-[420px] text-[15px] leading-7 text-slate-500 2xl:max-w-[340px]">{election.meta}</p>
              </div>
            </div>
            <div className="flex min-h-[84px] flex-col justify-between gap-4 sm:items-end">
              <span className="inline-flex self-start rounded-full bg-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 sm:self-auto">
                {election.badge}
              </span>
              {(election.whitelistCount ?? 0) > 0 ? (
                <div className="flex -space-x-2 self-start sm:self-auto" aria-label={`${election.whitelistCount} pemilih whitelist`}>
                  {(election.whitelistPreview ?? []).map((avatar) => (
                    <div key={avatar.id} title={avatar.name} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[11px] font-semibold text-slate-700">
                      {avatar.label}
                    </div>
                  ))}
                  {(election.whitelistCount ?? 0) > (election.whitelistPreview?.length ?? 0) ? (
                    <div className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 px-2 text-[11px] font-semibold text-slate-500">
                      +{(election.whitelistCount ?? 0) - (election.whitelistPreview?.length ?? 0)}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Schedule detail */}
          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Pencoblosan</p>
              <p className="mt-2 text-[14px] font-semibold text-slate-900">{formatDateLong(election.schedule?.commitStartAt ?? null)}</p>
              <p className="mt-1 text-[12px] text-slate-500">s/d {formatDateLong(election.schedule?.revealStartAt ?? null)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Konfirmasi Suara</p>
              <p className="mt-2 text-[14px] font-semibold text-slate-900">{formatDateLong(election.schedule?.revealStartAt ?? null)}</p>
              <p className="mt-1 text-[12px] text-slate-500">s/d {formatDateLong(election.schedule?.endedAt ?? null)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Pemilih Terdaftar</p>
              <p className="mt-2 text-[14px] font-semibold text-slate-900">{election.whitelistCount ?? 0} pemilih</p>
              {election.commits?.hash ? (
                <p className="mt-1 font-mono text-[12px] text-slate-500">{election.commits.hash}</p>
              ) : null}
            </div>
          </div>

          {/* Vote results */}
          {resultsQuery.data && resultsQuery.data.candidateResults.length > 0 ? (
            <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Hasil Pemilihan</p>
                <span className="text-[12px] font-semibold text-slate-600">{resultsQuery.data.totalRevealed} suara sah</span>
              </div>
              <div className="mt-4 space-y-3">
                {resultsQuery.data.candidateResults
                  .slice()
                  .sort((a, b) => b.voteCount - a.voteCount)
                  .map((candidate, index) => {
                    const totalVotes = resultsQuery.data!.totalRevealed || 1
                    const percentage = (candidate.voteCount / totalVotes) * 100
                    const isWinner = index === 0 && candidate.voteCount > 0
                    return (
                      <div key={candidate.candidateId} className="flex items-center gap-3">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isWinner ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                          {isWinner ? <Trophy className="h-3.5 w-3.5" /> : candidate.candidateId}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] font-semibold text-slate-900">Kandidat {candidate.candidateId}</span>
                            <span className="text-[13px] font-semibold text-slate-900">{candidate.voteCount}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                            <div className={`h-1.5 rounded-full ${isWinner ? 'bg-amber-400' : 'bg-slate-400'}`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ) : resultsQuery.isLoading ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-center text-[13px] text-slate-400">
              Memuat hasil dari blockchain...
            </div>
          ) : resultsQuery.data && resultsQuery.data.candidateResults.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-center text-[13px] text-slate-400">
              Belum ada suara terindeks
            </div>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-3 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/admin/manajemen-pemilihan/${election.id}`} onClick={(event) => event.stopPropagation()} className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-[14px] font-medium text-white hover:bg-slate-800">
                <ChartNoAxesColumn className="h-4 w-4" />
                {election.actionLabel}
              </Link>
              <span className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-[14px] font-medium text-slate-700 sm:px-5">
                <UsersRound className="h-4 w-4" />
                {election.secondaryActionLabel}
              </span>
            </div>
          </div>
        </div>
      </AppSectionCard>
    )
  }

  if (election.status === 'aktif' && election.commits) {
    return (
      <AppSectionCard onClick={() => router.push(`/admin/manajemen-pemilihan/${election.id}`)} className="flex h-full min-h-[388px] flex-col">
        <div className="flex h-full flex-1 flex-col">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${getToneClasses(election.iconTone)}`}>
                <ElectionIcon status={election.status} />
              </div>
              <div className="min-w-0 pt-1">
                <h2 className="max-w-[16ch] text-[20px] font-semibold text-slate-900 2xl:max-w-[12ch]">{election.title}</h2>
                <p className="mt-3 max-w-[420px] text-[15px] leading-7 text-slate-500 2xl:max-w-[340px]">{election.meta}</p>
              </div>
            </div>
            <div className="flex min-h-[84px] flex-col justify-between gap-4 sm:items-end">
              <span className="inline-flex self-start rounded-full bg-emerald-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 sm:self-auto">
                {election.badge}
              </span>
              {(election.whitelistCount ?? 0) > 0 ? (
                <div className="flex -space-x-2 self-start sm:self-auto" aria-label={`${election.whitelistCount} pemilih whitelist`}>
                  {(election.whitelistPreview ?? []).map((avatar) => (
                    <div key={avatar.id} title={avatar.name} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[11px] font-semibold text-slate-700">
                      {avatar.label}
                    </div>
                  ))}
                  {(election.whitelistCount ?? 0) > (election.whitelistPreview?.length ?? 0) ? (
                    <div className="flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 px-2 text-[11px] font-semibold text-slate-500">
                      +{(election.whitelistCount ?? 0) - (election.whitelistPreview?.length ?? 0)}
                    </div>
                  ) : null}
                </div>
              ) : (
                <span className="inline-flex self-start rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-500 sm:self-auto">
                  Whitelist kosong
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 2xl:grid-cols-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total Commit</p>
              <p className="mt-2 text-[15px] font-semibold text-slate-900">{election.commits.total} <span className="font-normal text-slate-400">/ {election.commits.target}</span></p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Contract Hash</p>
              <p className="mt-2 font-mono text-[13px] text-blue-600">{election.commits.hash}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Reveal Dibuka</p>
              <p className="mt-2 text-[15px] font-semibold text-slate-900">{election.commits.revealStart}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Integritas</p>
              <p className="mt-2 inline-flex items-center gap-1 text-[14px] font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                {election.commits.integrity}
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/admin/manajemen-pemilihan/${election.id}`} onClick={(event) => event.stopPropagation()} className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-4 text-[14px] font-medium text-indigo-600 sm:px-5">
                <ChartNoAxesColumn className="h-4 w-4" />
                {election.actionLabel}
              </Link>
              <span className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-[14px] font-medium text-slate-700 sm:px-5">
                <UsersRound className="h-4 w-4" />
                {election.secondaryActionLabel}
              </span>
            </div>
          </div>
        </div>
      </AppSectionCard>
    )
  }

  return (
    <AppSectionCard onClick={() => router.push(`/admin/manajemen-pemilihan/${election.id}`)} className="flex h-full min-h-[388px] flex-col">
      <div className="flex h-full flex-1 flex-col">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${getToneClasses(election.iconTone)}`}>
              <ElectionIcon status={election.status} />
            </div>
            <div className="min-w-0 pt-1">
              <h2 className="max-w-[13ch] text-[20px] font-semibold text-slate-900 2xl:max-w-[12ch]">{election.title}</h2>
              <p className="mt-3 max-w-[360px] text-[15px] leading-7 text-slate-500 2xl:max-w-[250px]">{election.meta}</p>
            </div>
          </div>
          <div className="flex min-h-[84px] flex-col justify-between gap-4 sm:items-end">
            <span className={`inline-flex h-14 items-center justify-center self-start rounded-2xl px-5 text-[14px] font-medium sm:self-auto ${getActionToneClasses(election.actionTone)}`}>
              {election.actionLabel}
            </span>
            <span className="inline-flex self-start rounded-full bg-blue-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600 sm:self-auto">
              {election.badge}
            </span>
          </div>
        </div>
      </div>
    </AppSectionCard>
  )
}

export default function AdminElectionManagementPage() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<'semua' | AdminElectionStatus>('semua')

  const { showToast } = useToast()
  const { elections: liveElections } = useAdminElectionList()

  const filteredElections = useMemo(() => {
    const data = liveElections
    if (activeFilter === 'semua') return data
    return data.filter((election) => election.status === activeFilter)
  }, [activeFilter, liveElections])

  const electionsWithEmptyCard = useMemo(() => {
    return [...filteredElections, 'create-new'] as const
  }, [filteredElections])

  return (
    <AdminShell>
      <OnboardingTour />
      <ScrollReveal id="tour-admin-election-header" variant="fade-up" duration={700}>
        <AppPageHeader
          title="Manajemen Pemilihan"
          description="Kelola dan pantau seluruh ruang pemilihan yang Anda pimpin"
          rightContent={
            <button type="button" onClick={() => router.push('/admin/daftar-proposal/tambah')} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900">
              <Plus className="h-4 w-4" />
              Buat Pemilihan Baru
            </button>
          }
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {adminElectionFilters.map((filter) => (
              <AdminFilterPill key={filter.key} active={activeFilter === filter.key} onClick={() => setActiveFilter(filter.key)}>
                {filter.label}
              </AdminFilterPill>
            ))}
          </div>

          <div className="flex items-center gap-3 self-end xl:self-auto">
            <button type="button" onClick={() => showToast({ tone: 'info', title: 'Urutkan', description: 'Fitur pengurutan akan tersedia pada versi produksi.' })} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-[14px] font-medium text-slate-800 hover:bg-slate-200">
              <Settings2 className="h-4 w-4" />
              Urutkan: Terbaru
            </button>
            <button type="button" onClick={() => showToast({ tone: 'info', title: 'Tampilan', description: 'Opsi tampilan grid/list akan tersedia pada versi produksi.' })} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 hover:bg-slate-200">
              <Grid2x2 className="h-4 w-4" />
            </button>
          </div>
        </section>
      </ScrollReveal>


      <StaggerContainer id="tour-admin-election-list" stagger={100} variant="fade-up" duration={600} className="mt-8 grid auto-rows-fr gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {electionsWithEmptyCard.map((entry) => {
          if (entry === 'create-new') {
            return (
              <AppSectionCard id="tour-admin-create-election" dashed key="create-new" onClick={() => router.push('/admin/daftar-proposal/tambah')} className="flex h-full min-h-[388px] flex-col">
                <div className="flex h-full flex-1 flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <Plus className="h-8 w-8" />
                  </div>
                  <h2 className="mt-8 text-[24px] font-semibold text-slate-900">Buat Ruang Pemilihan Baru</h2>
                  <p className="mt-4 max-w-[260px] text-[15px] leading-8 text-slate-500">
                    Konfigurasi smart contract voting dalam hitungan menit
                  </p>
                </div>
              </AppSectionCard>
            )
          }

          return <ElectionCard key={entry.id} election={entry} />
        })}
      </StaggerContainer>
    </AdminShell>
  )
}
