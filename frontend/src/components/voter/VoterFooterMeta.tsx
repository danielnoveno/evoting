import Link from 'next/link'

import { cn } from '@/lib/utils'

interface VoterFooterMetaProps {
  className?: string
}

export function VoterFooterMeta({ className }: VoterFooterMetaProps) {
  return (
    <footer className={cn('flex flex-wrap items-center justify-between gap-4 pt-8', className)}>
      <p className="font-label text-[10px] uppercase tracking-[0.12em] text-slate-500">
        © 2023 E-VOTING INDONESIA • KEAMANAN TINGKAT TINGGI
      </p>

      <div className="flex items-center gap-6">
        <Link className="font-label text-[10px] uppercase tracking-[0.12em] text-slate-500 hover:text-slate-700" href="#">
          Kebijakan Privasi
        </Link>
        <Link className="font-label text-[10px] uppercase tracking-[0.12em] text-slate-500 hover:text-slate-700" href="#">
          Ketentuan Layanan
        </Link>
      </div>
    </footer>
  )
}
