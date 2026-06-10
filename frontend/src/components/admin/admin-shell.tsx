'use client'

import { CircleHelp, FileText, Gauge, LayoutGrid, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'
import { RoleGate } from '@/components/auth/role-gate'
import { ConsoleShell, type ConsoleNavItem } from '@/components/dashboard/console-shell'
import { adminShellContent } from '@/lib/admin-content'
import { OnboardingTour } from './onboarding-tour'

import { useLanguage } from '@/lib/contexts/language-context'

const sidebarIconMap: Record<'layout-grid' | 'gauge' | 'file-text' | 'circle-help', LucideIcon> = {
  'layout-grid': LayoutGrid,
  gauge: Gauge,
  'file-text': FileText,
  'circle-help': CircleHelp,
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { t, locale } = useLanguage()

  const sidebarItems: ConsoleNavItem[] = [
    { href: '/admin', label: t.sidebar.dashboard, icon: LayoutGrid },
    { href: '/admin/manajemen-pemilihan', label: t.sidebar.election, icon: Gauge },
    { href: '/admin/daftar-proposal', label: t.sidebar.proposal, icon: FileText },
    { href: '/admin/bantuan', label: t.sidebar.help, icon: CircleHelp },
  ]

  return (
    <RoleGate
      allowedRoles={['admin', 'super_admin']}
      fallbackTitle={locale === 'Bahasa Indonesia' ? 'Sesi Telah Berakhir' : 'Session Timeout'}
      fallbackDescription={locale === 'Bahasa Indonesia' 
        ? 'Sesi Anda telah berakhir atau akses tidak valid demi keamanan. Silakan masuk kembali untuk melanjutkan pengelolaan organisasi.'
        : 'Your session has ended or access is invalid for your protection. Please log in again to continue managing your organization.'}
      loginHref="/portal-admin"
    >
      <ConsoleShell
        role="admin"
        headerLabel={adminShellContent.headerLabel}
        brandTagline={adminShellContent.brandTagline}
        searchPlaceholder={t.header.search}
        sidebarItems={sidebarItems}
        profile={{
          ...adminShellContent.profile,
          editLabel: t.sidebar.profile,
          logoutLabel: t.header.logout,
          editHref: '/admin/profil',
        }}
        footer={adminShellContent.footer}
        logoutConfig={{
          title: t.header.logout + '?',
          description: locale === 'Bahasa Indonesia' 
            ? 'Anda akan keluar dari panel admin dan kembali ke halaman login.'
            : 'You will log out from the admin panel and return to the login page.',
          confirmLabel: t.header.logout,
          successTitle: locale === 'Bahasa Indonesia' ? 'Keluar berhasil' : 'Logout successful',
          successDescription: locale === 'Bahasa Indonesia' 
            ? 'Sesi admin telah diakhiri.'
            : 'Admin session has been terminated.',
          redirectTo: '/',
        }}
      >
        {children}
      </ConsoleShell>
      <OnboardingTour />
    </RoleGate>
  )
}

export function AdminModuleCard({ icon, title, description, dark = false, cta = 'Lihat Detail', href }: { icon: ReactNode; title: string; description: string; dark?: boolean; cta?: string; href?: string }) {
  const ctaContent = (
    <span className={dark ? 'inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-900' : 'inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-900'}>
      {cta}
    </span>
  )

  return (
    <article className={dark ? 'flex h-full flex-col rounded-[28px] bg-black p-6 text-white' : 'flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6'}>
      <div className={dark ? 'flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white' : 'flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900'}>
        {icon}
      </div>
      <h3 className={dark ? 'mt-8 text-[20px] font-semibold text-white' : 'mt-8 text-[20px] font-semibold text-slate-900'}>{title}</h3>
      <p className={dark ? 'mt-3 text-[15px] leading-8 text-slate-300' : 'mt-3 text-[15px] leading-8 text-slate-500'}>{description}</p>
      <div className="mt-auto pt-8">
        {href ? (
          <Link href={href} className="transition-opacity hover:opacity-80">
            {ctaContent}
          </Link>
        ) : ctaContent}
      </div>
    </article>
  )
}

export function AdminMetricCard({
  label = 'Total suara masuk',
  value = '12,842',
  change = '+12% dari target minimum',
  progressLabel = 'Kuorum Tercapai',
  progressValue = '82%',
  progressWidthClassName = 'w-[82%]',
}: {
  label?: string
  value?: string
  change?: string
  progressLabel?: string
  progressValue?: string
  progressWidthClassName?: string
}) {
  return (
    <article className="rounded-[28px] bg-[#161b33] p-7 text-white">
      <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p className="mt-5 text-[64px] font-semibold leading-none tracking-[-0.05em] text-white">{value}</p>
      <p className="mt-4 text-[15px] text-emerald-400">{change}</p>
      <div className="mt-10 border-t border-white/10 pt-6">
        <div className="flex items-center justify-between text-[14px] text-slate-300">
          <span>{progressLabel}</span>
          <span>{progressValue}</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/10">
          <div className={`h-2 rounded-full bg-white ${progressWidthClassName}`} />
        </div>
      </div>
    </article>
  )
}

export function AdminFilterPill({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active
        ? 'inline-flex h-10 items-center justify-center rounded-full bg-black px-6 text-[14px] font-medium text-white'
        : 'inline-flex h-10 items-center justify-center rounded-full bg-slate-100 px-6 text-[14px] font-medium text-slate-800 hover:bg-slate-200'}
    >
      {children}
    </button>
  )
}

export function AdminElectionCard({ children, dashed = false, onClick }: { children: ReactNode; dashed?: boolean; onClick?: () => void }) {
  return (
    <article className={dashed
      ? 'overflow-hidden h-auto min-h-[388px] rounded-[28px] border border-dashed border-slate-300 bg-white px-6 pb-8 pt-6 2xl:h-[388px]'
      : `overflow-hidden h-auto min-h-[388px] rounded-[28px] border bg-white px-6 pb-8 pt-6 2xl:h-[388px] ${onClick ? 'cursor-pointer border-slate-200 transition-all duration-150 hover:-translate-y-px hover:border-slate-300' : 'border-slate-200'}`} onClick={onClick}>
      {children}
    </article>
  )
}
