'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { VoterShell } from '@/components/voter/voter-shell'

export default function PemilihError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <VoterShell>
      <section className="rounded-[32px] border border-red-200 bg-red-50 p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-red-700">Terjadi kendala</p>
        <h1 className="mt-4 text-[32px] font-semibold text-slate-900">Halaman pemilih gagal dimuat</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-8 text-slate-600">
          Muat ulang halaman untuk mencoba lagi. Jika masalah berlanjut, buka menu bantuan agar Anda tetap bisa melanjutkan proses voting dengan aman.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white hover:bg-slate-900">
            Coba Lagi
          </button>
          <Link href="/pemilih/bantuan" className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-50">
            Buka Bantuan
          </Link>
        </div>
      </section>
    </VoterShell>
  )
}
