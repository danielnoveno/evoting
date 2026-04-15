'use client'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="id">
      <body className="mx-auto max-w-[720px] bg-slate-50 p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-base font-semibold text-red-700">Terjadi kendala pada halaman</h2>
          <p className="mt-2 text-sm text-red-700">{error.message || 'Silakan muat ulang halaman.'}</p>
        </div>
      </body>
    </html>
  )
}
