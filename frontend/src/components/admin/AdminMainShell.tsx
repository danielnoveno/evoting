import { ReactNode } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { ADMIN_MAIN_TABS } from '@/lib/admin-main-menu'

interface AdminMainShellProps {
  title: string
  subtitle: string
  children: ReactNode
  rightAction?: ReactNode
}

export function AdminMainShell({ title, subtitle, children, rightAction }: AdminMainShellProps) {
  return (
    <AppShell mainClassName="py-8" tabs={ADMIN_MAIN_TABS}>
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        {rightAction ? <div>{rightAction}</div> : null}
      </section>
      <section className="mt-6">{children}</section>
    </AppShell>
  )
}
