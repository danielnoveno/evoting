'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Search, Filter, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { superadminManajemenProposalContent } from '@/lib/dummy-superadmin-content'

export default function ManajemenProposalPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Pending Review' | 'Approved' | 'Rejected'>('Semua')

  const filteredProposals = useMemo(() => {
    return superadminManajemenProposalContent.proposals.filter((proposal) => {
      const matchSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          proposal.instansi.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchStatus = statusFilter === 'Semua' || proposal.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [searchQuery, statusFilter])

  const toggleStatusFilter = () => {
    if (statusFilter === 'Semua') setStatusFilter('Pending Review')
    else if (statusFilter === 'Pending Review') setStatusFilter('Approved')
    else if (statusFilter === 'Approved') setStatusFilter('Rejected')
    else setStatusFilter('Semua')
  }

  return (
    <SuperadminShell>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">
            {superadminManajemenProposalContent.header.title}
          </h1>
          <p className="mt-2 text-[16px] text-slate-500">
            {superadminManajemenProposalContent.header.description}
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
              placeholder="Cari proposal..."
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

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-slate-100 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                <th className="pb-4 pl-4 font-medium">Judul Proposal</th>
                <th className="pb-4 font-medium">Institusi Pengaju</th>
                <th className="pb-4 font-medium">Tanggal Pengajuan</th>
                <th className="pb-4 font-medium">Urgensi</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 pr-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada proposal yang cocok dengan pencarian.</td>
                </tr>
              ) : (
                filteredProposals.map((proposal) => (
                  <tr key={proposal.id} className="group transition-colors hover:bg-slate-50">
                    <td className="py-5 pl-4">
                      <div className="font-semibold text-slate-900">{proposal.title}</div>
                      <div className="text-[13px] text-slate-500">{proposal.id}</div>
                    </td>
                    <td className="py-5 text-slate-600">{proposal.instansi}</td>
                    <td className="py-5 text-slate-600">{proposal.submittedAt}</td>
                    <td className="py-5">
                      <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${
                        proposal.urgency === 'Tinggi' ? 'text-red-600' :
                        proposal.urgency === 'Normal' ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        {proposal.urgency === 'Tinggi' && <AlertCircle className="h-4 w-4" />}
                        {proposal.urgency === 'Normal' && <Clock className="h-4 w-4" />}
                        {proposal.urgency === 'Rendah' && <CheckCircle className="h-4 w-4" />}
                        {proposal.urgency}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] ${
                        proposal.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                        proposal.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {proposal.status}
                      </span>
                    </td>
                    <td className="py-5 pr-4 text-right">
                      <Link
                        href={`/superadmin/manajemen-proposal/${proposal.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-black px-4 text-[13px] font-medium text-white hover:bg-slate-900"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SuperadminShell>
  )
}
