'use client'

import { ArrowLeft, Database, FileCheck2, LayoutGrid, ShieldAlert, ShieldUser, Vote, ScrollText } from 'lucide-react'
import Link from 'next/link'
import { type InputHTMLAttributes, ReactNode, type SelectHTMLAttributes } from 'react'
import { RoleGate } from '@/components/auth/role-gate'
import { ConsoleShell, type ConsoleNavItem } from '@/components/dashboard/console-shell'
import { superadminShellContent } from '@/lib/superadmin-data'

const sidebarItems: ConsoleNavItem[] = [
  { href: '/superadmin', label: 'Beranda', icon: LayoutGrid },
  { href: '/superadmin/manajemen-admin', label: 'Manajemen Admin', icon: ShieldUser },
  { href: '/superadmin/manajemen-pemilihan', label: 'Manajemen Pemilihan', icon: Vote },
  { href: '/superadmin/manajemen-proposal', label: 'Manajemen Proposal', icon: FileCheck2 },
  { href: '/superadmin/audit-log', label: 'Audit Log', icon: ScrollText },
  { href: '/superadmin/pengaturan-platform', label: 'Data Master Voter', icon: Database },
  { href: '/superadmin/risk-activity', label: 'Risk Activity', icon: ShieldAlert },
]

export function SuperadminShell({ children }: { children: ReactNode }) {
  return (
    <RoleGate
      allowedRoles={['super_admin']}
      fallbackTitle="Akses super admin tidak tersedia"
      fallbackDescription="Halaman ini hanya dapat dibuka oleh super admin yang memiliki sesi backend aktif."
    >
      <ConsoleShell
        role="superadmin"
        headerLabel={superadminShellContent.headerLabel}
        searchPlaceholder={superadminShellContent.searchPlaceholder}
        sidebarItems={sidebarItems}
        profile={{
          ...superadminShellContent.profile,
          editHref: '/superadmin/profil',
        }}
        footer={superadminShellContent.footer}
        logoutConfig={{
          title: 'Keluar dari sesi superadmin?',
          description: 'Anda akan keluar dari panel superadmin dan kembali ke halaman masuk.',
          confirmLabel: 'Keluar Sesi',
          successTitle: 'Sesi superadmin ditutup',
          successDescription: 'Anda diarahkan kembali ke halaman login.',
          redirectTo: '/',
        }}
      >
        {children}
      </ConsoleShell>
    </RoleGate>
  )
}

export function SuperadminAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-[18px] font-semibold text-slate-700">
      {initials}
    </div>
  )
}

export function SuperadminStatusBadge({ status }: { status: string }) {
  const className = status === 'Aktif' || status === 'Sukses' || status === 'Disetujui'
    ? 'bg-emerald-50 text-emerald-600'
    : status === 'Menunggu' || status === 'Menunggu Review' || status === 'Warning' || status === 'Perlu Revisi'
      ? 'bg-amber-50 text-amber-600'
      : status === 'Ditangguhkan' || status === 'Halted' || status === 'Nonaktif'
        ? 'bg-red-50 text-red-600'
        : 'bg-slate-100 text-slate-800'

  return <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${className}`}>{status}</span>
}

export function SuperadminTabButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active
        ? 'border-b-2 border-black px-1 pb-3 text-[15px] font-semibold text-slate-900'
        : 'border-b-2 border-transparent px-1 pb-3 text-[15px] text-slate-500 hover:text-slate-900'}
    >
      {children}
    </button>
  )
}

export function SuperadminFilterChip({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active
        ? 'rounded-2xl bg-white px-5 py-3 text-[15px] font-semibold text-slate-900 shadow-sm'
        : 'rounded-2xl px-5 py-3 text-[15px] text-slate-800 hover:bg-white/70'}
    >
      {children}
    </button>
  )
}

export function SuperadminSectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[32px] bg-slate-100 p-6 md:p-7 ${className}`}>{children}</section>
}

export function SuperadminInteractiveCard({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      className={`cursor-pointer rounded-[28px] border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 ${className}`}
    >
      {children}
    </article>
  )
}

export function SuperadminBreadcrumbs({ items }: { items: Array<{ label: string }> }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? <span className="text-slate-300">/</span> : null}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function SuperadminEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <p className="text-[16px] font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-3 max-w-[520px] text-[15px] leading-7 text-slate-500">{description}</p>
    </div>
  )
}

export function SuperadminTableRowLink({
  href,
  children,
  className = '',
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`grid gap-4 border-b border-slate-100 px-6 py-5 transition-all duration-200 hover:bg-slate-50 hover:pl-7 focus:bg-slate-50 ${className}`}
    >
      {children}
    </Link>
  )
}

export function SuperadminSectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-2 text-[15px] leading-7 text-slate-800">{description}</p> : null}
    </div>
  )
}

export function SuperadminFieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-3 block text-[11px] uppercase tracking-[0.08em] text-slate-500">{children}</span>
}

export function SuperadminTextInput(
  props: InputHTMLAttributes<HTMLInputElement> & { className?: string }
) {
  const { className = '', ...rest } = props

  return (
    <input
      {...rest}
      className={`h-14 w-full rounded-[20px] border border-transparent bg-slate-200 px-4 text-[16px] text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${className}`}
    />
  )
}

export function SuperadminSelectInput(
  props: SelectHTMLAttributes<HTMLSelectElement> & { className?: string }
) {
  const { className = '', children, ...rest } = props

  return (
    <select
      {...rest}
      className={`h-14 w-full rounded-[20px] border border-transparent bg-slate-200 px-4 text-[16px] text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/10 ${className}`}
    >
      {children}
    </select>
  )
}

export function SuperadminRadioCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-4 rounded-[24px] border px-5 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
        active ? 'border-slate-900 bg-white' : 'border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white'
      }`}
      aria-pressed={active}
    >
      <span className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${active ? 'border-slate-900' : 'border-slate-300'}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-slate-900' : 'bg-transparent'}`} />
      </span>
      <span>
        <span className="block text-[16px] font-medium text-slate-900">{title}</span>
        <span className="mt-1 block text-[14px] leading-6 text-slate-500">{description}</span>
      </span>
    </button>
  )
}

export function SuperadminBackButton({ href, label = 'Kembali' }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[15px] text-slate-700 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  )
}

export function SuperadminPageHeader({
  backHref,
  backLabel,
  title,
  description,
  actions,
}: {
  backHref?: string
  backLabel?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
      <div className="max-w-[760px]">
        {backHref ? <SuperadminBackButton href={backHref} label={backLabel} /> : null}
        <h1 className={`${backHref ? 'mt-4 ' : ''}text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[44px]`}>{title}</h1>
        {description ? <p className="mt-3 text-[16px] leading-8 text-slate-800">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
    </section>
  )
}

export function SuperadminDetailIntro({
  backHref,
  backLabel,
  chips,
  title,
  meta,
  description,
  actions,
}: {
  backHref: string
  backLabel: string
  chips?: ReactNode
  title: string
  meta?: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
      <div className="max-w-[900px]">
        <SuperadminBackButton href={backHref} label={backLabel} />
        {chips ? <div className="mt-6 flex flex-wrap items-center gap-3">{chips}</div> : null}
        <h1 className="mt-6 text-[40px] font-semibold tracking-[-0.04em] text-slate-900 md:text-[54px]">{title}</h1>
        {meta ? <div className="mt-5 flex flex-wrap items-center gap-4 text-[15px] text-slate-800">{meta}</div> : null}
        {description ? <div className="mt-5 max-w-[760px] text-[16px] leading-8 text-slate-800">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">{actions}</div> : null}
    </section>
  )
}

export function SuperadminToolbarButton({ children, variant = 'secondary', onClick }: { children: ReactNode; variant?: 'primary' | 'secondary'; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={variant === 'primary'
        ? 'inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-6 text-[15px] font-medium text-white hover:bg-slate-800'
        : 'inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-200'}
    >
      {children}
    </button>
  )
}
