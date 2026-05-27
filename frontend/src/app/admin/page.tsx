'use client'

import { FileText, LayoutGrid, ListChecks, PieChart, Plus, ShieldCheck, TimerReset, UserRoundCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { AdminMetricCard, AdminModuleCard, AdminShell } from '@/components/admin/admin-shell'
import { adminDashboardContent, type AdminModuleKey } from '@/lib/admin-content'
import { useToast } from '@/components/ui/toast-provider'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

const moduleIcons: Record<AdminModuleKey, ReactNode> = {
  beranda: <LayoutGrid className="h-5 w-5" />,
  proposal: <FileText className="h-5 w-5" />,
  fase: <TimerReset className="h-5 w-5" />,
  kandidat: <UserRoundCheck className="h-5 w-5" />,
  whitelist: <ShieldCheck className="h-5 w-5" />,
  monitoring: <ListChecks className="h-5 w-5" />,
  hasil: <PieChart className="h-5 w-5" />,
  tambah: <Plus className="h-5 w-5" />,
}

const moduleHrefs: Record<AdminModuleKey, string> = {
  beranda: '/admin',
  proposal: '/admin/daftar-proposal',
  fase: '/admin/manajemen-pemilihan',
  kandidat: '/admin/manajemen-pemilihan',
  whitelist: '/admin/manajemen-pemilihan',
  monitoring: '/admin/manajemen-pemilihan',
  hasil: '/admin/manajemen-pemilihan',
  tambah: '/admin/manajemen-pemilihan',
}

export default function AdminPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const visibleModules = adminDashboardContent.modules.filter(
    (module) => !['fase', 'kandidat', 'whitelist', 'monitoring', 'hasil'].includes(module.key)
  )

  return (
    <AdminShell>
      <section className="relative overflow-hidden rounded-[32px] bg-slate-100 p-6 md:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_280px] lg:items-center relative z-10">
          <ScrollReveal variant="fade-up" duration={800}>
            <div>
              <span className="rounded-full bg-black px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                {adminDashboardContent.hero.badge}
              </span>
              <h1 className="mt-8 max-w-[14ch] text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-900 md:text-[64px]">
                {adminDashboardContent.hero.title}
              </h1>
              <p className="mt-6 max-w-[840px] text-[18px] leading-9 text-slate-800">
                {adminDashboardContent.hero.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => router.push('/admin/manajemen-pemilihan')} className="inline-flex h-12 items-center justify-center rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                  {adminDashboardContent.hero.primaryCta}
                </button>
                <button type="button" onClick={() => showToast({ tone: 'info', title: 'Unduh Ringkasan', description: 'Fitur unduh ringkasan sedang disiapkan.' })} className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                  {adminDashboardContent.hero.secondaryCta}
                </button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="zoom-in" delay={150} duration={800}>
            <div className="mx-auto flex h-[240px] w-full max-w-[260px] items-center justify-center rounded-full bg-white/70">
              <div className="relative h-[170px] w-[170px] rounded-[36px] border border-slate-800 bg-black">
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="h-16 w-16 rounded-full border border-white/10 bg-white/5" />
                </div>
                <div className="absolute -right-6 -top-6 flex h-20 w-20 items-center justify-center rounded-[24px] border-4 border-white bg-[#dbe7ff] text-slate-900">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="mt-10">
        <ScrollReveal variant="fade-up" duration={700}>
          <h2 className="text-[38px] font-semibold tracking-[-0.03em] text-slate-900">{adminDashboardContent.section.title}</h2>
          <p className="mt-2 text-[16px] text-slate-500">{adminDashboardContent.section.description}</p>
        </ScrollReveal>

        <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleModules.map((module) => (
            <AdminModuleCard
              key={module.title}
              title={module.title}
              description={module.description}
              icon={moduleIcons[module.key]}
              dark={module.dark}
              cta={module.cta}
              href={moduleHrefs[module.key]}
            />
          ))}
        </StaggerContainer>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <ScrollReveal variant="fade-up" delay={200} duration={800} className="h-full">
          <article className="rounded-[32px] bg-slate-100 p-6 md:p-8 h-full">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[32px] font-semibold text-slate-900">{adminDashboardContent.activitySection.title}</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                {adminDashboardContent.activitySection.statusLabel}
              </span>
            </div>

            <div className="mt-8 space-y-4">
              {adminDashboardContent.recentActivities.map((activity) => (
                 <article key={activity.block} className="rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">Blok {activity.block}</p>
                      <p className="mt-3 font-mono text-[16px] text-slate-700">{activity.text}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] text-slate-400">{activity.time}</p>
                      <p className="mt-1 text-[14px] font-semibold text-emerald-600">{activity.status}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </ScrollReveal>

        <ScrollReveal variant="fade-left" delay={300} duration={800} className="h-full">
          <AdminMetricCard {...adminDashboardContent.metricCard} />
        </ScrollReveal>
      </section>
    </AdminShell>
  )
}
