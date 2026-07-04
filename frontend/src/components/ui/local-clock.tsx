'use client'

import { Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'

function formatClock(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date)
}

export function LocalClock({ className = '' }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className={`hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 md:flex ${className}`} aria-label="Waktu lokal perangkat">
      <Clock3 className="h-3.5 w-3.5 text-slate-400" />
      <span className="hidden text-slate-400 lg:inline">Waktu lokal</span>
      <span className="font-mono text-slate-800">{now ? formatClock(now) : '--:--:--'}</span>
    </div>
  )
}
