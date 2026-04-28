import { AppShell } from '@/components/layout/AppShell'
import { ADMIN_MAIN_TABS } from '@/lib/admin-main-menu'

export default function AdminLoading() {
  return (
    <AppShell mainClassName="py-8" tabs={ADMIN_MAIN_TABS}>
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-24 animate-pulse rounded-lg border border-slate-100 bg-slate-100"
              key={index}
            />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
