'use client'

import { MainContainer } from '@/components/layout/SiteContainer'

interface SpaceErrorProps {
  reset: () => void
}

export default function SpaceError({ reset }: SpaceErrorProps) {
  return (
    <MainContainer className="py-8">
      <p className="text-sm text-red-700">Halaman space gagal dimuat.</p>
      <button className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm" onClick={reset} type="button">
        Coba Lagi
      </button>
    </MainContainer>
  )
}
