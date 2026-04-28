import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

interface SpaceCardProps {
  id: string
  name: string
  status: 'active' | 'commit' | 'reveal' | 'ended'
}

export function SpaceCard({ id, name, status }: SpaceCardProps) {
  return (
    <Link href={`/space/${id}/vote`}>
      <Card variant="hover" className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="h-11 w-11 rounded-xl bg-slate-100" />
          <Badge variant={status}>{status === 'ended' ? 'Selesai' : 'Sedang berjalan'}</Badge>
        </div>
        <h3 className="text-[15px] font-semibold text-slate-900">{name}</h3>
        <p className="text-xs text-slate-400">HIMAFORKA · FTI UAJY</p>
      </Card>
    </Link>
  )
}
