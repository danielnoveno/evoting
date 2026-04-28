'use client'

import { MainContainer } from '@/components/layout/SiteContainer'

interface CreateSpaceErrorProps {
  reset: () => void
}

export default function CreateSpaceError({ reset }: CreateSpaceErrorProps) {
  return (
    <MainContainer className="py-8">
      <p className="text-sm text-red-700">Form pembuatan space gagal dimuat.</p>
      <button className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm" onClick={reset} type="button">
        Coba Lagi
      </button>
    </MainContainer>
  )
}
