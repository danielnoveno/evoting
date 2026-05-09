'use client'

import { Bell, CircleHelp, FileText, Gauge, LayoutGrid, ListChecks, LogOut, Menu, Search, UserCircle2, UserRoundCheck, Users, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { adminShellContent } from '@/lib/dummy-admin-content'

const sidebarIconMap = {
  'layout-grid': LayoutGrid,
  gauge: Gauge,
  'file-text': FileText,
  'circle-help': CircleHelp,
} as const

export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()

  const sidebarWidthClass = useMemo(() => (collapsed ? 'lg:ml-[96px]' : 'lg:ml-[264px]'), [collapsed])
  const sidebarDesktopWidthClass = collapsed ? 'lg:w-[96px]' : 'lg:w-[264px]'

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false)
    showToast({
      tone: 'success',
      title: 'Keluar berhasil',
      description: 'Sesi admin telah diakhiri dan Anda diarahkan ke halaman login.',
    })
    window.setTimeout(() => {
      router.push('/hubungkan-dompet')
    }, 500)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Tutup sidebar"
            className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside className={`fixed inset-y-0 left-0 z-50 w-[264px] shrink-0 border-r border-slate-100 bg-slate-100/95 transition-transform duration-200 lg:z-40 lg:flex lg:translate-x-0 ${sidebarDesktopWidthClass} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex h-full w-full flex-col overflow-y-auto">
            <div className={`flex items-start justify-between px-5 pb-4 pt-6 ${collapsed ? 'lg:px-4' : ''}`}>
              <button
                type="button"
                className={`hidden text-left lg:block ${collapsed ? 'mx-auto' : ''}`}
                onClick={() => setCollapsed((value) => !value)}
                aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              >
                {collapsed ? (
                  <img src="/assets/votein-app-logo" alt="Votein" className="h-14 w-14 object-contain" />
                ) : (
                  <div>
                <img src="/assets/votein-logo" alt="Votein" className="h-10 w-auto" />
                    <p className="mt-3 max-w-[120px] text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {adminShellContent.brandTagline}
                    </p>
                  </div>
                )}
              </button>

              <div className={`lg:hidden ${collapsed ? 'mx-auto' : ''}`}>
                <img src="/assets/votein-logo" alt="Votein" className="h-10 w-auto" />
                <p className="mt-3 max-w-[120px] text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  {adminShellContent.brandTagline}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-white lg:hidden"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <nav className="px-4 pt-4">
              <div className="space-y-2">
                {adminShellContent.sidebarItems.map((item) => {
                  const Icon = sidebarIconMap[item.iconKey]
                  const isActive = item.href !== '#' && (
                    item.href === '/admin'
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`)
                  )
                  return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={isActive
                        ? `flex h-[52px] items-center rounded-2xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-900 ${collapsed ? 'justify-center lg:px-0' : 'justify-between'}`
                        : `flex h-[52px] items-center rounded-2xl border border-transparent px-4 text-[15px] text-slate-500 hover:bg-white ${collapsed ? 'justify-center lg:px-0' : 'gap-3'}`}
                      >
                      <span className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                        <Icon className="h-4 w-4" />
                        {!collapsed ? item.label : null}
                      </span>
                      {isActive && !collapsed ? <span className="h-8 w-1 rounded-full bg-black" /> : null}
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="mt-auto p-4">
              <div className={`rounded-3xl bg-white p-4 ${collapsed ? 'lg:px-3 lg:py-4' : ''}`}>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <UserCircle2 className="h-6 w-6" />
                  </div>
                  {!collapsed ? (
                    <div>
                      <p className="text-[14px] font-semibold text-slate-900">{adminShellContent.profile.name}</p>
                      <p className="mt-1 text-[12px] text-slate-500">{adminShellContent.profile.wallet}</p>
                    </div>
                  ) : null}
                </div>
                {!collapsed ? (
                  <button type="button" className="mt-4 inline-flex items-center gap-2 text-[13px] text-slate-700 hover:text-slate-900">
                    <Users className="h-4 w-4" />
                    {adminShellContent.profile.editLabel}
                  </button>
                ) : null}
              </div>
              <button type="button" onClick={() => setLogoutConfirmOpen(true)} className={`mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-black text-[14px] font-medium text-white hover:bg-slate-900 ${collapsed ? 'w-full px-0' : 'w-full'}`}>
                <LogOut className={`${collapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
                {!collapsed ? adminShellContent.profile.logoutLabel : null}
              </button>
            </div>
          </div>
        </aside>

        <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${sidebarWidthClass}`}>
          <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 px-4 py-4 backdrop-blur-sm md:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{adminShellContent.headerLabel}</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden h-11 items-center gap-3 rounded-full bg-slate-100 px-4 md:flex md:w-[280px]">
                  <Search className="h-4 w-4 text-slate-400" />
                  <span className="text-[14px] text-slate-400">{adminShellContent.searchPlaceholder}</span>
                </div>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
                  <Bell className="h-4 w-4" />
                </button>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
                  <UserRoundCheck className="h-4 w-4" />
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white">
                  <UserCircle2 className="h-5 w-5" />
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 md:px-6 lg:px-10 lg:py-8">
            {children}
          </div>

          <footer className="sticky bottom-0 z-30 border-t border-slate-100 bg-slate-50/95 px-4 pb-4 pt-3 backdrop-blur-sm md:px-6 lg:px-10">
            <div className="flex flex-col gap-3 text-[11px] uppercase tracking-[0.06em] text-slate-400 md:flex-row md:items-center md:justify-between">
              <p>{adminShellContent.footer.copyright}</p>
              <div className="flex items-center gap-4">
                {adminShellContent.footer.links.map((link) => (
                  <a key={link.label} href={link.href} className="hover:text-slate-600">{link.label}</a>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Keluar dari sesi admin?"
        description="Anda akan keluar dari panel admin dan kembali ke halaman login. Pastikan semua perubahan penting sudah disimpan."
        confirmLabel="Keluar Sesi"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </main>
  )
}

export function AdminModuleCard({ icon, title, description, dark = false, cta = 'Lihat Detail' }: { icon: ReactNode; title: string; description: string; dark?: boolean; cta?: string }) {
  return (
    <article className={dark ? 'rounded-[28px] bg-black p-6 text-white' : 'rounded-[28px] border border-slate-200 bg-white p-6'}>
      <div className={dark ? 'flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white' : 'flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900'}>
        {icon}
      </div>
      <h3 className={dark ? 'mt-8 text-[20px] font-semibold text-white' : 'mt-8 text-[20px] font-semibold text-slate-900'}>{title}</h3>
      <p className={dark ? 'mt-3 text-[15px] leading-8 text-slate-300' : 'mt-3 text-[15px] leading-8 text-slate-500'}>{description}</p>
      <div className="mt-8">
        <button type="button" className={dark ? 'inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-900' : 'inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-900'}>
          {cta}
        </button>
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
        : 'inline-flex h-10 items-center justify-center rounded-full bg-slate-100 px-6 text-[14px] font-medium text-slate-600 hover:bg-slate-200'}
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
