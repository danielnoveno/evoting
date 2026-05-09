import { FileText, Users, AlertTriangle, Settings, ShieldCheck } from 'lucide-react'
import { ReactNode } from 'react'
import { SuperadminShell, SuperadminModuleCard } from '@/components/superadmin/superadmin-shell'
import { superadminDashboardContent, type SuperadminModuleKey } from '@/lib/dummy-superadmin-content'

const moduleIcons: Partial<Record<SuperadminModuleKey, ReactNode>> = {
  'manajemen-admin': <Users className="h-5 w-5" />,
  'manajemen-proposal': <FileText className="h-5 w-5" />,
  'risk-activity': <AlertTriangle className="h-5 w-5" />,
  'pengaturan-platform': <Settings className="h-5 w-5" />,
}

export default function SuperadminPage() {
  return (
    <SuperadminShell>
      <section className="rounded-[32px] bg-slate-100 p-6 md:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_280px] lg:items-center">
          <div>
            <span className="rounded-full bg-black px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
              {superadminDashboardContent.hero.badge}
            </span>
            <h1 className="mt-8 max-w-[14ch] text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-900 md:text-[64px]">
              {superadminDashboardContent.hero.title}
            </h1>
            <p className="mt-6 max-w-[840px] text-[18px] leading-9 text-slate-600">
              {superadminDashboardContent.hero.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="inline-flex h-12 items-center justify-center rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900">
                {superadminDashboardContent.hero.primaryCta}
              </button>
              <button type="button" className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-50">
                {superadminDashboardContent.hero.secondaryCta}
              </button>
            </div>
          </div>

          <div className="mx-auto flex h-[240px] w-full max-w-[260px] items-center justify-center rounded-full bg-white/70">
            <div className="relative h-[170px] w-[170px] rounded-[36px] bg-black shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="h-16 w-16 rounded-full border border-white/10 bg-white/5" />
              </div>
              <div className="absolute -right-6 -top-6 flex h-20 w-20 items-center justify-center rounded-[24px] border-4 border-white bg-red-100 text-red-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {superadminDashboardContent.metricCards.map((metric) => (
          <article key={metric.label} className="rounded-[24px] border border-slate-200 bg-white p-6">
            <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">{metric.label}</p>
            <p className="mt-4 text-[42px] font-semibold leading-none tracking-[-0.04em] text-slate-900">{metric.value}</p>
            <p className={`mt-3 text-[14px] font-medium ${
              metric.tone === 'success' ? 'text-emerald-600' :
              metric.tone === 'warning' ? 'text-amber-600' :
              metric.tone === 'danger' ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {metric.change}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">Modul Kendali</h2>
        
        <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
          {superadminDashboardContent.modules.map((module) => (
            <SuperadminModuleCard
              key={module.title}
              title={module.title}
              description={module.description}
              icon={moduleIcons[module.key as SuperadminModuleKey]}
              dark={module.dark}
              cta={module.cta}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="rounded-[32px] bg-slate-100 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[28px] font-semibold text-slate-900">Risk Activity Terkini</h2>
            <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-700">
              Real-time Monitor
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {superadminDashboardContent.recentRiskActivities.map((activity) => (
              <article key={activity.block} className="rounded-[24px] bg-white p-5 border-l-4 border-red-500">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Blok {activity.block}</p>
                    <p className="mt-3 font-mono text-[16px] text-slate-700 max-w-3xl">{activity.text}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-slate-400">{activity.time}</p>
                    <p className="mt-1 text-[14px] font-semibold text-red-600">{activity.status}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SuperadminShell>
  )
}
