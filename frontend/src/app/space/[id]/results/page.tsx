interface ResultsPageProps {
  params: { id: string }
}

export default function ResultsPage({ params }: ResultsPageProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Hasil Voting</h1>
      <p className="text-sm text-slate-400">Space ID: {params.id}</p>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">
          Placeholder hasil publik. Semua bukti on-chain wajib punya link Basescan.
        </p>
      </div>
    </section>
  )
}
