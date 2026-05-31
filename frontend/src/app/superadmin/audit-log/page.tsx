'use client'

import { ArrowUpDown, Copy, Download, ExternalLink, FileText, Filter, RefreshCcw, Search, Settings2, Vote } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ModalShell } from '@/components/ui/modal-shell'
import { useToast } from '@/components/ui/toast-provider'
import { SuperadminShell, SuperadminToolbarButton } from '@/components/superadmin/superadmin-shell'
import { superadminAuditLogData, type SuperadminAuditLogItem } from '@/lib/superadmin-data'
import { useSuperadminAuditLogsStore } from '@/lib/superadmin-store'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

function AuditIcon({ icon }: { icon: SuperadminAuditLogItem['icon'] }) {
  if (icon === 'vote') return <Vote className="h-4 w-4" />
  if (icon === 'validator') return <Settings2 className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

function AuditStatusBadge({ tone, status }: { tone: SuperadminAuditLogItem['statusTone']; status: string }) {
  return (
    <span className={tone === 'verified'
      ? 'inline-flex rounded-full bg-emerald-50 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-emerald-600'
      : 'inline-flex rounded-full bg-blue-50 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-blue-600'}>
      {status}
    </span>
  )
}

export default function SuperadminAuditLogPage() {
  const { showToast } = useToast()
  const { logs, setLogs } = useSuperadminAuditLogsStore()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'semua' | 'verified' | 'syncing' | 'proposal' | 'vote' | 'validator'>('semua')
  const [sortOrder, setSortOrder] = useState<'terbaru' | 'terlama'>('terbaru')
  const [visibleCount, setVisibleCount] = useState(4)
  const [selectedLog, setSelectedLog] = useState<SuperadminAuditLogItem | null>(null)

  const basescanTxUrl = (hash: string) => `https://sepolia.basescan.org/tx/${hash}`

  const copyText = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    showToast({ tone: 'success', title: `${label} disalin`, description: 'Nilai berhasil disimpan ke clipboard.' })
  }

  const downloadLogProof = (log: SuperadminAuditLogItem) => {
    const payload = {
      id: log.id,
      block: log.block,
      event: log.eventLabel,
      title: log.title,
      timestamp: log.timestamp,
      txHash: log.txHash,
      status: log.status,
      integrity: log.statusTone,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${log.id}-proof.json`
    anchor.click()
    window.URL.revokeObjectURL(url)

    showToast({ tone: 'success', title: 'Bukti log diunduh', description: `File ${log.id}-proof.json berhasil dibuat.` })
  }

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    let result = logs

    if (activeFilter === 'verified') result = result.filter((log) => log.statusTone === 'verified')
    if (activeFilter === 'syncing') result = result.filter((log) => log.statusTone === 'syncing')
    if (activeFilter === 'proposal' || activeFilter === 'vote' || activeFilter === 'validator') result = result.filter((log) => log.icon === activeFilter)

    const sorted = [...result].sort((left, right) => sortOrder === 'terbaru'
      ? right.timestamp.localeCompare(left.timestamp)
      : left.timestamp.localeCompare(right.timestamp))

    if (!normalizedQuery) return sorted

    return sorted.filter((log) =>
      log.txHash.toLowerCase().includes(normalizedQuery)
      || log.title.toLowerCase().includes(normalizedQuery)
      || log.eventLabel.toLowerCase().includes(normalizedQuery)
      || log.block.toLowerCase().includes(normalizedQuery),
    )
  }, [activeFilter, logs, query, sortOrder])

  const visibleLogs = filteredLogs.slice(0, visibleCount)

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <section className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="w-full max-w-[720px]">
          <label className="inline-flex h-12 w-full max-w-[340px] items-center gap-3 rounded-[6px] border border-slate-400 bg-slate-100 px-4">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari TX Hash atau event..."
              className="w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-500"
            />
          </label>

          <h1 className="mt-12 text-[54px] font-semibold tracking-[-0.05em] text-slate-900">{superadminAuditLogData.title}</h1>
          <p className="mt-4 max-w-[760px] text-[18px] leading-9 text-slate-800">{superadminAuditLogData.description}</p>
        </div>

        <div className="mt-2 flex gap-4 xl:mt-20">
          <SuperadminToolbarButton onClick={() => showToast({ tone: 'success', title: 'Laporan audit disiapkan', description: 'File laporan audit sedang disiapkan.' })}>
            <Download className="h-4 w-4" />
            Unduh Laporan
          </SuperadminToolbarButton>
          <button type="button" onClick={() => {
            setLogs((current) => [{
              id: `log-live-${Date.now()}`,
              block: '#12050',
              eventLabel: 'Validator Config',
              title: 'Sinkronisasi validator baru pada klaster pusat',
              timestamp: '2023-10-27 14:33:19 UTC',
              txHash: '0xab2...77fe',
              status: 'Syncing (1/3)',
              statusTone: 'syncing',
              icon: 'validator',
            }, ...current])
            showToast({ tone: 'success', title: 'Sinkronisasi ulang dipicu', description: 'Event audit terbaru berhasil ditambahkan ke daftar.' })
          }} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-[15px] font-medium text-slate-700 hover:bg-slate-200">
            <RefreshCcw className="h-4 w-4" />
            Sinkronisasi Ulang
          </button>
        </div>
      </section>
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-10">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
          <div className="h-1.5 w-full bg-emerald-500" />
          <div className="p-8">
            <div className="flex items-center gap-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-800">{superadminAuditLogData.summary.integrityLabel}</p>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {superadminAuditLogData.summary.integrityStatus}
              </span>
            </div>
            <p className="mt-10 text-[60px] font-semibold leading-none tracking-[-0.05em] text-slate-900">{superadminAuditLogData.summary.integrityValue}</p>
            <p className="mt-3 text-[18px] text-slate-800">{superadminAuditLogData.summary.integrityNote}</p>

            <div className="mt-10">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Latest Proof ID</p>
              <div className="mt-4 rounded-[4px] bg-slate-100 px-4 py-4 font-mono text-[15px] text-slate-700">{superadminAuditLogData.summary.latestProofId}</div>
            </div>

            <div className="mt-8">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Terakhir Diperbarui</p>
              <p className="mt-3 text-[18px] font-medium text-slate-900">{superadminAuditLogData.summary.lastUpdated}</p>
            </div>
          </div>
        </section>
      </StaggerContainer>

      <ScrollReveal variant="fade-up" delay={200} duration={800}>
        <section className="mt-10 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <p className="flex items-center gap-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-black" />
            Live System Events
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {[
              ['semua', 'Semua'],
              ['verified', 'Verified'],
              ['syncing', 'Syncing'],
              ['proposal', 'Proposal'],
              ['vote', 'Vote'],
              ['validator', 'Validator'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveFilter(key as typeof activeFilter)
                  setVisibleCount(4)
                }}
                className={activeFilter === key
                  ? 'rounded-full bg-slate-900 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white'
                  : 'rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 hover:bg-slate-200'}
              >
                {label}
              </button>
            ))}
            <button type="button" onClick={() => showToast({ tone: 'info', title: 'Filter event aktif', description: `Filter saat ini: ${activeFilter}.` })} className="ml-1 text-slate-500 hover:text-slate-900">
              <Filter className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSortOrder((current) => current === 'terbaru' ? 'terlama' : 'terbaru')}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500 hover:bg-slate-200"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortOrder}
            </button>
          </div>
        </div>

          <div>
            {visibleLogs.map((log) => (
            <article key={log.id} className="grid gap-5 border-b border-slate-100 px-6 py-6 transition-all duration-200 hover:bg-slate-50 hover:pl-7 lg:grid-cols-[220px_minmax(0,1fr)_300px_220px] lg:items-center lg:px-8 lg:hover:px-[2.25rem]">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-800">
                  <AuditIcon icon={log.icon} />
                </div>
                <div>
                  <p className="font-mono text-[13px] uppercase tracking-[0.08em] text-slate-500">Block {log.block}</p>
                  <p className="mt-2 font-mono text-[15px] text-slate-900">{log.eventLabel}</p>
                </div>
              </div>

              <div>
                <button type="button" onClick={() => setSelectedLog(log)} className="text-left">
                  <p className="text-[18px] font-medium leading-8 text-slate-900 hover:text-slate-700">{log.title}</p>
                </button>
                <p className="mt-2 font-mono text-[13px] text-slate-500">Timestamp: {log.timestamp}</p>
              </div>

              <div className="flex items-center gap-3 lg:justify-end">
                <div className="rounded-[4px] border-l-4 border-black bg-slate-100 px-4 py-3 font-mono text-[14px] text-slate-800">
                  <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">TX:</p>
                  <p className="mt-1">{log.txHash}</p>
                </div>
                <button type="button" onClick={() => copyText(log.txHash, 'Transaction hash')} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Salin transaction hash">
                  <Copy className="h-4 w-4" />
                </button>
                <a href={basescanTxUrl(log.txHash)} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Buka di Basescan">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button type="button" onClick={() => downloadLogProof(log)} className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-[14px] font-medium text-slate-700 hover:bg-slate-200">
                  <Download className="mr-2 h-4 w-4" />
                  JSON
                </button>
              </div>

              <div className="lg:justify-self-end">
                <AuditStatusBadge tone={log.statusTone} status={log.status} />
              </div>
            </article>
          ))}
        </div>

        <div className="px-8 py-6 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => Math.min(current + 2, filteredLogs.length))}
            disabled={visibleCount >= filteredLogs.length}
            className="text-[15px] font-semibold uppercase tracking-[0.08em] text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Muat Lebih Banyak Log
          </button>
        </div>
        </section>
      </ScrollReveal>

      <ModalShell
        open={selectedLog !== null}
        title={selectedLog?.title ?? 'Detail Audit Event'}
        description="Detail event audit ini ditampilkan untuk membantu peninjauan aktivitas superadmin."
        onClose={() => setSelectedLog(null)}
      >
        {selectedLog ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] bg-slate-100 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Block</p>
                <p className="mt-2 font-mono text-[16px] text-slate-900">{selectedLog.block}</p>
              </div>
              <div className="rounded-[20px] bg-slate-100 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Event</p>
                <p className="mt-2 font-mono text-[16px] text-slate-900">{selectedLog.eventLabel}</p>
              </div>
              <div className="rounded-[20px] bg-slate-100 px-4 py-4 sm:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Transaction Hash</p>
                <p className="mt-2 font-mono text-[15px] break-all text-slate-900">{selectedLog.txHash}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => copyText(selectedLog.txHash, 'Transaction hash')} className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-[14px] font-medium text-slate-700 hover:bg-slate-50">
                    <Copy className="mr-2 h-4 w-4" />
                    Salin Hash
                  </button>
                  <a href={basescanTxUrl(selectedLog.txHash)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-[14px] font-medium text-slate-700 hover:bg-slate-50">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Lihat di Basescan
                  </a>
                </div>
              </div>
              <div className="rounded-[20px] bg-slate-100 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Timestamp</p>
                <p className="mt-2 font-mono text-[15px] text-slate-900">{selectedLog.timestamp}</p>
              </div>
              <div className="rounded-[20px] bg-slate-100 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Status</p>
                <div className="mt-2">
                  <AuditStatusBadge tone={selectedLog.statusTone} status={selectedLog.status} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSelectedLog(null)} className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-700 hover:bg-slate-200">
                Tutup
              </button>
              <button type="button" onClick={() => downloadLogProof(selectedLog)} className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#0B1120] px-5 text-[14px] font-medium text-white hover:bg-slate-800">
                Unduh Bukti JSON
              </button>
            </div>
          </div>
        ) : null}
      </ModalShell>
    </SuperadminShell>
  )
}
