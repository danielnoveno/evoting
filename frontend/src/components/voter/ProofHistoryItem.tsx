import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'

interface ProofHistoryItemProps {
  electionName: string
  status: 'Menunggu Reveal' | 'Berhasil' | 'Gagal'
  txHash: string
  time: string
  basescanUrl: string
}

export function ProofHistoryItem({ electionName, status, txHash, time, basescanUrl }: ProofHistoryItemProps) {
  const badgeVariant = status === 'Berhasil' ? 'active' : status === 'Menunggu Reveal' ? 'commit' : 'danger'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{electionName}</p>
        <Badge variant={badgeVariant}>{status}</Badge>
      </div>

      <p className="mt-2 font-mono text-xs text-slate-500">{txHash}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">{time}</p>
        <a className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700" href={basescanUrl} rel="noreferrer" target="_blank">
          Lihat di Basescan <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
