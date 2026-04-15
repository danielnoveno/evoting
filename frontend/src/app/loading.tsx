export default function GlobalLoading() {
  return (
    <section className="space-y-3">
      <div className="h-6 w-48 animate-pulse rounded bg-slate-100" />
      <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
      <div className="h-32 w-full animate-pulse rounded-xl border border-slate-100 bg-slate-50" />
    </section>
  )
}
