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

const metricIcons = {
  admins: Users,
  spaces: Vote,
  proposals: Activity,
  voters: Users,
} as const

function ActivityToneIcon({ tone }: { tone: 'success' | 'info' | 'warning' }) {
  if (tone === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (tone === 'warning') return <TriangleAlert className="h-4 w-4 text-amber-600" />
  return <CheckCircle2 className="h-4 w-4 text-blue-600" />
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
  const [range, setRange] = useState<(typeof superadminDashboardData.chart.ranges)[number]>('7H')

  const maxValue = useMemo(() => Math.max(...superadminDashboardData.chart.series[range]), [range])
  const metrics = useMemo(() => superadminDashboardData.metrics.map((metric) => {
    const live = dashboardMetrics.data
    if (metric.id === 'admins') return { ...metric, value: String(live?.totalAdmins ?? admins.length), hint: live ? 'data live' : metric.hint }
    if (metric.id === 'spaces') return { ...metric, value: String(live?.activeSpaces ?? elections.filter((item) => item.status === 'Aktif').length), hint: live ? 'data live' : metric.hint }
    if (metric.id === 'proposals') return { ...metric, value: String(live?.pendingProposals ?? proposals.filter((item) => item.status === 'Menunggu Review').length), hint: live ? 'data live' : metric.hint }
    if (metric.id === 'voters') return { ...metric, value: String(live?.totalVoters ?? 0), hint: live ? 'data live' : metric.hint }
    return metric
  }), [admins.length, dashboardMetrics.data, elections, proposals])

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
                <p className="mt-2 text-[15px] text-slate-800">{superadminDashboardData.chart.description}</p>
              </div>
              <div className="inline-flex rounded-2xl bg-white p-1">
                {superadminDashboardData.chart.ranges.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRange(item)}
                    className={range === item ? 'rounded-xl bg-slate-100 px-4 py-2 text-[14px] font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10' : 'rounded-xl px-4 py-2 text-[14px] text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10'}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 grid h-[340px] grid-cols-7 items-end gap-4 rounded-[28px] bg-white px-6 pb-8 pt-10">
              {superadminDashboardData.chart.series[range].map((value, index) => (
                <div key={`${range}-${index}`} className="flex h-full flex-col items-center justify-end gap-4">
                  <div className="flex h-full w-full items-end">
                    <div
                      className={`w-full rounded-t-[8px] ${index === 4 || index === 5 ? 'bg-slate-400' : index === 3 ? 'bg-slate-100' : 'bg-slate-200'}`}
                      style={{ height: `${Math.max((value / maxValue) * 100, 18)}%` }}
                    />
                  </div>
                  <span className={`text-[12px] uppercase tracking-[0.08em] ${index === 4 ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                    {superadminDashboardData.chart.labels[index]}
                  </span>
                </div>
              ))}
            </div>
          </AppSectionCard>
        </ScrollReveal>

        <ScrollReveal variant="fade-left" delay={300} duration={800} className="h-full">
          <AppSectionCard className="h-full">
            <div className="flex items-start justify-between gap-4">
              <h2 className="max-w-[12ch] text-[18px] font-semibold text-slate-900">Log Aktivitas Terbaru</h2>
              <button type="button" onClick={() => router.push('/superadmin/manajemen-admin')} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10">
                Lihat Semua
              </button>
            </div>

            <div className="mt-8 space-y-7">
              {[...superadminDashboardData.activities.slice(0, 2), {
                id: 'live-risk',
                title: 'Aktivitas Mencurigakan',
                description: `${alerts.length} alert aktif masih memerlukan tindak lanjut.`,
                time: 'Live',
                tone: 'warning' as const,
              }].map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <ActivityToneIcon tone={activity.tone} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-slate-900">{activity.title}</h3>
                    <p className="mt-2 max-w-[32ch] text-[14px] leading-7 text-slate-800">{activity.description}</p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.08em] text-slate-400">{activity.time}</p>
                  </div>
                </div>
              ))}
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
                <p className="mt-2 text-[15px] text-slate-800">{superadminDashboardData.blockchainStatus.description}</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center">
              <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-100 px-5 py-3 font-mono text-[14px] text-slate-700">
                <Link2 className="h-4 w-4" />
                {superadminDashboardData.blockchainStatus.hash}
              </div>
              <div className="inline-flex items-center gap-2 text-[14px] font-medium uppercase tracking-[0.08em] text-emerald-500">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {superadminDashboardData.blockchainStatus.status}
              </div>
            </div>
          </div>
        </AppSectionCard>
      </ScrollReveal>
    </SuperadminShell>
  )
}
