import { ExternalLink } from 'lucide-react'

import { AdminAuditLog } from '@/lib/admin-demo-data'
import { basescan } from '@/lib/basescan'
import { truncateAddress } from '@/lib/utils'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, SectionLabel } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

interface AdminAuditLogTableProps {
  logs: AdminAuditLog[]
}

export function AdminAuditLogTable({ logs }: AdminAuditLogTableProps) {
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SectionLabel className="mb-0">LOG AKTIVITAS</SectionLabel>
        <Button size="sm" variant="secondary">
          Unduh Rekap
        </Button>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          subtitle="Belum ada aktivitas pada space ini. Log akan muncul setelah ada transaksi."
          title="Log aktivitas masih kosong"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="min-w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Waktu
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Event
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Aktor
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Tx Hash
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Block
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr className="border-b border-slate-100 text-xs text-slate-900 last:border-b-0" key={log.id}>
                  <td className="px-3 py-2.5 text-slate-600">{log.timeLabel}</td>
                  <td className="px-3 py-2.5">{log.eventLabel}</td>
                  <td className="px-3 py-2.5 text-slate-600">{log.actorLabel}</td>
                  <td className="px-3 py-2.5">
                    <a
                      className="inline-flex items-center gap-1 font-mono text-blue-700 underline"
                      href={basescan.tx(log.txHash)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {truncateAddress(log.txHash)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{log.blockLabel}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={log.status === 'confirmed' ? 'active' : 'commit'}>
                      {log.status === 'confirmed' ? 'Terkonfirmasi' : 'Menunggu'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
