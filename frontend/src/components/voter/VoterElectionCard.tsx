import Link from 'next/link'
import { ArrowRight, Clock3, Hash, Lock, Vote } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type ElectionPhase = 'commit' | 'reveal' | 'upcoming'

interface VoterElectionCardProps {
  title: string
  description: string
  phase: ElectionPhase
  meta: string
  proof: string
  href: string
  ctaLabel: string
}

export function VoterElectionCard({ title, description, phase, meta, proof, href, ctaLabel }: VoterElectionCardProps) {
  const phaseBadge = phase === 'commit' ? 'commit' : phase === 'reveal' ? 'reveal' : 'ended'

  return (
    <Card className="flex h-full flex-col p-6" variant="hover">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          {phase === 'commit' ? <Vote className="h-4 w-4" /> : phase === 'reveal' ? <Lock className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
        </div>
        <Badge variant={phaseBadge}>{phase === 'commit' ? 'Fase Commit' : phase === 'reveal' ? 'Fase Reveal' : 'Menunggu'}</Badge>
      </div>

      <h3 className="mt-4 text-lg font-semibold leading-tight text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{meta}</span>
          <span className="inline-flex items-center gap-1 font-mono text-slate-600">
            <Hash className="h-3 w-3" /> {proof}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <Link href={href}>
          <Button fullWidth variant={phase === 'upcoming' ? 'secondary' : 'primary'}>
            {ctaLabel} {phase === 'upcoming' ? null : <ArrowRight className="h-4 w-4" />}
          </Button>
        </Link>
      </div>
    </Card>
  )
}
