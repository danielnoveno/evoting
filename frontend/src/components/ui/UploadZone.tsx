'use client'

import { Upload } from 'lucide-react'

interface UploadZoneProps {
  onClick?: () => void
}

export function UploadZone({ onClick }: UploadZoneProps) {
  return (
    <button
      className="w-full rounded-lg border-[1.5px] border-dashed border-slate-200 p-6 text-center transition-colors hover:border-slate-300 hover:bg-slate-50"
      onClick={onClick}
      type="button"
    >
      <Upload className="mx-auto mb-2.5 h-5 w-5 text-slate-300" />
      <p className="text-[13px] font-semibold text-slate-900">Upload file CSV</p>
      <p className="mt-1 text-xs text-slate-400">Format: satu alamat wallet per baris</p>
    </button>
  )
}
