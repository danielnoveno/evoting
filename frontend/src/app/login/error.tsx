'use client'

interface LoginErrorProps {
  reset: () => void
}

export default function LoginError({ reset }: LoginErrorProps) {
  return (
    <main className="mx-auto max-w-[400px] px-6 pt-20">
      <p className="text-sm text-red-700">Gagal memuat halaman login.</p>
      <button className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-sm" onClick={reset} type="button">
        Coba Lagi
      </button>
    </main>
  )
}
