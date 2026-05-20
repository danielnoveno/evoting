'use client'

import { AlertTriangle, BarChart3, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { SuperadminEmptyState, SuperadminInteractiveCard, SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { superadminRiskData } from '@/lib/superadmin-dummy-data'
import { useSuperadminRiskAlertsStore } from '@/lib/superadmin-mock-store'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

export default function SuperadminRiskActivityPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { alerts, setAlerts } = useSuperadminRiskAlertsStore()
  const [blockedAlertId, setBlockedAlertId] = useState<string | null>(null)

  return (
    <SuperadminShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader
          title={superadminRiskData.title}
          description={superadminRiskData.description}
        />
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-5 xl:grid-cols-3">
        {superadminRiskData.metrics.map((metric) => (
          <article key={metric.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">{metric.label}</p>
            <div className="mt-5 flex items-end gap-3">
              <p className={`text-[54px] font-semibold leading-none tracking-[-0.04em] ${metric.tone === 'danger' ? 'text-red-700' : 'text-slate-900'}`}>{metric.value}</p>
              {metric.suffix ? <span className="pb-1 text-[18px] font-medium text-slate-800">{metric.suffix}</span> : null}
              {metric.accent ? <span className="rounded-xl bg-red-50 px-2 py-1 text-[14px] font-semibold text-red-600">{metric.accent}</span> : null}
            </div>
            <p className={`mt-5 text-[15px] ${metric.tone === 'success' ? 'text-emerald-500' : 'text-slate-800'}`}>{metric.note}</p>
          </article>
        ))}
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_520px]">
        <div>
          <h2 className="text-[20px] font-semibold text-slate-900">Suspicious Activity Feed</h2>
          <div className="mt-6 space-y-5">
            {alerts.length > 0 ? alerts.map((alert) => (
              <SuperadminInteractiveCard key={alert.id} onClick={() => router.push('/superadmin/audit-log')} className={`bg-slate-100 p-6 ${alert.tone === 'danger' ? 'border-l-4 border-red-600' : 'border-l-4 border-amber-500'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`mt-1 flex h-10 w-10 items-center justify-center rounded-full ${alert.tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {alert.tone === 'danger' ? <AlertTriangle className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-slate-900">{alert.title}</h3>
                      <p className="mt-2 max-w-[48ch] text-[15px] leading-7 text-slate-800">{alert.description}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[13px] text-slate-500">{alert.time}</span>
                </div>

                <div className="mt-5 rounded-[18px] bg-white px-4 py-3 font-mono text-[15px] text-slate-800">
                  {alert.actorLabel}: {alert.actorValue}
                </div>

                <div className="mt-4 flex gap-3">
                  {alert.tone === 'danger' ? (
                    <button type="button" onClick={(event) => {
                      event.stopPropagation()
                      setBlockedAlertId(alert.id)
                    }} className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#0B1120] px-5 text-[15px] font-medium text-white hover:bg-slate-800">
                      Blokir Akses
                    </button>
                  ) : null}
                  <button type="button" onClick={(event) => {
                    event.stopPropagation()
                    showToast({ tone: 'info', title: 'Detail log dibuka', description: `Log dummy untuk ${alert.title} ditampilkan.` })
                  }} className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-200 px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-300">
                    Lihat Detail Log
                  </button>
                </div>
              </SuperadminInteractiveCard>
            )) : <SuperadminEmptyState title="Tidak ada alert aktif" description="Semua anomali demo sudah ditangani. Coba muat ulang seed data jika ingin melihat skenario alert lagi." />}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-slate-900">Neural Threat Summary</h2>
            <AppSectionCard className="mt-4 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <p className="text-[16px] text-slate-700">Status Model</p>
                <span className="rounded-xl bg-emerald-50 px-3 py-1 text-[14px] font-semibold text-emerald-500">{superadminRiskData.neuralSummary.status}</span>
              </div>
              <div className="pt-5">
                <div className="flex items-center justify-between gap-4 text-[15px] text-slate-700">
                  <span>Tingkat Kepercayaan</span>
                  <span>{superadminRiskData.neuralSummary.confidence}</span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 w-[94%] rounded-full bg-black" />
                </div>
                <p className="mt-6 text-[15px] leading-8 text-slate-800">{superadminRiskData.neuralSummary.description}</p>
              </div>
            </AppSectionCard>
          </div>

          <div>
            <h2 className="text-[20px] font-semibold text-slate-900">Regional Risk Profile</h2>
            <AppSectionCard className="mt-4 shadow-[0_16px_60px_rgba(15,23,42,0.08)] p-0 md:p-0">
              <div className="relative h-[240px] bg-[radial-gradient(circle_at_center,#7c7c7c_0%,#4b4b4b_45%,#2e2e2e_100%)]">
                <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px]" />
                <span className="absolute left-[34%] top-[22%] h-4 w-7 rounded-full bg-red-600" />
                <span className="absolute left-[72%] top-[62%] h-3 w-5 rounded-full bg-amber-400" />
                <span className="absolute left-[58%] top-[84%] h-2.5 w-8 rounded-full bg-white/40 blur-sm" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 text-[18px] font-semibold text-slate-900">
                  <span className="h-3 w-3 rounded-full bg-red-600" />
                  {superadminRiskData.regionProfile.region}
                </div>
                <p className="mt-4 text-[15px] leading-7 text-slate-800">{superadminRiskData.regionProfile.description}</p>
              </div>
            </AppSectionCard>
          </div>
        </div>
        </section>
      </ScrollReveal>

      <ConfirmDialog
        open={blockedAlertId !== null}
        title="Blokir akses aktor ini?"
        description="Aksi ini hanya simulasi untuk demo threat monitoring. Sistem nyata perlu validasi tambahan sebelum pemblokiran permanen."
        confirmLabel="Ya, Blokir"
        tone="danger"
        onCancel={() => setBlockedAlertId(null)}
        onConfirm={() => {
          if (blockedAlertId) {
            setAlerts((current) => current.filter((alert) => alert.id !== blockedAlertId))
          }
          showToast({ tone: 'success', title: 'Akses berhasil diblokir', description: 'Mitigasi dummy berhasil diterapkan pada alert terpilih.' })
          setBlockedAlertId(null)
        }}
      />
    </SuperadminShell>
  )
}
