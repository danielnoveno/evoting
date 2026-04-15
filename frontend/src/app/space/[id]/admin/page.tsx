interface AdminPageProps {
  params: { id: string }
}

export default function AdminSpacePage({ params }: AdminPageProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Dashboard Admin</h1>
      <p className="text-sm text-slate-400">Space ID: {params.id}</p>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">Placeholder whitelist + transisi fase (MVP Hari 11).</p>
      </div>
    </section>
  )
}
