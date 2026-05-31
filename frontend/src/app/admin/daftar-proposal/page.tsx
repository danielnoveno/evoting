'use client'

import { useMemo, useState } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { OnboardingTour } from '@/components/admin/onboarding-tour'
import { adminProposalContent, ProposalStatus } from '@/lib/admin-proposal-data'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { BarChart2, CheckCircle2, ChevronLeft, ChevronRight, Eye, Hourglass, PlusCircle, Rocket, ShieldCheck, FileKey, Pencil } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminProposalList } from '@/hooks/use-admin-proposal-list'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'

function getStatusBadgeClass(status: ProposalStatus) {
  switch (status) {
    case 'DISETUJUI':
      return 'bg-emerald-100 text-emerald-700'
    case 'MENUNGGU REVIEW':
      return 'bg-amber-100 text-amber-700'
    case 'DRAF':
      return 'bg-slate-200 text-slate-800'
    case 'DITOLAK':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

function getIconComponent(iconKey: string) {
  switch (iconKey) {
    case 'bar-chart':
      return <BarChart2 className="h-5 w-5" />
    case 'hourglass':
      return <Hourglass className="h-5 w-5" />
    case 'rocket':
      return <Rocket className="h-5 w-5" />
    case 'check-circle':
      return <CheckCircle2 className="h-5 w-5" />
    default:
      return <BarChart2 className="h-5 w-5" />
  }
}

function getStatCardColor(iconKey: string) {
  switch (iconKey) {
    case 'hourglass':
      return 'bg-amber-50 text-amber-600'
    case 'rocket':
      return 'bg-blue-50 text-blue-600'
    case 'check-circle':
      return 'bg-emerald-50 text-emerald-600'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default function AdminProposalPage() {
  const { header, banner } = adminProposalContent
  const { showToast } = useToast()
  const router = useRouter()
  const { rows: proposals, stats, error, isLoading } = useAdminProposalList()

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4
  const actualTotalItems = proposals.length

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return proposals.slice(start, end)
  }, [proposals, currentPage])

  const totalPages = Math.max(1, Math.ceil(actualTotalItems / itemsPerPage))

  const handleActionClick = (actionName: string) => {
    showToast({
      title: `Fitur ${actionName} belum tersedia`,
      description: 'Fitur ini sedang disiapkan untuk peninjauan proposal.',
      tone: 'info',
    })
  }

  return (
    <AdminShell>
      <OnboardingTour />
      {/* Header Section */}
      <ScrollReveal id="tour-admin-proposal-header" variant="fade-up" duration={700}>
        <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-[760px]">
            <h1 className="text-[32px] font-semibold tracking-[-0.04em] text-slate-900 md:text-[40px]">{header.title}</h1>
            <p className="mt-4 text-[16px] leading-8 text-slate-800">{header.description}</p>
          </div>
          <div>
            <Link
              href="/admin/daftar-proposal/tambah"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-6 text-[15px] font-medium text-white shadow-lg hover:bg-slate-800 transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              {header.primaryCta}
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* Stats Section */}
      {error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">
          {getRepositoryErrorMessage(error, 'Gagal memuat daftar proposal. Coba lagi.')}
        </div>
      ) : null}

      <StaggerContainer id="tour-admin-proposal-stats" stagger={100} variant="fade-up" duration={600} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <article key={idx} className="rounded-[24px] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] border border-slate-100 flex flex-col justify-between h-[140px]">
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getStatCardColor(stat.iconKey)}`}>
                {getIconComponent(stat.iconKey)}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{stat.label}</p>
            </div>
            <p className="text-[36px] font-bold tracking-[-0.04em] text-slate-900 leading-none">{stat.value}</p>
          </article>
        ))}
      </StaggerContainer>

      {/* Table Section */}
      <ScrollReveal id="tour-admin-proposal-table" variant="fade-up" delay={150} duration={800}>
        <section className="mt-10 rounded-[28px] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)] border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-50">
            <h2 className="text-[18px] font-semibold text-slate-900">Daftar Pengajuan Terbaru</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-50 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 bg-slate-50/50">
                  <th className="px-6 py-5 w-[30%]">Nama Pemilihan</th>
                  <th className="px-6 py-5">Tanggal Pengajuan</th>
                  <th className="px-6 py-5">Estimasi Pemilih</th>
                  <th className="px-6 py-5">Blockchain Hash</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={`loading-${index}`} className="border-b border-slate-50">
                      <td className="px-6 py-5" colSpan={6}>
                        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : null}
                {paginatedRows.map((row) => (
                  <tr 
                    key={row.id} 
                    onClick={() => router.push(`/admin/daftar-proposal/${row.id}`)}
                    className="border-b border-slate-50 text-[14px] text-slate-700 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900 text-[15px]">{row.title}</p>
                      <p className="mt-1 text-[12px] text-slate-400">Kategori: {row.category}</p>
                    </td>
                    <td className="px-6 py-5 font-medium">{row.date}</td>
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">{row.votersEstimate}</p>
                      <p className="mt-1 text-[12px] text-slate-400">Peserta</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-mono ${row.hash === 'Belum di-hash' ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-800'}`}>
                        {row.hash}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${getStatusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <Link 
                          href={`/admin/daftar-proposal/${row.id}/edit`} 
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Link 
                          href={`/admin/daftar-proposal/${row.id}`} 
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && paginatedRows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-center text-[14px] leading-7 text-slate-500" colSpan={6}>
                      Belum ada proposal dari Supabase. Buat proposal baru atau jalankan query seed yang disiapkan.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 bg-slate-50/50 gap-4">
            <p className="text-[13px] text-slate-500 font-medium">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, actualTotalItems)} - {Math.min(currentPage * itemsPerPage, actualTotalItems)} dari {actualTotalItems} proposal
              <span className="text-slate-400 font-normal ml-1">(kapasitas tampilan: 128)</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 text-[13px] font-bold text-slate-900">{currentPage}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Verification Banner */}
      <ScrollReveal variant="zoom-in" delay={250} duration={800}>
        <section className="mt-10 mb-8 overflow-hidden rounded-[32px] bg-[#f4f6f8] grid lg:grid-cols-2 relative">
          <div className="p-10 lg:p-14 z-10">
            <h2 className="text-[24px] font-bold text-slate-900">{banner.title}</h2>
            <p className="mt-4 text-[16px] leading-8 text-slate-800 max-w-[480px]">
              {banner.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>{banner.tags[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileKey className="h-4 w-4" />
                <span>{banner.tags[1]}</span>
              </div>
            </div>
          </div>
          
          {/* Right Graphic Area */}
          <div className="hidden lg:flex items-center justify-center relative bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
            {/* Abstract nodes background pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-400 via-transparent to-transparent bg-[length:20px_20px]" />
            <div className="absolute top-10 right-10 text-[10px] font-mono font-bold tracking-[0.3em] text-white/50 uppercase">
              SAFE ICRN SAFE WIR WK
            </div>
            
            {/* Floating sync card */}
            <div className="relative z-10 w-[280px] rounded-2xl bg-white/90 backdrop-blur-md p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-900">{banner.nodeSync.status}</span>
              </div>
              <pre className="text-[11px] leading-[1.8] text-slate-800 font-mono">
                {banner.nodeSync.info}
              </pre>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </AdminShell>
  )
}
