'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import { formatPercent } from '@/lib/admin-demo-data'
import { DemoRole, getDemoSessionRole } from '@/lib/demo-auth'

import { CandidateList } from '@/components/admin/CandidateList'
import { AdminAuditLogTable } from '@/components/admin/AdminAuditLogTable'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminMonitoringPanel } from '@/components/admin/AdminMonitoringPanel'
import { PhaseManager } from '@/components/admin/PhaseManager'
import { VoterList } from '@/components/admin/VoterList'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { InfoBanner } from '@/components/ui/InfoBanner'
import { MetricCard } from '@/components/ui/MetricCard'

interface AdminDashboardProps {
  spaceId: string
}

export function AdminDashboard({ spaceId }: AdminDashboardProps) {
  const [roleChecked, setRoleChecked] = useState(false)
  const [sessionRole, setSessionRole] = useState<DemoRole | null>(null)

  const {
    addCandidate,
    addVoter,
    auditLogs,
    error,
    load,
    loading,
    participationRate,
    removeCandidate,
    removeVoter,
    spaceState,
    transitionPhase,
  } = useAdminDashboard(spaceId)

  const tabs = useMemo(
    () => [
      { label: 'Admin', href: `/space/${spaceId}/admin` },
      { label: 'Voting (Commit)', href: `/space/${spaceId}/vote` },
      { label: 'Konfirmasi (Reveal)', href: `/space/${spaceId}/reveal` },
      { label: 'Hasil', href: `/space/${spaceId}/results` },
    ],
    [spaceId],
  )

  useEffect(() => {
    const role = getDemoSessionRole()
    setSessionRole(role)
    setRoleChecked(true)
  }, [])

  const allowedAdmin = sessionRole === 'admin' || sessionRole === 'superadmin'

  return (
    <AppShell
      mainClassName="py-8"
      spaceName={spaceState?.name ?? 'Memuat space...'}
      tabs={tabs}
    >
      {!roleChecked ? (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>
      ) : null}

      {roleChecked && !allowedAdmin ? (
        <div className="space-y-3">
          <InfoBanner variant="danger">
            Halaman ini hanya bisa diakses oleh Admin atau Superadmin.
          </InfoBanner>
          <Link href="/login">
            <Button variant="secondary">Kembali ke Login</Button>
          </Link>
        </div>
      ) : null}

      {roleChecked && allowedAdmin && loading ? (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="h-24 animate-pulse rounded-lg border border-slate-100 bg-slate-100"
                key={index}
              />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-xl border border-slate-100 bg-white" />
            <div className="h-72 animate-pulse rounded-xl border border-slate-100 bg-white" />
          </div>
        </div>
      ) : null}

      {roleChecked && allowedAdmin && !loading && error ? (
        <div className="space-y-3">
          <InfoBanner variant="danger">{error}</InfoBanner>
          <Button onClick={() => void load()} variant="secondary">
            Coba Lagi
          </Button>
        </div>
      ) : null}

      {roleChecked && allowedAdmin && !loading && !error && spaceState ? (
        <>
          <div className="mb-4">
            <InfoBanner variant="info">
              Mode demo admin aktif. Fokus halaman ini untuk simulasi alur fase, whitelist, kandidat,
              monitoring, dan audit log.
            </InfoBanner>
          </div>

          <AdminHeader
            contractAddress={spaceState.contractAddress}
            phase={spaceState.phase}
            spaceName={spaceState.name}
          />

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Pemilih Terdaftar"
              value={Intl.NumberFormat('id-ID').format(spaceState.registeredCount)}
            />
            <MetricCard
              label="Sudah Commit"
              value={Intl.NumberFormat('id-ID').format(spaceState.committedCount)}
            />
            <MetricCard
              label="Sudah Reveal"
              value={Intl.NumberFormat('id-ID').format(spaceState.revealedCount)}
            />
            <MetricCard
              label="Partisipasi"
              value={formatPercent(participationRate)}
              subValue={`${Intl.NumberFormat('id-ID').format(
                spaceState.committedCount,
              )} dari ${Intl.NumberFormat('id-ID').format(spaceState.registeredCount)} voter`}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <PhaseManager onTransition={transitionPhase} phase={spaceState.phase} />
            <VoterList
              onAddVoter={addVoter}
              onRemoveVoter={removeVoter}
              phase={spaceState.phase}
              voters={spaceState.voters}
            />
          </div>

          <div className="mt-4">
            <CandidateList
              candidateMutableOnChain={spaceState.candidateMutableOnChain}
              candidates={spaceState.candidates}
              onAddCandidate={addCandidate}
              onRemoveCandidate={removeCandidate}
              phase={spaceState.phase}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <AdminMonitoringPanel
              candidates={spaceState.candidates}
              committedCount={spaceState.committedCount}
              phase={spaceState.phase}
              registeredCount={spaceState.registeredCount}
              revealedCount={spaceState.revealedCount}
            />
            <AdminAuditLogTable logs={auditLogs} />
          </div>
        </>
      ) : null}
    </AppShell>
  )
}
