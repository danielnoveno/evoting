'use client'

import { MainContainer } from '@/components/layout/SiteContainer'

interface DetailPemilihanErrorProps {
  reset: () => void
}

export default function DetailPemilihanError({ reset }: DetailPemilihanErrorProps) {
  return (
    <MainContainer className="py-8">
      <p className="text-sm text-red-700">Detail pemilihan gagal dimuat.</p>
      <button className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm" onClick={reset} type="button">
        Coba Lagi
      </button>
    </MainContainer>
  )
}
