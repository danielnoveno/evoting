'use client'

import { ArrowLeft, Database, FileCheck2, LayoutGrid, ShieldAlert, ShieldUser, Vote, ScrollText } from 'lucide-react'
import Link from 'next/link'
import { type InputHTMLAttributes, ReactNode, type SelectHTMLAttributes } from 'react'
import { RoleGate } from '@/components/auth/role-gate'
import { ConsoleShell, type ConsoleNavItem } from '@/components/dashboard/console-shell'
import { superadminShellContent } from '@/lib/superadmin-data'
import { usePlatformSettings } from '@/hooks/use-platform-settings'
import { useLanguage } from '@/lib/contexts/language-context'
import { RequiredAsterisk } from '@/components/ui/required-asterisk'

export function SuperadminShell({ children }: { children: ReactNode }) {
  const { data: settings } = usePlatformSettings()
  const { t, locale } = useLanguage()

  const sidebarItems: ConsoleNavItem[] = [
    { href: '/superadmin', label: t.sidebar.dashboard, icon: LayoutGrid },
    { href: '/superadmin/manajemen-superadmin', label: t.sidebar.superadmin, icon: ShieldAlert },
    { href: '/superadmin/manajemen-admin', label: t.sidebar.admin, icon: ShieldUser },
    { href: '/superadmin/manajemen-pemilihan', label: t.sidebar.election, icon: Vote },
    { href: '/superadmin/manajemen-proposal', label: t.sidebar.proposal, icon: FileCheck2 },
    { href: '/superadmin/audit-log', label: t.sidebar.audit, icon: ScrollText },
    { href: '/superadmin/data-voter', label: t.sidebar.voter, icon: Database },
    { href: '/superadmin/risk-activity', label: t.sidebar.risk, icon: ShieldAlert },
  ]

  return (
    <RoleGate
      allowedRoles={['super_admin']}
      fallbackTitle={locale === 'Bahasa Indonesia' ? 'Sesi Telah Berakhir' : 'Session Timeout'}
      fallbackDescription={locale === 'Bahasa Indonesia' 
        ? 'Sesi Anda telah berakhir atau akses tidak valid demi keamanan. Silakan masuk kembali untuk melanjutkan pengelolaan platform.'
        : 'Your session has ended or access is invalid for your protection. Please log in again to continue managing the platform.'}
      loginHref="/portal-admin"
    >
      <ConsoleShell
        role="superadmin"
        headerLabel={settings?.platform_name || superadminShellContent.headerLabel}
        searchPlaceholder={t.header.search}
        sidebarItems={sidebarItems}
        profile={{
          ...superadminShellContent.profile,
          editLabel: t.sidebar.profile,
          logoutLabel: t.header.logout,
          editHref: '/superadmin/profil',
        }}
        footer={superadminShellContent.footer}
        logoutConfig={{
          title: t.header.logout + '?',
          description: locale === 'Bahasa Indonesia'
            ? 'Anda akan keluar dari panel superadmin dan kembali ke halaman masuk.'
            : 'You will log out from the superadmin panel and return to the login page.',
          confirmLabel: t.header.logout,
          successTitle: locale === 'Bahasa Indonesia' ? 'Sesi superadmin ditutup' : 'Superadmin session closed',
          successDescription: locale === 'Bahasa Indonesia'
            ? 'Anda diarahkan kembali ke halaman login.'
            : 'You are being redirected back to the login page.',
          redirectTo: '/portal-admin',
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

export function SuperadminFieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-3 block text-[11px] uppercase tracking-[0.08em] text-slate-500">
      {children}
      {required && <RequiredAsterisk />}
    </span>
  )
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

export function SuperadminToolbarButton({ children, variant = 'secondary', onClick, disabled = false }: { children: ReactNode; variant?: 'primary' | 'secondary'; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={variant === 'primary'
        ? 'inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-6 text-[15px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
        : 'inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50'}
    >
      {children}
    </button>
  )
}
