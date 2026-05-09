'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react'
import { SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { superadminManajemenAdminContent } from '@/lib/dummy-superadmin-content'

export default function ManajemenAdminPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Suspended'>('Semua')

  const filteredAdmins = useMemo(() => {
    return superadminManajemenAdminContent.admins.filter((admin) => {
      const matchSearch = admin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          admin.wallet.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchStatus = statusFilter === 'Semua' || admin.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [searchQuery, statusFilter])

  const toggleStatusFilter = () => {
    if (statusFilter === 'Semua') setStatusFilter('Aktif')
    else if (statusFilter === 'Aktif') setStatusFilter('Suspended')
    else setStatusFilter('Semua')
  }

  return (
    <SuperadminShell>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">
            {superadminManajemenAdminContent.header.title}
          </h1>
          <p className="mt-2 text-[16px] text-slate-500">
            {superadminManajemenAdminContent.header.description}
          </p>
        </div>
        <Link
          href="/superadmin/manajemen-admin/tambah"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900"
        >
          <Plus className="h-5 w-5" />
          {superadminManajemenAdminContent.header.primaryCta}
        </Link>
      </div>

      <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex h-12 w-full max-w-[360px] items-center gap-3 rounded-2xl bg-slate-100 px-4">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari institusi atau wallet..."
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
                <th className="pb-4 pl-4 font-medium">Nama Institusi</th>
                <th className="pb-4 font-medium">Wallet Admin</th>
                <th className="pb-4 font-medium">Total Pemilihan</th>
                <th className="pb-4 font-medium">Tanggal Bergabung</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 pr-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada admin yang cocok dengan pencarian.</td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="group transition-colors hover:bg-slate-50">
                    <td className="py-5 pl-4">
                      <div className="font-semibold text-slate-900">{admin.name}</div>
                      <div className="text-[13px] text-slate-500">{admin.id}</div>
                    </td>
                    <td className="py-5">
                      <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-[13px]">
                        {admin.wallet}
                      </span>
                    </td>
                    <td className="py-5 text-slate-600">{admin.totalElections}</td>
                    <td className="py-5 text-slate-600">{admin.joinedAt}</td>
                    <td className="py-5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] ${
                        admin.status === 'Aktif' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="py-5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/superadmin/manajemen-admin/${admin.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-200"
                        >
                          Detail
                        </Link>
                        <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>
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
