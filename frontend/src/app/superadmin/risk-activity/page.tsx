'use client'

import { AlertTriangle, BarChart3, ExternalLink, RefreshCcw, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { SuperadminEmptyState, SuperadminInteractiveCard, SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { SuperadminOnboardingTour } from '@/components/superadmin/onboarding-tour'
import { AppPageHeader } from '@/components/ui/app-page-header'
import { AppSectionCard } from '@/components/ui/app-section-card'
import { superadminRiskData, type SuperadminRiskAlert } from '@/lib/superadmin-data'
import { useSuperadminRiskAlertsStore } from '@/lib/superadmin-store'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

import { analyzeRiskPatterns } from '@/lib/ai/risk-engine'

export default function SuperadminRiskActivityPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { alerts, metrics, setAlerts, isLoading, error, refresh, blockActor } = useSuperadminRiskAlertsStore()
  const [blockedAlertId, setBlockedAlertId] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<SuperadminRiskAlert | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiSummary, setAiSummary] = useState<string>('Menganalisis pola keamanan...')
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Layer 1: Heuristic pattern analysis (local, deterministic)
  const analysis = analyzeRiskPatterns(alerts)

  const buildInternalRiskSummary = () => {
    if (alerts.length === 0) return 'Tidak ada alert aktif. Status risiko rendah berdasarkan data risk_alerts terbaru.'
    const dangerCount = alerts.filter((alert) => alert.tone === 'danger').length
    const warningCount = alerts.filter((alert) => alert.tone === 'warning').length
    return `${alerts.length} alert aktif dianalisis: ${dangerCount} risiko tinggi dan ${warningCount} peringatan. Skor risiko ${analysis.weightedScore}/100 dengan rekomendasi: ${analysis.suggestedAction}.`
  }

  const headerDescription = isLoading
    ? 'Memuat alert risiko dari backend.'
    : alerts.length > 0
      ? `${alerts.length} alert aktif dari backend perlu ditinjau superadmin.`
      : 'Tidak ada alert aktif dari backend saat ini.'

  // Layer 2: Generative summary via Gemini API
  useEffect(() => {
    const fetchAiSummary = async () => {
      if (alerts.length === 0) {
        setAiSummary('Sistem dalam kondisi stabil. Tidak ada aktivitas mencurigakan yang terdeteksi melalui analisis pola.')
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
          setAiSummary(data.summary || buildInternalRiskSummary())
      } catch (err) {
        setAiSummary(buildInternalRiskSummary())
      } finally {
        setIsAiLoading(false)
      }
    }

    if (!isLoading) {
      fetchAiSummary()
    }
  }, [alerts, isLoading])

  const getRiskSummary = () => {
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

  const riskSummary = getRiskSummary()

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <AppPageHeader
          title={superadminRiskData.title}
          description={headerDescription}
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

      {error && (
        <div className="mt-6 rounded-[20px] border border-red-200 bg-red-50 px-6 py-4">
          <p className="text-[14px] font-medium text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => refresh()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2 text-[13px] font-semibold text-red-700 hover:bg-red-200"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Coba Lagi
          </button>
        </div>
      )}

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_520px]">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold text-slate-900">Suspicious Activity Feed</h2>
            <button
              type="button"
              onClick={() => refresh()}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-[14px] font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Memuat...' : 'Muat Ulang'}
            </button>
          </div>
          <div className="mt-6 space-y-5">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50">
                <div className="text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
                  <p className="mt-2 text-[15px] text-slate-500">Menganalisis anomali terbaru...</p>
                </div>
              </div>
            ) : alerts.length > 0 ? alerts.map((alert) => (
              <SuperadminInteractiveCard key={alert.id} onClick={() => setSelectedAlert(alert)} className={`bg-slate-100 p-6 ${alert.tone === 'danger' ? 'border-l-4 border-red-600' : 'border-l-4 border-amber-500'}`}>
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
                    setSelectedAlert(alert)
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
            <h2 className="text-[20px] font-semibold text-slate-900">Analisis Risiko AI</h2>
            <AppSectionCard className="mt-4 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <p className="text-[16px] text-slate-700">Status Analisis</p>
                <span className={`rounded-xl px-3 py-1 text-[14px] font-semibold ${
                  riskSummary.tone === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  riskSummary.tone === 'danger' ? 'bg-red-50 text-red-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {riskSummary.status}
                </span>
              </div>
              <div className="pt-5">
                <div className="flex items-center justify-between gap-4 text-[15px] text-slate-700">
                  <span>Tingkat Kepercayaan</span>
                  <span>{riskSummary.confidence}</span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-slate-200">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-1000 ${
                      riskSummary.tone === 'success' ? 'bg-emerald-500' :
                      riskSummary.tone === 'danger' ? 'bg-red-600' :
                      'bg-amber-500'
                    }`} 
                    style={{ width: riskSummary.confidence }} 
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
                    <p className="text-[15px] leading-8 text-slate-800">{riskSummary.description}</p>
                  )}
                </div>
              </div>
            </AppSectionCard>
          </div>

        </div>
        </section>
      </ScrollReveal>

      {selectedAlert ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="risk-alert-detail-title">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`inline-flex rounded-xl px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] ${selectedAlert.tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                  {selectedAlert.tone === 'danger' ? 'Risiko Tinggi' : 'Peringatan'} · {selectedAlert.status}
                </p>
                <h2 id="risk-alert-detail-title" className="mt-4 text-[24px] font-semibold text-slate-900">{selectedAlert.title}</h2>
                <p className="mt-2 text-[15px] leading-7 text-slate-700">{selectedAlert.description}</p>
              </div>
              <button type="button" onClick={() => setSelectedAlert(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Tutup detail alert">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 rounded-[20px] bg-slate-50 p-4 text-[14px] text-slate-800">
              {[
                ['ID Alert', selectedAlert.id],
                ['Aktor', `${selectedAlert.actorLabel}: ${selectedAlert.actorValue}`],
                ['Waktu terdeteksi', selectedAlert.time],
                ['Status penanganan', selectedAlert.status === 'active' ? 'Aktif / belum ditangani' : selectedAlert.status],
              ].map(([label, value]) => (
                <div key={label} className="grid gap-1 border-b border-slate-200/70 pb-3 last:border-0 last:pb-0 md:grid-cols-[160px_minmax(0,1fr)]">
                  <span className="font-semibold text-slate-500">{label}</span>
                  <span className="break-all font-mono text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[20px] border border-slate-200 p-4">
              <h3 className="text-[15px] font-semibold text-slate-900">Konteks analisis saat ini</h3>
              <p className="mt-2 text-[14px] leading-7 text-slate-700">{buildInternalRiskSummary()}</p>
              {analysis.patterns.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-[14px] leading-7 text-slate-700">
                  {analysis.patterns.map((pattern) => <li key={pattern}>{pattern}</li>)}
                </ul>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => router.push('/superadmin/audit-log')} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[14px] font-semibold text-slate-900 hover:bg-slate-200">
                Buka Audit Log
                <ExternalLink className="h-4 w-4" />
              </button>
              {selectedAlert.tone === 'danger' && selectedAlert.status === 'active' ? (
                <button type="button" onClick={() => {
                  setBlockedAlertId(selectedAlert.id)
                  setSelectedAlert(null)
                }} className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#0B1120] px-5 text-[14px] font-semibold text-white hover:bg-slate-800">
                  Blokir Akses
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

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
            try {
              await blockActor(blockedAlertId)
              showToast({ tone: 'success', title: 'Akses berhasil diblokir', description: 'Langkah mitigasi berhasil diterapkan pada alert terpilih.' })
            } catch (err) {
              console.error('[risk-activity] Block actor failed:', err)
              showToast({ tone: 'error', title: 'Gagal memblokir akses', description: err instanceof Error ? err.message : 'Terjadi kesalahan saat memblokir aktor.' })
            } finally {
              setIsProcessing(false)
            }
          }
          setBlockedAlertId(null)
        }}
      />
    </SuperadminShell>
  )
}
