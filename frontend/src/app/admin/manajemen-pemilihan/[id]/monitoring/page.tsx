'use client'

import { CalendarDays, Download, Eye, FileText, Search, Share2, ShieldCheck, Users, CircleGauge, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminElectionById } from '@/lib/admin-election-dummy-data'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { ScrollReveal } from '@/components/public/parallax'

function actionToneClass(tone: 'blue' | 'amber' | 'slate' | 'purple') {
  if (tone === 'blue') return 'bg-blue-50 text-blue-600'
  if (tone === 'amber') return 'bg-amber-50 text-amber-600'
  if (tone === 'purple') return 'bg-purple-50 text-purple-600'
  return 'bg-slate-100 text-slate-800'
}

function statusToneClass(status: 'selesai' | 'berlangsung' | 'menunggu') {
  if (status === 'selesai') return 'bg-emerald-50 text-emerald-700'
  if (status === 'berlangsung') return 'bg-blue-50 text-blue-600'
  return 'bg-amber-50 text-amber-700'
}

const dateRangeOptions = [
  { key: 'semua', label: 'Semua Rentang' },
  { key: 'hari-ini', label: 'Hari Ini' },
  { key: '7-hari', label: '7 Hari Terakhir' },
  { key: '30-hari', label: '30 Hari Terakhir' },
] as const

export default function AdminElectionMonitoringPage({ params }: { params: { id: string } }) {
  const election = getAdminElectionById(params.id)

  if (!election) notFound()

  const monitoring = election.detail.monitoring
  const { showToast } = useToast()

  const [selectedRange, setSelectedRange] = useState<(typeof dateRangeOptions)[number]['key']>('semua')
  const [selectedCategory, setSelectedCategory] = useState(monitoring.selectedCategory)
  const [actorKeyword, setActorKeyword] = useState('')

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportType, setExportType] = useState<'csv' | 'pdf'>('csv')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredRows = useMemo(() => {
    const keyword = actorKeyword.trim().toLowerCase()

    return monitoring.logRows.filter((row) => {
      const matchesRange = selectedRange === 'semua' ? true : row.rangeKey === selectedRange
      const matchesCategory = selectedCategory === monitoring.categories[0] ? true : row.category === selectedCategory
      const matchesActor = !keyword
        ? true
        : row.actorName.toLowerCase().includes(keyword) || row.actorWallet.toLowerCase().includes(keyword)

      return matchesRange && matchesCategory && matchesActor
    })
  }, [actorKeyword, monitoring.categories, monitoring.logRows, selectedCategory, selectedRange])

  useMemo(() => {
    setCurrentPage(1)
  }, [selectedRange, selectedCategory, actorKeyword])

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
      <section className="flex flex-col gap-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400 md:flex-row md:items-center">
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
