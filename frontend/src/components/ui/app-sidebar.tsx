'use client'

import { LogOut, UserCircle2, UserRoundCheck, X, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, useMemo, useState } from 'react'

/* ─────────────────────────────────────────────
   Shared sidebar component for all roles.
   Ubah style/warna di sini → otomatis update
   di admin, superadmin, dan voter.
   ───────────────────────────────────────────── */

export interface SidebarNavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface SidebarProfileConfig {
  name: string
  wallet: string
  avatarUrl?: string
  editLabel: string
  editHref: string
  logoutLabel: string
}

interface AppSidebarProps {
  /** Navigation items to render */
  items: SidebarNavItem[]
  /** User profile card config */
  profile: SidebarProfileConfig
  /** Root paths used to determine "exact match" (e.g. '/admin', '/pemilih') */
  rootPaths?: string[]
  /** Custom content to render below the logo (optional) */
  brandExtra?: ReactNode
  /** Whether sidebar is open on mobile */
  mobileOpen: boolean
  onMobileClose: () => void
  /** Whether sidebar is collapsed (desktop only) */
  collapsed: boolean
  onToggleCollapse: () => void
  /** Called when logout button is clicked */
  onLogout: () => void
}

export function AppSidebar({
  items,
  profile,
  rootPaths = [],
  brandExtra,
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
  onLogout,
}: AppSidebarProps) {
  const pathname = usePathname()

  const sidebarDesktopWidthClass = collapsed ? 'lg:w-[96px]' : 'lg:w-[264px]'

  const formattedWallet = useMemo(() => {
    const w = profile.wallet
    if (!w) return ''
    if (w.length <= 13) return w
    return `${w.slice(0, 6)}...${w.slice(-4)}`
  }, [profile.wallet])

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Tutup sidebar"
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside className={`fixed inset-y-0 left-0 z-50 w-[264px] shrink-0 border-r border-slate-200 bg-white transition-all duration-200 lg:z-40 lg:flex lg:translate-x-0 ${sidebarDesktopWidthClass} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-full w-full flex-col overflow-y-auto">
          {/* ─── Brand / Logo ─── */}
          <div className={`flex items-start justify-between px-5 pb-4 pt-6 ${collapsed ? 'lg:px-4' : ''}`}>
            <button
              type="button"
              className={`hidden text-left lg:block ${collapsed ? 'mx-auto' : ''}`}
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            >
              {collapsed ? (
                <img src="/assets/votein-app-logo" alt="Votein" className="h-14 w-14 object-contain" />
              ) : (
                <div>
                  <img src="/assets/votein-logo" alt="Votein" className="h-10 w-auto" />
                  {brandExtra}
                </div>
              )}
            </button>

            <div className={`lg:hidden ${collapsed ? 'mx-auto' : ''}`}>
              <img src="/assets/votein-logo" alt="Votein" className="h-10 w-auto" />
              {brandExtra}
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-50 lg:hidden"
              onClick={onMobileClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ─── Navigation Items ─── */}
          <nav className="px-4 pt-4">
            <div className="space-y-2">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = item.href !== '#' && (
                  rootPaths.includes(item.href)
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)
                )

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={isActive
                      ? `flex h-[44px] items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-[14px] font-semibold text-slate-900 ${collapsed ? 'justify-center lg:px-0' : 'justify-between'}`
                      : `flex h-[44px] items-center rounded-lg border border-transparent px-4 text-[14px] text-slate-500 hover:bg-slate-50 hover:text-slate-900 ${collapsed ? 'justify-center lg:px-0' : 'gap-3'}`}
                  >
                    <span className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                      <Icon className="h-4 w-4" />
                      {!collapsed ? item.label : null}
                    </span>
                    {isActive && !collapsed ? <span className="h-6 w-1 rounded-full bg-[#0F172A]" /> : null}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* ─── Profile Card + Logout ─── */}
          <div className="mt-auto p-4">
            <div className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${collapsed ? 'lg:px-3 lg:py-4' : ''}`}>
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700">
                      <UserCircle2 className="h-6 w-6" />
                    </div>
                )}
                {!collapsed ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-slate-900">{profile.name}</p>
                    <p className="mt-1 truncate text-[12px] text-slate-500" title={profile.wallet}>{formattedWallet}</p>
                  </div>
                ) : null}
              </div>
              {!collapsed ? (
                <Link
                  href={profile.editHref}
                    className={`mt-4 inline-flex w-full rounded-md py-2.5 text-[13px] transition-colors ${
                      pathname === profile.editHref
                        ? 'items-center justify-between border border-slate-200 bg-white px-3 font-semibold text-slate-900'
                        : 'items-center justify-center gap-2 text-slate-800 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                  {pathname === profile.editHref ? (
                    <>
                      <span className="flex items-center gap-2">
                        <UserRoundCheck className="h-4 w-4" />
                        {profile.editLabel}
                      </span>
                      <span className="h-6 w-1 rounded-full bg-black" />
                    </>
                  ) : (
                    <>
                      <UserRoundCheck className="h-4 w-4" />
                      {profile.editLabel}
                    </>
                  )}
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className={`mt-3 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] text-[13px] font-medium text-white hover:bg-[#1E293B] ${collapsed ? 'w-full px-0' : 'w-full'}`}
            >
              <LogOut className={`${collapsed ? 'mr-0' : 'mr-2'} h-4 w-4`} />
              {!collapsed ? profile.logoutLabel : null}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

/**
 * Helper: returns the content-area margin className based on collapse state.
 */
export function useSidebarLayout(collapsed: boolean) {
  const sidebarWidthClass = useMemo(() => (collapsed ? 'lg:ml-[96px]' : 'lg:ml-[264px]'), [collapsed])
  return { sidebarWidthClass }
}
