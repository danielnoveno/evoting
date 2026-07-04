'use client'

import { Activity, AlertTriangle, ArrowRight, BadgeCheck, CalendarDays, ExternalLink, Hourglass, Lock, ShieldCheck, Wallet, Loader2, Users, CheckCircle2, XCircle, RefreshCw, UserRound, Youtube, Clock3 } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { SuperadminDetailIntro, SuperadminEmptyState, SuperadminSectionCard, SuperadminShell, SuperadminStatusBadge } from '@/components/superadmin/superadmin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'
import { type SuperadminElectionState } from '@/lib/superadmin-data'
import { useSuperadminElectionsStore } from '@/lib/superadmin-store'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { useProposalDraft, useProposalActivities } from '@/hooks/use-proposal-draft'
import { useProposalCandidates, useProposalWhitelistEntries } from '@/hooks/use-proposal-relations'
import { useAuthSession } from '@/hooks/use-auth-session'
import { resolveSchedulePhase } from '@/lib/election-phase'

function getElectionStatusColor(status: SuperadminElectionState) {
  if (status === 'Ditangguhkan') return 'text-red-600'
  if (status === 'Selesai') return 'text-emerald-600'
  return 'text-emerald-600'
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function SuperadminElectionModerationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { elections, setElections } = useSuperadminElectionsStore()
  const proposalQuery = useProposalDraft(params.id)
  const candidatesQuery = useProposalCandidates(params.id)
  const whitelistQuery = useProposalWhitelistEntries(params.id)
  const activitiesQuery = useProposalActivities(params.id)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspending, setSuspending] = useState(false)
  const [nowMs, setNowMs] = useState(Date.now())
  const authSession = useAuthSession()

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const election = useMemo(() => {
    const fromStore = elections.find((item) => item.id === params.id)
    if (fromStore) return fromStore
    
    if (proposalQuery.data) {
      const p = proposalQuery.data
      const status = p.status === 'suspended' ? 'Ditangguhkan' : p.status === 'archived' ? 'Selesai' : 'Aktif'
      return {
        id: p.id,
        title: p.title,
        code: `VC-${p.id.slice(0, 4).toUpperCase()}`,
        status: status as SuperadminElectionState,
        note: p.status === 'suspended' ? 'Halted' : p.status === 'archived' ? 'Final' : 'Online',
        phaseLabel: p.status === 'archived' ? 'Pemilihan Selesai' : 'Fase Berjalan',
        totalVoters: '0',
        participation: '0%'
      }
    }
    
    return null
  }, [elections, params.id, proposalQuery.data])

  const handleSuspend = useCallback(async () => {
    const token = authSession.data?.access_token
    if (!token) {
      showToast({ tone: 'error', title: 'Sesi berakhir', description: 'Silakan masuk kembali.' })
      return
    }
    setSuspending(true)
    try {
      const response = await fetch(`/api/proposals/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'suspended', message: 'Pemilihan ditangguhkan oleh superadmin.' }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(typeof body.error === 'string' ? body.error : 'Gagal menangguhkan pemilihan.')
      }
      setElections((current) => current.map((item) => item.id === params.id ? { ...item, status: 'Ditangguhkan', note: 'Halted' } : item))
      showToast({ tone: 'success', title: 'Pemilihan ditangguhkan', description: 'Status pemilihan berhasil diperbarui.' })
      window.setTimeout(() => {
        router.push('/superadmin/manajemen-pemilihan')
      }, 500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menangguhkan pemilihan.'
      showToast({ tone: 'error', title: 'Gagal menangguhkan', description: message })
    } finally {
      setSuspending(false)
    }
  }, [authSession.data?.access_token, params.id, setElections, showToast, router])

  if (proposalQuery.isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
  if (!election) notFound()

  const proposal = proposalQuery.data
  const candidates = candidatesQuery.data ?? []
  const whitelistEntries = whitelistQuery.data ?? []
  const activities = activitiesQuery.data ?? []

  const contractAddress = proposal?.deployedSpaceAddress ?? 'Belum tersedia'
  const contractUrl = proposal?.deployedSpaceAddress
    ? `https://sepolia.basescan.org/address/${proposal.deployedSpaceAddress}`
    : 'https://sepolia.basescan.org/'

  const schedule = proposal
    ? { commitStartAt: proposal.commitStartAt, revealStartAt: proposal.revealStartAt, endedAt: proposal.endedAt, registrationStartAt: proposal.registrationStartAt }
    : null

  const phaseInfo = proposal ? resolveSchedulePhase(proposal, nowMs) : { phase: 'registration' as const, label: 'Persiapan', next: 'Pencoblosan', deadlineIso: null, deadlineLabel: 'Pencoblosan dibuka dalam' }

  const validWhitelistCount = whitelistEntries.filter((e) => e.validationStatus === 'valid' || e.validationStatus === 'synced' || e.syncStatus === 'synced').length
  const syncedWhitelistCount = whitelistEntries.filter((e) => e.syncStatus === 'synced' || e.validationStatus === 'synced').length

  return (
    <SuperadminShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <SuperadminDetailIntro
          backHref="/superadmin/manajemen-pemilihan"
        backLabel="Kembali ke Daftar"
        chips={(
          <>
            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[14px] font-medium text-blue-700">
              <BadgeCheck className="h-4 w-4" />
              Base Sepolia Testnet
            </span>
            <span className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-[13px] text-slate-500">ID: {election.code}</span>
            {proposal?.deployedSpaceAddress && (
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700">
                <Wallet className="h-3.5 w-3.5" />
                {proposal.deployedSpaceAddress.slice(0, 6)}...{proposal.deployedSpaceAddress.slice(-4)}
              </span>
            )}
          </>
        )}
        title={election.title}
        meta={(
          <>
            <SuperadminStatusBadge status={election.status} />
            <div className={`flex items-center gap-2 ${getElectionStatusColor(election.status)}`}>
              <CalendarDays className="h-4 w-4" />
              <span className="text-slate-800">{schedule?.endedAt ? `Berakhir ${new Date(schedule.endedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Jadwal sedang disinkronkan'}</span>
            </div>
          </>
        )}
        actions={(
          <div className="flex w-full max-w-[460px] flex-col items-stretch gap-4 xl:items-end">
            <div className="flex flex-col gap-3 sm:flex-row xl:w-full xl:justify-end">
            <a
              href={contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-50"
            >
              <Wallet className="h-4 w-4" />
              Lihat Smart Contract
            </a>
            <button
              type="button"
              onClick={() => setSuspendDialogOpen(true)}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-red-500 px-6 text-[15px] font-medium text-white hover:bg-red-600"
            >
              <AlertTriangle className="h-4 w-4" />
              Tangguhkan Pemilihan
            </button>
            </div>
            <p className="max-w-[320px] text-[14px] leading-6 text-slate-500 xl:text-right">Penangguhan akan menghentikan pemilihan ini sampai proses tinjauan selesai.</p>
          </div>
        )}
      />
      </ScrollReveal>

      {/* Metrics */}
      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-6 xl:grid-cols-4">
        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total Pemilih Terdaftar</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-[28px] font-semibold tracking-[-0.04em] text-slate-900">{whitelistEntries.length}</p>
            <span className="pb-1 text-[14px] font-medium text-slate-500">wallet</span>
          </div>
          <p className="mt-4 text-[15px] leading-7 text-slate-800">{validWhitelistCount} wallet valid dari database</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Tersinkron On-Chain</p>
          <p className="mt-6 text-[28px] font-semibold tracking-[-0.04em] text-slate-900">{syncedWhitelistCount} <span className="text-[16px] font-normal text-slate-500">/ {whitelistEntries.length}</span></p>
          <div className="mt-5 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: whitelistEntries.length > 0 ? `${Math.round((syncedWhitelistCount / whitelistEntries.length) * 100)}%` : '0%' }} />
          </div>
          <p className="mt-4 text-[15px] leading-7 text-slate-800">{syncedWhitelistCount === whitelistEntries.length && whitelistEntries.length > 0 ? 'Semua wallet sudah terdaftar on-chain' : 'Ada wallet yang belum terdaftar di kontrak'}</p>
        </article>

        <article className="rounded-[24px] bg-[#11182a] p-6 text-white">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-300">Fase Pemilihan</p>
          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[22px] font-semibold leading-tight">{phaseInfo.label}</p>
              {phaseInfo.next !== '-' && (
                <div className="mt-5 flex items-center gap-2 text-[15px] text-slate-300">
                  Selanjutnya: {phaseInfo.next}
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
            <Hourglass className="h-12 w-12 text-slate-700" />
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat Terdaftar</p>
          <p className="mt-6 text-[28px] font-semibold tracking-[-0.04em] text-slate-900">{candidates.length}</p>
          <p className="mt-4 text-[15px] leading-7 text-slate-800">{proposal?.candidateCount ?? candidates.length} kandidat dari proposal</p>
        </article>
      </StaggerContainer>

      {/* Schedule */}
      {schedule && (schedule.commitStartAt || schedule.revealStartAt || schedule.endedAt) && (
        <ScrollReveal variant="fade-up" delay={100} duration={600}>
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-slate-700" />
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">Jadwal Pemilihan</h2>
                <p className="mt-1 text-[12px] text-slate-500">Sumber fase tampilan: jadwal database aplikasi.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              {schedule.registrationStartAt && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Persiapan</p>
                  <p className="mt-2 text-[14px] font-semibold text-slate-900">
                    {new Date(schedule.registrationStartAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500">Whitelist & registrasi</p>
                </div>
              )}
              {schedule.commitStartAt && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600">Mulai Pencoblosan</p>
                  <p className="mt-2 text-[14px] font-semibold text-blue-900">
                    {new Date(schedule.commitStartAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-1 text-[12px] text-blue-700">Fase Commit dimulai</p>
                </div>
              )}
              {schedule.revealStartAt && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600">Mulai Konfirmasi</p>
                  <p className="mt-2 text-[14px] font-semibold text-amber-900">
                    {new Date(schedule.revealStartAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-1 text-[12px] text-amber-700">Fase Reveal (otomatis)</p>
                </div>
              )}
              {schedule.endedAt && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">Selesai Pemilihan</p>
                  <p className="mt-2 text-[14px] font-semibold text-emerald-900">
                    {new Date(schedule.endedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-1 text-[12px] text-emerald-700">Hasil dihitung</p>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
        <div className="space-y-6">
          {/* Candidate Section - Real Data */}
          <SuperadminSectionCard className="bg-white border border-slate-200 p-0">
            <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-slate-700" />
                  <h2 className="text-[18px] font-semibold text-slate-900">Profil Kandidat</h2>
                </div>
                <p className="mt-3 max-w-[540px] text-[15px] leading-7 text-slate-800">
                  Detail lengkap kandidat yang akan ikut dalam pemilihan ini. Data diambil dari database proposal.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-[15px] font-medium text-slate-700">
                <Lock className="h-4 w-4" />
                Suara Dienkripsi
              </div>
            </div>

            <div className="px-6 py-6">
              {candidatesQuery.isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {[0, 1].map((i) => <div key={i} className="h-[420px] animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
              ) : candidates.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {candidates.map((candidate, index) => (
                    <article key={candidate.id} className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="relative flex h-[280px] items-center justify-center overflow-hidden bg-slate-100 sm:h-[300px]">
                        {candidate.avatarPath ? (
                          <img src={candidate.avatarPath} alt={`Foto ${candidate.fullName}`} className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <UserRound className="h-12 w-12" />
                          </div>
                        )}
                        <span className="absolute left-3 top-3 rounded-lg bg-slate-900 px-2 py-1 font-mono text-[10px] font-semibold text-white">#{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="flex min-h-[300px] flex-1 flex-col p-4">
                        <p className="font-mono text-[11px] text-slate-400">ID {candidate.candidateLocalId}</p>
                        <h3 className="mt-2 text-[18px] font-semibold leading-tight text-slate-900">{candidate.fullName}</h3>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                          {candidate.studentId ? <span className="rounded-lg bg-slate-50 px-2 py-1 font-mono">{candidate.studentId}</span> : null}
                          {candidate.faculty ? <span className="rounded-lg bg-slate-50 px-2 py-1">{candidate.faculty}</span> : null}
                        </div>

                        <div className="mt-4 space-y-3 text-[12px] leading-5 text-slate-700">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Visi</p>
                            <RichTextRenderer value={candidate.vision} emptyFallback="Visi belum diisi." className="mt-1" />
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Misi</p>
                            {candidate.mission.length > 0 ? (
                              <div className="mt-1">
                                {candidate.mission.slice(0, 3).map((mission, missionIndex) => (
                                  <RichTextRenderer key={`${candidate.id}-mission-${missionIndex}`} value={mission} className="line-clamp-2" />
                                ))}
                              </div>
                            ) : <p className="mt-1 text-slate-500">Misi belum diisi.</p>}
                          </div>
                        </div>

                        {candidate.youtubeUrl && (
                          <a href={candidate.youtubeUrl} target="_blank" rel="noreferrer" className="mt-auto inline-flex pt-4 text-[12px] font-semibold text-slate-700 hover:text-slate-900">
                            <Youtube className="mr-1.5 h-3.5 w-3.5" />
                            Video profil
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 px-5 py-8 text-center text-[15px] text-slate-500">
                  Belum ada data kandidat yang terhubung untuk pemilihan ini.
                </div>
              )}
            </div>
          </SuperadminSectionCard>

          {/* Whitelist Section - Real Data */}
          <SuperadminSectionCard className="bg-white border border-slate-200 p-0">
            <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-slate-700" />
                  <h2 className="text-[18px] font-semibold text-slate-900">Daftar Pemilih (Whitelist)</h2>
                </div>
                <p className="mt-3 max-w-[540px] text-[15px] leading-7 text-slate-800">
                  Seluruh wallet yang terdaftar sebagai pemilih. Status sinkron on-chain dipantau terpisah dari database.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-4 py-2 text-[13px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {validWhitelistCount} valid
                </span>
                {whitelistEntries.filter((e) => e.validationStatus === 'invalid').length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-2xl bg-red-50 px-4 py-2 text-[13px] font-medium text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    {whitelistEntries.filter((e) => e.validationStatus === 'invalid').length} invalid
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 py-6">
              {whitelistQuery.isLoading ? (
                <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ) : whitelistEntries.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-slate-200 px-5 py-8 text-center text-[15px] text-slate-500">
                  Belum ada pemilih terdaftar untuk pemilihan ini.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 font-semibold text-slate-700">Alamat Wallet</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Nama</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Sumber</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Status Validasi</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Status On-Chain</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {whitelistEntries.slice(0, 20).map((entry) => {
                          const isValid = entry.validationStatus === 'valid' || entry.validationStatus === 'synced' || entry.syncStatus === 'synced'
                          const isSynced = entry.syncStatus === 'synced' || entry.validationStatus === 'synced'
                          const isInvalid = entry.validationStatus === 'invalid'
                          return (
                            <tr key={entry.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-mono text-[12px] text-slate-700">{entry.walletAddress}</td>
                              <td className="px-4 py-2.5 text-slate-700">{entry.voterName || <span className="text-slate-400 italic">-</span>}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
                                  entry.source === 'csv' ? 'bg-blue-50 text-blue-600' : entry.source === 'sync' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {entry.source === 'csv' ? 'CSV' : entry.source === 'sync' ? 'Sinkron' : 'Manual'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
                                  isValid ? 'bg-emerald-50 text-emerald-600' : isInvalid ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {isValid ? <CheckCircle2 className="h-2.5 w-2.5" /> : isInvalid ? <XCircle className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                                  {isValid ? 'Valid' : isInvalid ? 'Invalid' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
                                  isSynced ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {isSynced ? <RefreshCw className="h-2.5 w-2.5" /> : null}
                                  {isSynced ? 'Tersinkron' : 'Belum On-Chain'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-[12px] text-slate-500">
                                {new Date(entry.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {whitelistEntries.length > 20 && (
                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-[12px] text-slate-500">
                      Menampilkan 20 dari {whitelistEntries.length} pemilih
                    </div>
                  )}
                </div>
              )}
            </div>
          </SuperadminSectionCard>

          {/* Description / Ringkasan */}
          {proposal?.description && (
            <SuperadminSectionCard className="border border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-slate-700" />
                <h2 className="text-[18px] font-semibold text-slate-900">Deskripsi Pemilihan</h2>
              </div>
              <div className="mt-4 text-[15px] leading-7 text-slate-700">
                <RichTextRenderer value={proposal.description} emptyFallback="Tidak ada deskripsi." />
              </div>
            </SuperadminSectionCard>
          )}
        </div>

        {/* Sidebar: Activity Feed */}
        <SuperadminSectionCard className="border border-slate-200 bg-white p-0">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <h2 className="text-[18px] font-semibold text-slate-900">Riwayat Aktivitas</h2>
            {activities.length > 0 && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] font-medium text-emerald-600">{activities.length} aktivitas</span>
            )}
          </div>

          <div className="max-h-[920px] overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {activities.length > 0 ? activities.map((activity) => (
                <article key={activity.id} className="relative pl-8">
                  <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-600">+</span>
                  <h3 className="text-[14px] font-semibold text-slate-900">{activity.title}</h3>
                  {activity.message && (
                    <p className="mt-1 text-[13px] leading-5 text-slate-600">{activity.message}</p>
                  )}
                  <p className="mt-1 text-[12px] text-slate-400">{activity.actorLabel}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{new Date(activity.createdAt).toLocaleString('id-ID')}</p>
                  <div className="absolute bottom-[-16px] left-[11px] top-6 w-px bg-slate-200 last:hidden" />
                </article>
              )) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 px-5 py-8 text-center text-[14px] text-slate-500">
                  <Clock3 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p>Belum ada riwayat aktivitas untuk pemilihan ini.</p>
                  <p className="mt-1 text-[12px] text-slate-400">Aktivitas akan muncul setelah admin melakukan aksi pada proposal.</p>
                </div>
              )}
            </div>
          </div>

          {proposal?.deployedSpaceAddress && (
            <div className="border-t border-slate-100 px-6 py-5">
              <a
                href={`https://sepolia.basescan.org/address/${proposal.deployedSpaceAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 text-[14px] font-medium text-slate-900 hover:text-slate-700"
              >
                Buka di Basescan
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </SuperadminSectionCard>
        </section>
      </ScrollReveal>

      <ConfirmDialog
        open={suspendDialogOpen}
        title="Tangguhkan pemilihan ini?"
        description="Pemilihan akan ditandai sebagai ditangguhkan lalu Anda kembali ke daftar manajemen pemilihan."
        confirmLabel="Ya, Tangguhkan"
        tone="danger"
        onCancel={() => setSuspendDialogOpen(false)}
        onConfirm={() => {
          setSuspendDialogOpen(false)
          handleSuspend()
        }}
      />
    </SuperadminShell>
  )
}
