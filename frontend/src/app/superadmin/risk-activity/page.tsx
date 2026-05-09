'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, AlertTriangle, ShieldAlert } from 'lucide-react'
import { SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { superadminRiskActivityContent } from '@/lib/dummy-superadmin-content'

export default function RiskActivityPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'Semua' | 'Critical' | 'High' | 'Medium'>('Semua')

  const filteredLogs = useMemo(() => {
    return superadminRiskActivityContent.logs.filter((log) => {
      const matchSearch = log.event.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchSeverity = severityFilter === 'Semua' || log.severity === severityFilter

      return matchSearch && matchSeverity
    })
  }, [searchQuery, severityFilter])

  const toggleSeverityFilter = () => {
    if (severityFilter === 'Semua') setSeverityFilter('Critical')
    else if (severityFilter === 'Critical') setSeverityFilter('High')
    else if (severityFilter === 'High') setSeverityFilter('Medium')
    else setSeverityFilter('Semua')
  }

  return (
    <SuperadminShell>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">
              {superadminRiskActivityContent.header.title}
            </h1>
            <p className="mt-2 text-[16px] text-slate-500">
              {superadminRiskActivityContent.header.description}
            </p>
          </div>
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
              placeholder="Cari log atau wallet..."
              className="flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <button 
            onClick={toggleSeverityFilter}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-6 text-[15px] font-medium transition-colors ${
              severityFilter !== 'Semua' ? 'border-black bg-black text-white' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-5 w-5" />
            {severityFilter === 'Semua' ? 'Filter Severity' : `Severity: ${severityFilter}`}
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="border-b border-slate-100 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                <th className="pb-4 pl-4 font-medium">Event / Waktu</th>
                <th className="pb-4 font-medium">Aktor</th>
                <th className="pb-4 font-medium">Deskripsi</th>
                <th className="pb-4 font-medium">Severity</th>
                <th className="pb-4 pr-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Tidak ada log aktivitas yang cocok dengan pencarian.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group transition-colors hover:bg-slate-50">
                    <td className="py-5 pl-4 align-top w-[220px]">
                      <div className="font-semibold text-slate-900">{log.event}</div>
                      <div className="text-[13px] text-slate-500 mt-1">{log.timestamp}</div>
                    </td>
                    <td className="py-5 align-top">
                      <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-[13px] inline-block">
                        {log.actor}
                      </span>
                    </td>
                    <td className="py-5 align-top max-w-[300px]">
                      <p className="text-[14px] text-slate-700 leading-relaxed">{log.description}</p>
                    </td>
                    <td className="py-5 align-top">
                      <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${
                        log.severity === 'Critical' ? 'text-red-600 bg-red-50 px-2.5 py-1 rounded-md' :
                        log.severity === 'High' ? 'text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md' :
                        'text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md'
                      }`}>
                        <AlertTriangle className="h-3 w-3" />
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-5 pr-4 text-right align-top">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] ${
                        log.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' :
                        log.status === 'Mitigated' ? 'bg-blue-50 text-blue-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {log.status}
                      </span>
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
