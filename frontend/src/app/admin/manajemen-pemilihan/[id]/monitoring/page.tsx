'use client'

import { CalendarDays, Download, Eye, FileText, Search, Share2, ShieldCheck, Users, CircleGauge, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminElectionById } from '@/lib/admin-election-dummy-data'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { ScrollReveal } from '@/components/public/parallax'
import { useAuditLogs } from '@/hooks/use-audit-logs'

function actionToneClass(action: string) {
  if (action === 'commit_vote') return 'bg-blue-50 text-blue-600'
  if (action === 'reveal_vote') return 'bg-purple-50 text-purple-600'
  return 'bg-slate-100 text-slate-800'
}

function mapActionLabel(action: string) {
  if (action === 'commit_vote') return 'Kirim Komitmen Suara'
  if (action === 'reveal_vote') return 'Konfirmasi Suara'
  return action
}

const dateRangeOptions = [
  { key: 'semua', label: 'Semua Rentang' },
  { key: 'hari-ini', label: 'Hari Ini' },
  { key: '7-hari', label: '7 Hari Terakhir' },
  { key: '30-hari', label: '30 Hari Terakhir' },
] as const

export default function AdminElectionMonitoringPage({ params }: { params: { id: string } }) {
  const election = getAdminElectionById(params.id)
  const { showToast } = useToast()
  const auditLogsQuery = useAuditLogs(params.id)

  if (!election) notFound()

  const [selectedRange, setSelectedRange] = useState<(typeof dateRangeOptions)[number]['key']>('semua')
  const [actorKeyword, setActorKeyword] = useState('')

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'pdf'>('csv')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const allLogs = useMemo(() => {
    if (!auditLogsQuery.data) return []
    return auditLogsQuery.data
  }, [auditLogsQuery.data])

  const filteredRows = useMemo(() => {
    const keyword = actorKeyword.trim().toLowerCase()

    return allLogs.filter((row) => {
      // Basic time filtering
      if (selectedRange === 'hari-ini') {
        const today = new Date().toDateString()
        if (new Date(row.createdAt).toDateString() !== today) return false
      }

      const matchesActor = !keyword
        ? true
        : row.walletAddress.toLowerCase().includes(keyword)

      return matchesActor
    })
  }, [allLogs, actorKeyword, selectedRange])

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredRows.slice(start, end)
  }, [filteredRows, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage))

  const handleOpenExport = (type: 'csv' | 'pdf') => {
    setExportType(type)
    setExportModalOpen(true)
  }

  const handleConfirmExport = () => {
    setExportModalOpen(false)
    showToast({
      title: 'Proses Ekspor Dimulai',
      description: `Dokumen ${exportType.toUpperCase()} sedang dipersiapkan dan akan segera diunduh.`,
      tone: 'success',
    })
  }

  return (
    <AdminShell>
      <ConfirmDialog
        open={exportModalOpen}
        title={`Ekspor ke ${exportType.toUpperCase()}`}
        description={`Apakah Anda yakin ingin mengekspor ${filteredRows.length} log audit ke format ${exportType.toUpperCase()}?`}
        confirmLabel="Ya, Ekspor"
        onConfirm={handleConfirmExport}
        onCancel={() => setExportModalOpen(false)}
      />

      <ScrollReveal variant="fade-up" duration={700}>
      <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/manajemen-pemilihan/${params.id}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 md:text-[40px]">Monitoring Real-Time</h1>
          </div>
          <p className="mt-2 text-[15px] leading-7 text-slate-500">
            Pantau aktivitas on-chain pemilih dan integritas suara secara langsung.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <button 
            type="button" 
            onClick={() => auditLogsQuery.refetch()}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
           >
            <RefreshCw className={`h-4 w-4 ${auditLogsQuery.isRefetching ? 'animate-spin' : ''}`} />
            Refresh Data
           </button>
           <button onClick={() => handleOpenExport('pdf')} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-700 hover:bg-slate-50">
            <FileText className="h-4 w-4" />
            Ekspor PDF
          </button>
          <button onClick={() => handleOpenExport('csv')} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-black px-5 text-[14px] font-semibold text-white hover:bg-slate-900">
            <Download className="h-4 w-4" />
            Ekspor CSV
          </button>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Partisipasi', value: `${filteredRows.length} Suara`, icon: Users, tone: 'blue' },
          { label: 'Blok Terakhir', value: auditLogsQuery.data?.[0]?.blockNumber || '-', icon: ShieldCheck, tone: 'emerald' },
          { label: 'Kecepatan Rata-rata', value: '2.4 tx/menit', icon: CircleGauge, tone: 'purple' },
          { label: 'Integritas Node', value: '100% Valid', icon: ShieldCheck, tone: 'emerald' },
        ].map((stat, index) => (
          <article key={index} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${stat.tone}-50 text-${stat.tone}-600`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-[24px] font-bold text-slate-900">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 px-8 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari wallet pemilih..."
                className="w-[200px] bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400 focus:w-[260px] transition-all"
                value={actorKeyword}
                onChange={(e) => setActorKeyword(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               {dateRangeOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSelectedRange(opt.key)}
                    className={`rounded-xl px-4 py-2 text-[13px] font-medium transition-colors ${selectedRange === opt.key ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {opt.label}
                  </button>
               ))}
            </div>
          </div>
          <p className="text-[13px] text-slate-500">Menampilkan {filteredRows.length} entitas audit</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-white text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                <th className="px-8 py-5">Waktu</th>
                <th className="px-8 py-5">Aksi On-Chain</th>
                <th className="px-8 py-5">Pemilih (Wallet)</th>
                <th className="px-8 py-5">Nomor Blok</th>
                <th className="px-8 py-5 text-right">Bukti Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {auditLogsQuery.isLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6"><div className="h-10 rounded-xl bg-slate-100" /></td>
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-500">Belum ada aktivitas on-chain yang tercatat.</td>
                </tr>
              ) : paginatedRows.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-[14px] font-semibold text-slate-900">{new Date(row.createdAt).toLocaleTimeString('id-ID')}</p>
                    <p className="mt-1 text-[12px] text-slate-500">{new Date(row.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${actionToneClass(row.actionType)}`}>
                      {mapActionLabel(row.actionType)}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white" />
                      <div>
                        <p className="text-[14px] font-mono font-medium text-slate-900">{row.walletAddress.slice(0, 6)}...{row.walletAddress.slice(-4)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[14px] font-medium text-slate-700">#{row.blockNumber}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <a
                      href={`https://sepolia.basescan.org/tx/${row.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-black hover:text-white transition-all"
                    >
                      <Share2 className="h-4 w-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-8 py-6">
          <p className="text-[13px] text-slate-500">Halaman {currentPage} dari {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>
      </ScrollReveal>
    </AdminShell>
  )
}
"flex flex-col gap-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400 md:flex-row md:items-center">
        <Link href="/admin/manajemen-pemilihan" className="hover:text-slate-800">Manajemen Pemilihan</Link>
        <span>›</span>
        <Link href={`/admin/manajemen-pemilihan/${election.id}`} className="hover:text-slate-800">{election.title}</Link>
        <span>›</span>
        <span className="text-slate-900">Monitoring</span>
      </section>

      <section className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-[760px]">
          <h1 className="text-[44px] font-semibold tracking-[-0.04em] text-slate-900 md:text-[56px]">{monitoring.title}</h1>
          <p className="mt-5 text-[18px] leading-9 text-slate-800">{monitoring.description}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => handleOpenExport('csv')} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-700 hover:bg-slate-200">
            <FileText className="h-4 w-4" />
            Ekspor CSV
          </button>
          <button type="button" onClick={() => handleOpenExport('pdf')} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-[14px] font-medium text-white hover:bg-slate-900">
            <Download className="h-4 w-4" />
            Ekspor PDF
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-4">
        <article className="rounded-[28px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Status Pemilihan</p>
          <p className="mt-4 text-[18px] font-semibold text-slate-900">Fase Aktif:</p>
          <p className="mt-1 text-[24px] font-semibold text-slate-900">{monitoring.currentPhase}</p>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Waktu Tersisa</p>
          <p className="mt-3 text-[20px] font-semibold text-slate-900">{monitoring.timeRemaining} <span className="text-[16px] font-normal text-slate-500">sisa</span></p>
        </article>

        <article className="rounded-[28px] bg-slate-100 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total Whitelist</p>
              <p className="mt-4 text-[48px] font-semibold tracking-[-0.04em] text-slate-900">{monitoring.totalWhitelist}</p>
              <p className="mt-1 text-[14px] text-slate-500">Pemilih terdaftar</p>
            </div>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
        </article>

        <article className="rounded-[28px] border-l-4 border-l-black bg-slate-100 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Commits Masuk</p>
              <p className="mt-4 text-[48px] font-semibold tracking-[-0.04em] text-slate-900">{monitoring.totalCommits}</p>
            </div>
            <CircleGauge className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-5 flex items-center gap-4">
            <div className="h-2 flex-1 rounded-full bg-white">
              <div className="h-2 w-[71%] rounded-full bg-black" />
            </div>
            <span className="text-[15px] font-semibold text-slate-700">{monitoring.commitProgress}</span>
          </div>
        </article>

        <article className="rounded-[28px] bg-slate-100 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total Reveals</p>
              <p className="mt-4 text-[48px] font-semibold tracking-[-0.04em] text-slate-900">{monitoring.totalReveals}</p>
              <p className="mt-1 text-[14px] text-slate-500">Menunggu fase reveal</p>
            </div>
            <Eye className="h-5 w-5 text-slate-400" />
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_1.2fr_1.2fr_0.9fr]">
        <article className="rounded-[28px] bg-slate-100 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Rentang Tanggal</p>
          <div className="mt-4 inline-flex h-11 w-full items-center gap-3 rounded-2xl bg-white px-4 text-slate-700">
            <CalendarDays className="h-4 w-4" />
            <select value={selectedRange} onChange={(event) => setSelectedRange(event.target.value as (typeof dateRangeOptions)[number]['key'])} className="w-full bg-transparent text-[14px] outline-none">
              {dateRangeOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </div>
        </article>

        <article className="rounded-[28px] bg-slate-100 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Kategori Aksi</p>
          <div className="mt-4 inline-flex h-11 w-full items-center justify-between rounded-2xl bg-white px-4 text-slate-700">
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="w-full bg-transparent text-[14px] outline-none">
              {monitoring.categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </article>

        <article className="rounded-[28px] bg-slate-100 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Aktor (Wallet)</p>
          <div className="mt-4 inline-flex h-11 w-full items-center gap-3 rounded-2xl bg-white px-4 text-slate-400">
            <Search className="h-4 w-4" />
            <input value={actorKeyword} onChange={(event) => setActorKeyword(event.target.value)} placeholder={monitoring.actorSearchPlaceholder} className="w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400" />
          </div>
        </article>

        <article className="rounded-[28px] bg-slate-100 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total Log</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-[42px] font-semibold tracking-[-0.04em] text-slate-900">{filteredRows.length}</p>
            <div className="flex items-end gap-1">
              <span className="h-6 w-1 rounded-full bg-slate-300" />
              <span className="h-10 w-1 rounded-full bg-emerald-500" />
              <span className="h-8 w-1 rounded-full bg-red-400" />
            </div>
          </div>
        </article>
      </section>

      <section className="mt-8 overflow-hidden rounded-[30px] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                <th className="px-6 py-5">Waktu</th>
                <th className="px-6 py-5">Aktor</th>
                <th className="px-6 py-5">Aksi</th>
                <th className="px-6 py-5">Objek</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Hash</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={`${row.time}-${row.hash}`} className="border-b border-slate-100 text-[15px] text-slate-700">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-900">{row.time}</p>
                    <p className="mt-1 text-[12px] text-slate-400">{row.timeMeta}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-900">{row.actorName}</p>
                    <p className="mt-1 text-[12px] text-slate-400">{row.actorWallet}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-semibold ${actionToneClass(row.actionTone)}`}>{row.action}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-900">{row.objectTitle}</p>
                    <p className="mt-1 text-[12px] text-slate-400">{row.objectMeta}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${statusToneClass(row.status)}`}>{row.status}</span>
                  </td>
                  <td className="px-6 py-5 font-mono text-[13px] text-blue-600">
                    <a href={`https://sepolia.basescan.org/tx/${row.hash}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {row.hash} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRows.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
            <p className="text-[13px] text-slate-500">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRows.length)} - {Math.min(currentPage * itemsPerPage, filteredRows.length)} dari {filteredRows.length} log
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-[13px] font-medium text-slate-700">Hal {currentPage} dari {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        <div className="grid gap-6 border-t border-slate-100 px-6 py-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Parameter Fungsi</p>
            <div className="mt-4 overflow-hidden rounded-[28px] bg-[#161b33] p-6">
              <pre className="overflow-x-auto text-[13px] leading-7 text-slate-300">{monitoring.functionPayload}</pre>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Metadata Audit</p>
            <div className="mt-4 space-y-5 rounded-[28px] bg-slate-100 p-6 text-[14px] text-slate-800">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Browser Agent</p>
                <p className="mt-2">{monitoring.metadata.browserAgent}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">IP Address</p>
                <p className="mt-2">{monitoring.metadata.ipAddress}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Security Level</p>
                <p className="mt-2 text-blue-600">{monitoring.metadata.security}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[30px] border-l-4 border-l-black bg-slate-100 p-6">
        <h2 className="text-[20px] font-semibold text-slate-900">{monitoring.guarantee.title}</h2>
        <p className="mt-4 max-w-[1100px] text-[15px] leading-8 text-slate-800">{monitoring.guarantee.description}</p>
      </section>
      </ScrollReveal>
    </AdminShell>
  )
}
