'use client'

import { MainContainer } from '@/components/layout/SiteContainer'

interface CaraKerjaErrorProps {
  reset: () => void
}

export default function CaraKerjaError({ reset }: CaraKerjaErrorProps) {
  return (
    <MainContainer className="py-8">
      <p className="text-sm text-red-700">Halaman cara kerja gagal dimuat.</p>
      <button className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm" onClick={reset} type="button">
        Coba Lagi
      </button>
    </MainContainer>
  )
}
