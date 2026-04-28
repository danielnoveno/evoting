import { AppShell } from '@/components/layout/AppShell'

export default function SpaceAdminLoading() {
  return (
    <AppShell mainClassName="py-8" spaceName="Memuat...">
      <div className="space-y-4">
        <div className="h-6 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-24 animate-pulse rounded-lg border border-slate-100 bg-slate-100"
              key={index}
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl border border-slate-100 bg-white" />
          <div className="h-80 animate-pulse rounded-xl border border-slate-100 bg-white" />
        </div>
      </div>
    </AppShell>
  )
}
