'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

interface HashBoxProps {
  children: string
}

export function HashBox({ children }: HashBoxProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative rounded-md border border-slate-100 bg-slate-50 p-3">
      <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-slate-400">
        {children}
      </pre>
      <button
        className="absolute right-2 top-2 flex items-center gap-1 text-[11px] text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-slate-600"
        onClick={handleCopy}
        type="button"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Tersalin!' : 'Salin'}
      </button>
    </div>
  )
}
