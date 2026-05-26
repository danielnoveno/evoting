'use client'

import { ArrowLeft, CheckCircle2, Download, FileText, Link2, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ScrollReveal } from '@/components/public/parallax'
import { useWhitelistImportJobDetail } from '@/hooks/use-whitelist-import-job-detail'
import { useWhitelistImportJobEntries } from '@/hooks/use-whitelist-import-job-entries'
import { useWhitelistImportSignedUrl } from '@/hooks/use-whitelist-import-file'
import { useToast } from '@/components/ui/toast-provider'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { AdminElectionRecord } from '@/lib/admin-election-data'

function StatusBadge({ status }: { status: string }) {
  const isOk = status === 'valid'
  return (
    <span className={isOk
      ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700'
      : 'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700'}>
      {isOk ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {status}
    </span>
  )
}

export function AdminImportJobDetailView({
  jobId,
  election,
}: {
  jobId: string
  election: AdminElectionRecord
}) {
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const jobQuery = useWhitelistImportJobDetail(jobId)
  const entriesQuery = useWhitelistImportJobEntries(jobId)
  const signedUrlMutation = useWhitelistImportSignedUrl()

  const handleOpenImportFile = () => {
    if (!jobQuery.data?.filePath) return
    signedUrlMutation.mutate(jobQuery.data.filePath, {
      onSuccess: (signedUrl) => {
        window.open(signedUrl, '_blank', 'noopener,noreferrer')
      },
      onError: (error) => {
        showToast({
          tone: 'error',
          title: 'Gagal membuka file impor',
          description: getRepositoryErrorMessage(error, 'Tautan file impor belum tersedia.'),
        })
      },
    })
  }

  const isLoading = jobQuery.isLoading || entriesQuery.isLoading
  const job = jobQuery.data
  const entries = entriesQuery.data ?? []

  const filteredEntries = entries.filter((record) => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true
    return record.walletAddress.toLowerCase().includes(keyword) || (record.voterName && record.voterName.toLowerCase().includes(keyword))
  })

  return (
    <AdminShell>
      <ScrollReveal variant="fade-up" duration={700}>
        <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-[760px]">
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/manajemen-pemilihan/${election.id}?tab=whitelist`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                aria-label="Kembali ke detail pemilihan"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-slate-900 md:text-[42px]">
                Detail Tugas Impor
              </h1>
            </div>
            <p className="mt-4 text-[16px] leading-8 text-slate-600">
              Lihat metrik validasi dan daftar alamat wallet dari file CSV yang pernah diproses pada tugas impor ini.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleOpenImportFile}
              disabled={signedUrlMutation.isPending || !job}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Unduh CSV Asli
            </button>
          </div>
        </section>

        {jobQuery.error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            {getRepositoryErrorMessage(jobQuery.error, 'Gagal memuat tugas impor.')}
          </div>
        ) : null}

        {job ? (
          <>
            <section className="mt-8 grid gap-6 md:grid-cols-3">
              <article className="rounded-[28px] border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">File Impor</p>
                  <StatusBadge status={job.status} />
                </div>
                <div className="mt-5 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="break-all text-[18px] font-semibold text-slate-900">{job.fileName}</h3>
                    <p className="mt-1 text-[13px] text-slate-500">
                      {new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(job.createdAt))}
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Wallet Valid</p>
                <div className="mt-5">
                  <p className="text-[48px] font-semibold leading-none tracking-[-0.05em] text-slate-900">{job.rowCount}</p>
                  <p className="mt-3 text-[14px] text-emerald-600">Baris berhasil diekstrak dan masuk ke whitelist draft</p>
                </div>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Baris Diabaikan</p>
                <div className="mt-5">
                  <p className="text-[48px] font-semibold leading-none tracking-[-0.05em] text-slate-500">{job.invalidCount}</p>
                  <p className="mt-3 text-[14px] text-slate-500">Baris dengan format tidak valid atau alamat duplikat</p>
                </div>
              </article>
            </section>

            <section className="mt-8 rounded-[30px] border border-slate-200 bg-white">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 md:flex-row md:items-center md:justify-between">
                <h2 className="text-[20px] font-semibold text-slate-900">Hasil Ekstraksi Wallet</h2>
                <div className="inline-flex h-11 items-center gap-3 rounded-2xl bg-slate-100 px-4 text-slate-400 md:w-[260px]">
                  <Link2 className="h-4 w-4" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari alamat atau nama..."
                    className="w-full bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      <th className="px-6 py-4">No</th>
                      <th className="px-6 py-4">Alamat Wallet</th>
                      <th className="px-6 py-4">Nama (Opsional)</th>
                      <th className="px-6 py-4">Status Sinkronisasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entriesQuery.isLoading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <tr key={`job-entry-loading-${index}`} className="border-b border-slate-100">
                          <td className="px-6 py-5" colSpan={4}>
                            <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
                          </td>
                        </tr>
                      ))
                    ) : null}
                    
                    {!entriesQuery.isLoading && filteredEntries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[14px] text-slate-500">
                          Tidak ada wallet yang sesuai dengan pencarian atau job ini tidak menghasilkan wallet valid.
                        </td>
                      </tr>
                    ) : null}

                    {filteredEntries.map((record, idx) => (
                      <tr key={record.id} className="border-b border-slate-100 text-[15px] text-slate-700">
                        <td className="px-6 py-5 text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-5 font-mono">{record.walletAddress}</td>
                        <td className="px-6 py-5">{record.voterName || '-'}</td>
                        <td className="px-6 py-5">
                          {record.syncStatus === 'synced' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Tersinkronisasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                              <FileText className="h-3.5 w-3.5" /> Draft Lokal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-5 text-[14px] text-slate-500">
                <p>Menampilkan {filteredEntries.length} data pemilih</p>
              </div>
            </section>
          </>
        ) : isLoading ? (
          <div className="mt-8 h-[400px] animate-pulse rounded-[30px] bg-slate-100" />
        ) : null}
      </ScrollReveal>
    </AdminShell>
  )
}
