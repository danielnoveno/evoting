'use client'

import { AlertTriangle, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { SuperadminEmptyState, SuperadminInteractiveCard, SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { superadminRiskData } from '@/lib/superadmin-data'
import { useSuperadminRiskAlertsStore } from '@/lib/superadmin-store'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

import { analyzeRiskPatterns } from '@/lib/ai/risk-engine'

export default function SuperadminRiskActivityPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { alerts, metrics, setAlerts, isLoading, blockActor } = useSuperadminRiskAlertsStore()
  const [blockedAlertId, setBlockedAlertId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiSummary, setAiSummary] = useState<string>('Menganalisis pola keamanan...')
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Option A: Neural Logic Analysis
  const analysis = analyzeRiskPatterns(alerts)

  // Option B: Fetch Generative Summary
  useEffect(() => {
    const fetchAiSummary = async () => {
      if (alerts.length === 0) {
        setAiSummary('Sistem dalam kondisi stabil. Tidak ada aktivitas mencurigakan yang terdeteksi melalui analisis neural.')
        return
      }

      setIsAiLoading(true)
      try {
        const res = await fetch('/api/ai/risk-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alerts, analysis })
        })
        const data = await res.json()
        setAiSummary(data.summary || 'Gagal memuat ringkasan AI.')
      } catch (err) {
        setAiSummary('Terjadi kesalahan saat menghubungi Neural Engine.')
      } finally {
        setIsAiLoading(false)
      }
    }

    if (!isLoading) {
      fetchAiSummary()
    }
  }, [alerts, isLoading])

  const getNeuralSummary = () => {
    return {
      status: analysis.riskLevel === 'low' ? 'Optimal' : 
              analysis.riskLevel === 'medium' ? 'Waspada' :
              analysis.riskLevel === 'high' ? 'Anomali Tinggi' : 'Kritis',
      confidence: `${90 + (analysis.weightedScore % 10)}%`,
      description: aiSummary,
      tone: analysis.riskLevel === 'low' ? 'success' as const :
            analysis.riskLevel === 'medium' ? 'warning' as const : 'danger' as const
    }
  }

  const neuralSummary = getNeuralSummary()

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader
          title={superadminRiskData.title}
          description={superadminRiskData.description}
        />
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 grid gap-5 xl:grid-cols-3">
        {superadminRiskData.metrics.map((metric) => {
          // Sync metric value with real alerts count
          let displayValue = metric.value
          let displayNote = metric.note

          if (metric.id === 'alerts') {
            displayValue = alerts.length.toString()
            displayNote = alerts.length > 0 ? `${alerts.filter(a => a.tone === 'danger').length} risiko tinggi terdeteksi` : 'Sistem terpantau aman'
          } else if (metric.id === 'spaces') {
            displayValue = metrics.spaces.toString()
            displayNote = `${metrics.spaces} ruang pemilihan aktif`
          } else if (metric.id === 'incidents') {
            displayValue = metrics.incidents.toString()
            displayNote = `${metrics.incidents} anomali telah ditangani`
          }

          return (
            <article key={metric.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
              <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">{metric.label}</p>
              <div className="mt-5 flex items-end gap-3">
                <p className={`text-[54px] font-semibold leading-none tracking-[-0.04em] ${
                  (metric.id === 'alerts' && alerts.length > 0) ? 'text-red-700' : 'text-slate-900'
                }`}>{displayValue}</p>
                {metric.suffix ? <span className="pb-1 text-[18px] font-medium text-slate-800">{metric.suffix}</span> : null}
                {metric.accent ? <span className="rounded-xl bg-red-50 px-2 py-1 text-[14px] font-semibold text-red-600">{metric.accent}</span> : null}
              </div>
              <p className={`mt-5 text-[15px] ${
                (metric.id === 'alerts' && alerts.length > 0) ? 'text-red-600' : 
                (metric.tone === 'success' || (metric.id === 'incidents' && metrics.incidents > 0) ? 'text-emerald-500' : 'text-slate-800')
              }`}>{displayNote}</p>
            </article>
          )
        })}
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_520px]">
        <div>
          <h2 className="text-[20px] font-semibold text-slate-900">Suspicious Activity Feed</h2>
          <div className="mt-6 space-y-5">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50">
                <div className="text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
                  <p className="mt-2 text-[15px] text-slate-500">Menganalisis anomali terbaru...</p>
                </div>
              </div>
            ) : alerts.length > 0 ? alerts.map((alert) => (
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
                    showToast({ tone: 'info', title: 'Detail log dibuka', description: `Detail log untuk ${alert.title} sedang ditampilkan.` })
                  }} className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-200 px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-300">
                    Lihat Detail Log
                  </button>
                </div>
              </SuperadminInteractiveCard>
            )) : <SuperadminEmptyState title="Tidak ada alert aktif" description="Semua anomali aktif sudah ditangani. Coba muat ulang data untuk melihat alert lainnya." />}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-[20px] font-semibold text-slate-900">Neural Threat Summary</h2>
            <AppSectionCard className="mt-4 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <p className="text-[16px] text-slate-700">Status Model</p>
                <span className={`rounded-xl px-3 py-1 text-[14px] font-semibold ${
                  neuralSummary.tone === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  neuralSummary.tone === 'danger' ? 'bg-red-50 text-red-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {neuralSummary.status}
                </span>
              </div>
              <div className="pt-5">
                <div className="flex items-center justify-between gap-4 text-[15px] text-slate-700">
                  <span>Tingkat Kepercayaan</span>
                  <span>{neuralSummary.confidence}</span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-slate-200">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-1000 ${
                      neuralSummary.tone === 'success' ? 'bg-emerald-500' :
                      neuralSummary.tone === 'danger' ? 'bg-red-600' :
                      'bg-amber-500'
                    }`} 
                    style={{ width: neuralSummary.confidence }} 
                  />
                </div>
                <div className={`mt-6 transition-opacity duration-300 ${isAiLoading ? 'opacity-50' : 'opacity-100'}`}>
                  {isAiLoading ? (
                    <div className="space-y-2">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                      <div className="h-4 w-4/6 animate-pulse rounded bg-slate-100" />
                    </div>
                  ) : (
                    <p className="text-[15px] leading-8 text-slate-800">{neuralSummary.description}</p>
                  )}
                </div>
              </div>
            </AppSectionCard>
          </div>

        </div>
        </section>
      </ScrollReveal>

      <ConfirmDialog
        open={blockedAlertId !== null}
        title="Blokir akses aktor ini?"
        description="Tinjau kembali detail alert sebelum melakukan pemblokiran permanen."
        confirmLabel={isProcessing ? 'Memproses...' : 'Ya, Blokir'}
        tone="danger"
        onCancel={() => setBlockedAlertId(null)}
        onConfirm={async () => {
          if (blockedAlertId) {
            setIsProcessing(true)
            await blockActor(blockedAlertId)
            setIsProcessing(false)
          }
          showToast({ tone: 'success', title: 'Akses berhasil diblokir', description: 'Langkah mitigasi berhasil diterapkan pada alert terpilih.' })
          setBlockedAlertId(null)
        }}
      />
    </SuperadminShell>
  )
}
