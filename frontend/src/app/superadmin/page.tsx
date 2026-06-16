'use client'

import { Activity, CheckCircle2, Link2, TriangleAlert, Users, Vote } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { SuperadminInteractiveCard, SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { SuperadminOnboardingTour } from '@/components/superadmin/onboarding-tour'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { superadminDashboardData } from '@/lib/superadmin-data'
import { useSuperadminAdminsStore, useSuperadminElectionsStore, useSuperadminProposalsStore, useSuperadminRiskAlertsStore } from '@/lib/superadmin-store'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

type DashboardMetrics = {
  totalAdmins: number
  activeSpaces: number
  pendingProposals: number
  totalVoters: number
}

type ChartSeriesItem = {
  name: string
  color: string
  data: Array<{ x: string; y: number }>
}

type ActivityItem = {
  id: string
  type: string
  label: string
  actor: string
  txHash: string
  blockNumber: number | null
  status: 'success' | 'failed'
  metadata: Record<string, unknown> | null
  timestamp: string
}

type DashboardActivityResponse = {
  chart: {
    categories: string[]
    series: ChartSeriesItem[]
  }
  activities: ActivityItem[]
  blockchainStatus: {
    network: string
    status: string
    latestBlock: number | null
    totalTransactions: number
    successRate: number
  }
}

function isDashboardMetrics(value: unknown): value is DashboardMetrics {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.totalAdmins === 'number'
    && typeof record.activeSpaces === 'number'
    && typeof record.pendingProposals === 'number'
    && typeof record.totalVoters === 'number'
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const client = getSupabaseBrowserClient()
  if (!client) return { totalAdmins: 0, activeSpaces: 0, pendingProposals: 0, totalVoters: 0 }

  const { data: sessionData } = await client.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) return { totalAdmins: 0, activeSpaces: 0, pendingProposals: 0, totalVoters: 0 }

  const response = await fetch('/api/superadmin/dashboard-metrics', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Gagal memuat statistik dashboard superadmin.')

  const payload: unknown = await response.json()
  if (!isDashboardMetrics(payload)) throw new Error('Format statistik dashboard tidak valid.')
  return payload
}

function isDashboardActivity(value: unknown): value is DashboardActivityResponse {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.chart === 'object' && record.chart !== null
    && Array.isArray((record.chart as Record<string, unknown>).categories)
    && Array.isArray((record.chart as Record<string, unknown>).series)
    && Array.isArray(record.activities)
    && typeof record.blockchainStatus === 'object'
}

async function fetchDashboardActivity(days = 7, limit = 10): Promise<DashboardActivityResponse> {
  const client = getSupabaseBrowserClient()
  if (!client) {
    return {
      chart: { categories: [], series: [] },
      activities: [],
      blockchainStatus: { network: 'Base Sepolia', status: 'Menunggu data', latestBlock: null, totalTransactions: 0, successRate: 100 },
    }
  }

  const { data: sessionData } = await client.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) {
    return {
      chart: { categories: [], series: [] },
      activities: [],
      blockchainStatus: { network: 'Base Sepolia', status: 'Menunggu data', latestBlock: null, totalTransactions: 0, successRate: 100 },
    }
  }

  const response = await fetch(`/api/superadmin/dashboard-activity?days=${days}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Gagal memuat data aktivitas dashboard.')

  const payload: unknown = await response.json()
  if (!isDashboardActivity(payload)) throw new Error('Format data aktivitas dashboard tidak valid.')
  return payload
}

const metricIcons = {
  admins: Users,
  spaces: Vote,
  proposals: Activity,
  voters: Users,
} as const

function ActivityToneIcon({ status }: { status: 'success' | 'failed' }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  return <TriangleAlert className="h-4 w-4 text-amber-600" />
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} mnt lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

export default function SuperadminDashboardPage() {
  const router = useRouter()
  const { admins } = useSuperadminAdminsStore()
  const { elections } = useSuperadminElectionsStore()
  const { proposals } = useSuperadminProposalsStore()
  const { alerts } = useSuperadminRiskAlertsStore()

  const dashboardMetrics = useQuery({
    queryKey: ['superadmin', 'dashboard-metrics'],
    queryFn: fetchDashboardMetrics,
    retry: false,
  })

  const [days, setDays] = useState<7 | 30>(7)
  const dashboardActivity = useQuery({
    queryKey: ['superadmin', 'dashboard-activity', days],
    queryFn: () => fetchDashboardActivity(days, 10),
    retry: false,
  })

  const activityData = dashboardActivity.data

  // Compute max value for chart bars
  const maxValue = useMemo(() => {
    if (!activityData?.chart.series.length) return 1
    let max = 0
    for (const series of activityData.chart.series) {
      for (const point of series.data) {
        if (point.y > max) max = point.y
      }
    }
    return Math.max(max, 1)
  }, [activityData])

  // Aggregate total per category for bar heights
  const categoryTotals = useMemo(() => {
    if (!activityData?.chart.categories.length) return []
    return activityData.chart.categories.map((_, idx) => {
      let total = 0
      for (const series of activityData.chart.series) {
        total += series.data[idx]?.y ?? 0
      }
      return total
    })
  }, [activityData])

  const metrics = useMemo(() => superadminDashboardData.metrics.map((metric) => {
    const live = dashboardMetrics.data
    if (metric.id === 'admins') return { ...metric, value: String(live?.totalAdmins ?? admins.length), hint: live ? 'data live' : metric.hint }
    if (metric.id === 'spaces') return { ...metric, value: String(live?.activeSpaces ?? elections.filter((item) => item.status === 'Aktif').length), hint: live ? 'data live' : metric.hint }
    if (metric.id === 'proposals') return { ...metric, value: String(live?.pendingProposals ?? proposals.filter((item) => item.status === 'Menunggu Review').length), hint: live ? 'data live' : metric.hint }
    if (metric.id === 'voters') return { ...metric, value: String(live?.totalVoters ?? 0), hint: live ? 'data live' : metric.hint }
    return metric
  }), [admins.length, dashboardMetrics.data, elections, proposals])

  const chartCategories = activityData?.chart.categories ?? []
  const hasChartData = chartCategories.length > 0 && categoryTotals.some((t) => t > 0)

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader
          title={superadminDashboardData.title}
          description={superadminDashboardData.description}
        />
      </ScrollReveal>

      <StaggerContainer id="tour-superadmin-metrics" stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-5 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metricIcons[metric.id as keyof typeof metricIcons]

          return (
            <SuperadminInteractiveCard
              key={metric.id}
              onClick={() => {
                if (metric.id === 'admins') router.push('/superadmin/manajemen-admin')
                else if (metric.id === 'spaces') router.push('/superadmin/manajemen-pemilihan')
                else if (metric.id === 'proposals') router.push('/superadmin/manajemen-proposal')
              }}
              className="p-6 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">{metric.label}</p>
                <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-8 text-[40px] font-semibold tracking-[-0.04em] text-slate-900">{metric.value}</p>
              <p className={`mt-3 text-[15px] ${metric.tone === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
                {metric.delta} {metric.hint ? <span className="text-slate-500">{metric.hint}</span> : null}
              </p>
            </SuperadminInteractiveCard>
          )
        })}
      </StaggerContainer>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1.5fr_1fr]">
        <ScrollReveal variant="fade-up" delay={200} duration={800} className="h-full">
          <AppSectionCard className="h-full">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">{superadminDashboardData.chart.title}</h2>
                <p className="mt-2 text-[15px] text-slate-800">
                  {activityData ? `${activityData.blockchainStatus.totalTransactions} transaksi tercatat dalam ${days} hari terakhir.` : 'Memuat data aktivitas...'}
                </p>
              </div>
              <div className="inline-flex rounded-2xl bg-white p-1">
                {([7, 30] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={days === d ? 'rounded-xl bg-slate-100 px-4 py-2 text-[14px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10' : 'rounded-xl px-4 py-2 text-[14px] text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10'}
                  >
                    {d}H
                  </button>
                ))}
              </div>
            </div>

            {hasChartData ? (
              <div className="mt-10 grid items-end gap-2 rounded-[28px] bg-white px-6 pb-8 pt-10" style={{ gridTemplateColumns: `repeat(${chartCategories.length}, minmax(0, 1fr))` }}>
                {chartCategories.map((category, index) => (
                  <div key={`${days}-${index}`} className="flex h-[300px] flex-col items-center justify-end gap-3">
                    <div className="flex h-full w-full items-end">
                      <div
                        className="w-full rounded-t-[8px] bg-slate-700 transition-all duration-500"
                        style={{ height: `${Math.max((categoryTotals[index] / maxValue) * 100, 4)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 text-center leading-tight">
                      {category}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-10 flex h-[340px] items-center justify-center rounded-[28px] bg-white">
                <p className="text-[15px] text-slate-400">
                  {dashboardActivity.isLoading ? 'Memuat data grafik...' : 'Belum ada data aktivitas jaringan.'}
                </p>
              </div>
            )}

            {/* Legend */}
            {activityData && activityData.chart.series.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {activityData.chart.series.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-[13px] text-slate-600">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </AppSectionCard>
        </ScrollReveal>

        <ScrollReveal variant="fade-left" delay={300} duration={800} className="h-full">
          <AppSectionCard className="h-full">
            <div className="flex items-start justify-between gap-4">
              <h2 className="max-w-[12ch] text-[18px] font-semibold text-slate-900">Log Aktivitas Terbaru</h2>
              <button type="button" onClick={() => router.push('/superadmin/audit-log')} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10">
                Lihat Semua
              </button>
            </div>

            <div className="mt-8 space-y-7">
              {/* Real activities from API */}
              {(activityData?.activities ?? []).slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <ActivityToneIcon status={activity.status} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-slate-900">{activity.label}</h3>
                    <p className="mt-2 max-w-[32ch] text-[14px] leading-7 text-slate-800">
                      Oleh {activity.actor}{activity.txHash ? ` · Tx: ${activity.txHash.slice(0, 10)}...` : ''}
                    </p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-slate-400">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Risk alert fallback */}
              {alerts.length > 0 && (
                <div className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <TriangleAlert className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-slate-900">Aktivitas Mencurigakan</h3>
                    <p className="mt-2 max-w-[32ch] text-[14px] leading-7 text-slate-800">
                      {alerts.length} alert aktif masih memerlukan tindak lanjut.
                    </p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-slate-400">Live</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!activityData && dashboardActivity.isLoading && (
                <div className="text-center py-8">
                  <p className="text-[14px] text-slate-400">Memuat log aktivitas...</p>
                </div>
              )}
              {activityData && activityData.activities.length === 0 && alerts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[14px] text-slate-400">Belum ada aktivitas tercatat.</p>
                  <p className="text-[13px] text-slate-400 mt-1">Aktivitas akan muncul setelah ada transaksi di jaringan.</p>
                </div>
              )}
            </div>
          </AppSectionCard>
        </ScrollReveal>
      </div>

      <ScrollReveal variant="fade-up" delay={150} duration={700}>
        <AppSectionCard className="mt-8 p-5 md:p-5 px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-14 w-1 rounded-full bg-black" />
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">{superadminDashboardData.blockchainStatus.title}</h2>
                <p className="mt-2 text-[15px] text-slate-800">
                  {activityData
                    ? `${activityData.blockchainStatus.network} · ${activityData.blockchainStatus.totalTransactions} transaksi · Tingkat keberhasilan ${activityData.blockchainStatus.successRate}%`
                    : 'Menunggu data blockchain...'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center">
              {activityData?.blockchainStatus.latestBlock && (
                <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-5 py-3 font-mono text-[14px] text-slate-700">
                  <Link2 className="h-4 w-4" />
                  Block #{activityData.blockchainStatus.latestBlock}
                </div>
              )}
              <div className="inline-flex items-center gap-2 text-[14px] font-medium uppercase tracking-[0.08em] text-emerald-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {activityData?.blockchainStatus.status ?? 'Menunggu data'}
              </div>
            </div>
          </div>
        </AppSectionCard>
      </ScrollReveal>
    </SuperadminShell>
  )
}
