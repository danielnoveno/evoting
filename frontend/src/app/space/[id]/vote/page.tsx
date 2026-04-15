interface VotePageProps {
  params: { id: string }
}

export default function VotePage({ params }: VotePageProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Pilih Kandidatmu</h1>
      <p className="text-sm text-slate-400">Space ID: {params.id} · Fase Commit</p>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">
          Placeholder voting commit. Urutan wajib nanti: generateSalt - saveVoteData - send tx.
        </p>
      </div>
    </section>
  )
}
