'use client'

import { Bell, Menu, Search, UserCircle2, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'
import { CommandPalette, type CommandPaletteRole } from '@/components/ui/command-palette'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AppNavbar, AppFooter } from '@/components/ui/app-bar'
import { AppSidebar, useSidebarLayout, type SidebarNavItem } from '@/components/ui/app-sidebar'
import { useToast } from '@/components/ui/toast-provider'

export type { SidebarNavItem as ConsoleNavItem }

interface ConsoleShellProps {
  children: ReactNode
  role: CommandPaletteRole
  headerLabel: string
  brandTagline?: string
  searchPlaceholder: string
  sidebarItems: SidebarNavItem[]
  profile: {
    name: string
    wallet: string
    editLabel: string
    editHref: string
    logoutLabel: string
  }
  footer: {
    copyright: string
    links: ReadonlyArray<{
      label: string
      href: string
    }>
  }
  logoutConfig: {
    title: string
    description: string
    confirmLabel: string
    successTitle: string
    successDescription: string
    redirectTo: string
  }
}

export function ConsoleShell({
  children,
  role,
  headerLabel,
  brandTagline,
  searchPlaceholder,
  sidebarItems,
  profile,
  footer,
  logoutConfig,
}: ConsoleShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()
  const { sidebarWidthClass } = useSidebarLayout(collapsed)

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false)
    showToast({
      tone: 'success',
      title: logoutConfig.successTitle,
      description: logoutConfig.successDescription,
    })
    window.setTimeout(() => {
      router.push(logoutConfig.redirectTo)
    }, 500)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar
          items={sidebarItems}
          profile={{
            name: profile.name,
            wallet: profile.wallet,
            editLabel: profile.editLabel,
            editHref: profile.editHref,
            logoutLabel: profile.logoutLabel,
          }}
          rootPaths={['/admin', '/superadmin', '/pemilih']}
          brandExtra={
            brandTagline ? (
              <p className="mt-3 max-w-[120px] text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                {brandTagline}
              </p>
            ) : undefined
          }
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onLogout={() => setLogoutConfirmOpen(true)}
        />

        <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${sidebarWidthClass}`}>
          <AppNavbar className="sticky top-0 z-30 px-4 py-4 md:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{headerLabel}</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setSearchOpen(true)} className="hidden h-11 items-center gap-3 rounded-full bg-slate-100 px-4 text-left transition-colors hover:bg-slate-200 md:flex md:w-[280px]">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 truncate text-[13px] text-slate-400">{searchPlaceholder}</span>
                  <kbd className="hidden h-5 items-center gap-1 rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500 md:inline-flex">
                    <span className="text-[12px]">⌘</span>K
                  </kbd>
                </button>
                <button type="button" onClick={() => showToast({ tone: 'info', title: 'Notifikasi', description: 'Notifikasi belum tersedia saat ini.' })} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-800 hover:bg-slate-100">
                  <Bell className="h-4 w-4" />
                </button>
                <Link
                  href={profile.editHref}
                  aria-label={`Buka profil ${profile.name}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                    pathname === profile.editHref ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                >
                  <UserCircle2 className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </AppNavbar>

          <div className="flex-1 px-4 py-6 md:px-6 lg:px-10 lg:py-8">{children}</div>

          <AppFooter className="sticky bottom-0 z-30 px-4 pb-4 pt-3 md:px-6 lg:px-10">
            <div className="flex flex-col gap-3 text-[11px] uppercase tracking-[0.06em] text-slate-400 md:flex-row md:items-center md:justify-between">
              <p>{footer.copyright}</p>
              <div className="flex items-center gap-4">
                {footer.links.map((link) => (
                  <a key={link.label} href={link.href} className="hover:text-slate-800">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </AppFooter>
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title={logoutConfig.title}
        description={logoutConfig.description}
        confirmLabel={logoutConfig.confirmLabel}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      <CommandPalette role={role} open={searchOpen} onOpenChange={setSearchOpen} />
    </main>
  )
}
