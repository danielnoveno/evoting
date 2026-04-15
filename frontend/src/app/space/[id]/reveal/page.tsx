interface RevealPageProps {
  params: { id: string }
}

export default function RevealPage({ params }: RevealPageProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Konfirmasi Suara</h1>
      <p className="text-sm text-slate-400">Space ID: {params.id} · Fase Reveal</p>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">
          Placeholder reveal. Salt dibaca dari localStorage dan hanya dihapus setelah sukses.
        </p>
      </div>
    </section>
  )
}
