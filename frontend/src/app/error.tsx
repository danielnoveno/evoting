'use client'

interface GlobalErrorProps {
  error: Error
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <main className="mx-auto max-w-[640px] px-6 py-16">
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-700">Terjadi kendala</h1>
        <p className="mt-2 text-sm text-red-700">
          {error.message || 'Halaman gagal dimuat. Coba lagi.'}
        </p>
        <button
          onClick={reset}
          className="mt-4 h-9 rounded-md bg-[#0F172A] px-4 text-sm font-medium text-white"
          type="button"
        >
          Muat Ulang
        </button>
      </div>
    </main>
  )
}
