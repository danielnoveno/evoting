'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, Activity, Users, Box } from 'lucide-react'
import { SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { superadminManajemenPemilihanContent } from '@/lib/dummy-superadmin-content'

export default function ManajemenPemilihanPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Draft' | 'Ended'>('Semua')

  const filteredElections = useMemo(() => {
    return superadminManajemenPemilihanContent.elections.filter((election) => {
      const matchSearch = election.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          election.instansi.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchStatus = statusFilter === 'Semua' || election.status.includes(statusFilter)

      return matchSearch && matchStatus
    })
  }, [searchQuery, statusFilter])

  const toggleStatusFilter = () => {
    if (statusFilter === 'Semua') setStatusFilter('Aktif')
    else if (statusFilter === 'Aktif') setStatusFilter('Draft')
    else if (statusFilter === 'Draft') setStatusFilter('Ended')
    else setStatusFilter('Semua')
  }

  return (
    <SuperadminShell>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">
            {superadminManajemenPemilihanContent.header.title}
          </h1>
          <p className="mt-2 text-[16px] text-slate-500">
            {superadminManajemenPemilihanContent.header.description}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex h-12 w-full max-w-[360px] items-center gap-3 rounded-2xl bg-slate-100 px-4">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pemilihan atau instansi..."
              className="flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <button 
            onClick={toggleStatusFilter}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-6 text-[15px] font-medium transition-colors ${
              statusFilter !== 'Semua' ? 'border-black bg-black text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-5 w-5" />
            {statusFilter === 'Semua' ? 'Filter Status' : `Status: ${statusFilter}`}
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredElections.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[15px] text-slate-500">
              Tidak ada pemilihan yang cocok dengan pencarian.
            </div>
          ) : (
            filteredElections.map((election) => (
            <article key={election.id} className="rounded-[24px] border border-slate-200 bg-white p-6 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                  election.status.includes('Aktif') ? 'bg-emerald-50 text-emerald-700' :
                  election.status.includes('Draft') ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {election.status}
                </span>
              </div>
              <h3 className="mt-4 text-[18px] font-semibold leading-tight text-slate-900">{election.title}</h3>
              <p className="mt-1 text-[14px] text-slate-500">{election.instansi}</p>
              
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.06em] text-slate-400 flex items-center gap-1">
                    <Users className="h-3 w-3" /> Pemilih
                  </p>
                  <p className="mt-1 text-[18px] font-semibold text-slate-900">{election.voters}</p>
                </div>
                <div>
                  <p className="text-[12px] uppercase tracking-[0.06em] text-slate-400 flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Transaksi
                  </p>
                  <p className="mt-1 text-[18px] font-semibold text-slate-900">{election.txCount}</p>
                </div>
              </div>

              <div className="mt-6">
                <button className="w-full inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 text-[13px] font-semibold text-slate-700 hover:bg-slate-200">
                  <Box className="mr-2 h-4 w-4" /> Lihat Contract
                </button>
              </div>
            </article>
          )))}
        </div>
      </div>
    </SuperadminShell>
  )
}
