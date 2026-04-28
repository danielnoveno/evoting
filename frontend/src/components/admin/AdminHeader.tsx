import { ExternalLink } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { basescan } from '@/lib/basescan'
import { AdminPhase, getPhaseBadgeVariant, getPhaseLabel } from '@/lib/admin-demo-data'

interface AdminHeaderProps {
  contractAddress: `0x${string}`
  phase: AdminPhase
  spaceName: string
}

export function AdminHeader({ contractAddress, phase, spaceName }: AdminHeaderProps) {
  return (
    <section className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-slate-400">
          {spaceName} · Base Sepolia
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={getPhaseBadgeVariant(phase)}>Fase {getPhaseLabel(phase)}</Badge>
        <a href={basescan.address(contractAddress)} rel="noreferrer" target="_blank">
          <Button size="sm" variant="ghost">
            Lihat di Basescan
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      </div>
    </section>
  )
}
