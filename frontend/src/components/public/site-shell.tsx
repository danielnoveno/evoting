'use client'

import { ArrowLeft, Bell, ChevronDown, Copy, CopyCheck, ExternalLink, FileCheck2, LayoutGrid, LogOut, Menu, ScrollText, ShieldAlert, ShieldCheck, ShieldUser, TriangleAlert, UserCircle2, Vote, X } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AppNavbar, AppFooter } from '@/components/ui/app-bar'
import { AuditShortcutModal } from './audit-shortcut-modal'
import { NotificationModal } from './notification-modal'
import { useNotificationBadge } from '@/hooks/use-notification-badge'
import { useAuthSession, useLogoutSession } from '@/hooks/use-auth-session'
import { useCurrentProfile } from '@/hooks/use-profile'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { AppRole } from '@/lib/repositories/types'
import type { LucideIcon } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/cara-kerja', label: 'Cara Kerja' },
  { href: '/pemilihan', label: 'Pemilihan' },
]

function getDashboardHref(role: AppRole) {
  if (role === 'super_admin') return '/superadmin'
  if (role === 'admin') return '/admin'
  return '/pemilih'
}

function getProfileHref(role: AppRole) {
  if (role === 'super_admin') return '/superadmin/profil'
  if (role === 'admin') return '/admin/profil'
  return '/pemilih/profil'
}

function getRoleLabel(role: AppRole) {
  if (role === 'super_admin') return 'Superadmin'
  if (role === 'admin') return 'Admin'
  return 'Pemilih'
}

function getProfileInitial(name: string | null | undefined, role: AppRole) {
  const source = name?.trim() || getRoleLabel(role)
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'VT'
}

function truncateMiddle(value: string, maxLength = 33) {
  if (value.length <= maxLength) return value

  const visibleChars = maxLength - 3
  const startLength = Math.ceil(visibleChars / 2)
  const endLength = Math.floor(visibleChars / 2)

  return `${value.slice(0, startLength)}...${value.slice(-endLength)}`
}

function getResponsiveAddress(value: string, width: number) {
  if (!value) return value

  if (!width || width <= 0) return truncateMiddle(value, 33)

  const reservedPixels = 28
  const estimatedCharWidth = 6.2
  const rawMaxChars = Math.floor((width - reservedPixels) / estimatedCharWidth)
  const safeMaxChars = Math.max(18, Math.min(value.length, rawMaxChars))

  return truncateMiddle(value, safeMaxChars)
}

type RoleMenuItem = {
  href: string
  label: string
  icon: LucideIcon
}

function getRoleMenuItems(role: AppRole): RoleMenuItem[] {
  if (role === 'super_admin') {
    return [
      { href: '/superadmin', label: 'Beranda', icon: LayoutGrid },
      { href: '/superadmin/manajemen-superadmin', label: 'Manajemen Superadmin', icon: ShieldAlert },
      { href: '/superadmin/manajemen-admin', label: 'Manajemen Admin', icon: ShieldUser },
      { href: '/superadmin/manajemen-pemilihan', label: 'Manajemen Pemilihan', icon: Vote },
      { href: '/superadmin/manajemen-proposal', label: 'Manajemen Proposal', icon: FileCheck2 },
      { href: '/superadmin/audit-log', label: 'Audit Log', icon: ScrollText },
      { href: '/superadmin/data-voter', label: 'Data Master Voter', icon: ShieldCheck },
      { href: '/superadmin/risk-activity', label: 'Risk Activity', icon: TriangleAlert },
      { href: '/superadmin/profil', label: 'Profil', icon: UserCircle2 },
    ]
  }

  if (role === 'admin') {
    return [
      { href: '/admin', label: 'Beranda', icon: LayoutGrid },
      { href: '/admin/manajemen-pemilihan', label: 'Manajemen Pemilihan', icon: Vote },
      { href: '/admin/daftar-proposal', label: 'Daftar Proposal', icon: FileCheck2 },
      { href: '/admin/bantuan', label: 'Pusat Bantuan', icon: ShieldCheck },
      { href: '/admin/profil', label: 'Profil', icon: UserCircle2 },
    ]
  }

  return [
    { href: '/pemilih', label: 'Beranda', icon: LayoutGrid },
    { href: '/pemilih/bukti-saya', label: 'Riwayat Suara', icon: FileCheck2 },
    { href: '/pemilih/bantuan', label: 'Pusat Bantuan', icon: ShieldCheck },
    { href: '/pemilih/profil', label: 'Profil', icon: UserCircle2 },
  ]
}

export function PublicNavbar({ activePath, minimal = false }: { activePath: string; minimal?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [navbarAddressWidth, setNavbarAddressWidth] = useState(0)
  const [mobileAddressWidth, setMobileAddressWidth] = useState(0)
  const { hasUnread } = useNotificationBadge()
  const authSession = useAuthSession()
  const currentProfile = useCurrentProfile()
  const pathname = usePathname()
  const router = useRouter()
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const navbarAddressRef = useRef<HTMLSpanElement | null>(null)
  const mobileAddressRef = useRef<HTMLSpanElement | null>(null)
  const logoutSession = useLogoutSession()

  const hasSession = Boolean(authSession.data?.user)
  const profile = currentProfile.data
  const profileReady = hasSession && Boolean(profile)
  const authLoading = authSession.isLoading || (hasSession && currentProfile.isLoading)
  const dashboardHref = profile ? getDashboardHref(profile.role) : '/hubungkan-dompet'
  const profileHref = profile ? getProfileHref(profile.role) : '/hubungkan-dompet'
  const profileLabel = profile ? getRoleLabel(profile.role) : 'Akun'
  const profileName = profile?.displayName?.trim() || profileLabel
  const profileMeta = profile?.walletAddress
    ? getResponsiveAddress(profile.walletAddress, navbarAddressWidth)
    : profile?.email?.trim() || 'Sesi aktif'
  const mobileProfileMeta = profile?.walletAddress
    ? getResponsiveAddress(profile.walletAddress, mobileAddressWidth)
    : profile?.email?.trim() || 'Sesi aktif'
  const profileInitial = profile ? getProfileInitial(profile.displayName, profile.role) : 'VT'
  const roleMenuItems = useMemo(() => (profile ? getRoleMenuItems(profile.role) : []), [profile])

  useEffect(() => {
    if (!profileOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [profileOpen])

  useEffect(() => {
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    const element = navbarAddressRef.current
    if (!element) return

    const updateWidth = () => {
      setNavbarAddressWidth(element.clientWidth)
    }

    updateWidth()

    const observer = new ResizeObserver(() => updateWidth())
    observer.observe(element)

    window.addEventListener('resize', updateWidth)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [profileReady, profileName, profileLabel])

  useEffect(() => {
    const element = mobileAddressRef.current
    if (!element) return

    const updateWidth = () => {
      setMobileAddressWidth(element.clientWidth)
    }

    updateWidth()

    const observer = new ResizeObserver(() => updateWidth())
    observer.observe(element)

    window.addEventListener('resize', updateWidth)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [profileReady, mobileOpen, profileName, profileLabel])

  return (
    <AppNavbar className="sticky top-0 z-40">
      <div className="public-container flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-6 lg:gap-10">
          <Link href="/" className="flex items-center" aria-label="Votein beranda">
            <img
              src="/assets/votein-logo"
              alt="Votein"
              className="h-8 w-auto md:h-9"
            />
          </Link>

          {!minimal && (
            <nav className="hidden items-center gap-6 md:flex lg:gap-8">
              {navItems.map((item) => {
                const isActive = activePath === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActive
                      ? 'border-b-2 border-[#0F172A] py-3 text-[13px] font-semibold text-slate-900'
                      : 'py-3 text-[13px] text-slate-500 hover:text-slate-900'}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>

        {!minimal ? (
          <div className="flex min-w-0 items-center gap-2 border-l border-slate-100 pl-3 md:gap-3 md:pl-5">
            <button
              type="button"
              onClick={() => setAuditOpen(true)}
              className="hidden h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 md:inline-flex"
              aria-label="Buka shortcut audit"
            >
              <CopyCheck className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative hidden h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 md:inline-flex"
              aria-label="Notifikasi"
            >
              <Bell className="h-4 w-4" />
              {hasUnread && (
                <span className="absolute right-2 top-2 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
              )}
            </button>
            {authLoading ? (
              <div className="hidden h-10 w-[220px] animate-pulse rounded-xl border border-slate-200 bg-slate-100 md:block" />
            ) : profileReady ? (
              <>
                <Link
                  href={dashboardHref}
                  className="hidden h-10 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#1E293B] md:inline-flex"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Ke Dashboard
                </Link>
                <div className="relative hidden min-w-0 max-w-[360px] lg:flex lg:items-center lg:gap-1 xl:max-w-[420px]" ref={profileMenuRef}>
                  <div className="flex min-w-0 h-10 items-center gap-3 rounded-xl bg-white px-3 text-left">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700">
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profileName} className="h-full w-full object-cover" />
                      ) : (
                        profileInitial
                      )}
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-900">{profileName}</p>
                        <span className="inline-flex shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{profileLabel}</span>
                      </div>
                      <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-slate-400">
                        <span ref={navbarAddressRef} className="min-w-0 flex-1 font-mono text-[10px] text-slate-500">{profileMeta}</span>
                        {profile?.walletAddress ? (
                          <span
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              void navigator.clipboard.writeText(profile.walletAddress)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                event.stopPropagation()
                                void navigator.clipboard.writeText(profile.walletAddress)
                              }
                            }}
                            className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Salin alamat wallet"
                            title="Salin alamat wallet"
                            role="button"
                            tabIndex={0}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((value) => !value)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={`Buka menu profil ${profileName}`}
                    aria-expanded={profileOpen}
                  >
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] w-[320px] rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-[13px] font-semibold text-slate-700">
                            {profile?.avatarUrl ? (
                              <img src={profile.avatarUrl} alt={profileName} className="h-full w-full object-cover" />
                            ) : (
                              profileInitial
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[14px] font-semibold text-slate-900">{profileName}</p>
                              <span className="inline-flex rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">{profileLabel}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-500">
                              <span className="truncate">{profile?.walletAddress ? truncateMiddle(profile.walletAddress, 25) : profileMeta}</span>
                              {profile?.walletAddress ? (
                                <button
                                  type="button"
                                  onClick={() => void navigator.clipboard.writeText(profile.walletAddress)}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
                                  aria-label="Salin alamat wallet"
                                  title="Salin alamat wallet"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        {roleMenuItems.map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setProfileOpen(false)}
                              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition-colors ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          )
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false)
                            setLogoutConfirmOpen(true)
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          <span className="truncate">Keluar Sesi</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <Link
                  href={profileHref}
                  className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                  aria-label={`Buka profil ${profileName}`}
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profileName} className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-5 w-5" />
                  )}
                </Link>
              </>
            ) : (
              <Link
                href="/hubungkan-dompet"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#1E293B]"
              >
                Masuk
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 md:hidden"
              aria-label="Menu navigasi"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        ) : null}
      </div>

      <AuditShortcutModal open={auditOpen} onClose={() => setAuditOpen(false)} />
      <NotificationModal
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        profileId={profile?.id}
        walletAddress={profile?.walletAddress}
      />

      {/* Mobile navigation menu */}
      {!minimal && mobileOpen ? (
        <nav className="border-t border-slate-100 bg-white px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {profileReady ? (
              <div className="mb-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[13px] font-semibold text-slate-900">{profileName}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.06em] text-slate-400">{profileLabel}</p>
                <span ref={mobileAddressRef} className="mt-2 block min-w-0 font-mono text-[12px] text-slate-600">{mobileProfileMeta}</span>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href={dashboardHref}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={profileHref}
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900"
                  >
                    Profil
                  </Link>
                </div>
              </div>
            ) : null}
            {navItems.map((item) => {
              const isActive = activePath === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={isActive
                    ? 'rounded-lg bg-slate-100 px-4 py-3 text-[14px] font-semibold text-slate-900'
                    : 'rounded-lg px-4 py-3 text-[14px] text-slate-800 hover:bg-slate-50'}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      ) : null}

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Keluar Sesi?"
        description="Anda akan keluar dari sesi saat ini dan kembali ke halaman utama."
        confirmLabel="Ya, Keluar"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false)
          logoutSession.mutate(undefined, {
            onSettled: () => {
              router.push('/')
            },
          })
        }}
      />
    </AppNavbar>
  )
}

export function PublicFooter() {
  return (
    <AppFooter className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 bg-white/80 py-3 backdrop-blur-md">
      <div className="public-container flex flex-col gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Votein · Platform e-voting</p>
        <div className="flex items-center gap-6">
          <Link href="/kebijakan-privasi" className="transition-colors hover:text-slate-900">Kebijakan Privasi</Link>
          <Link href="/ketentuan-layanan" className="transition-colors hover:text-slate-900">Ketentuan Layanan</Link>
        </div>
      </div>
    </AppFooter>
  )
}

export function PublicPage({ activePath, children }: { activePath: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50 pb-16">
      <PublicNavbar activePath={activePath} />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </main>
  )
}

export function SectionTitle({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-[760px]">
      <h1 className="text-[32px] font-semibold leading-[1.18] text-slate-900 md:text-[40px] lg:text-[48px]">
        {title}
      </h1>
      <p className="mt-4 text-[14px] leading-7 text-slate-800 md:text-[16px] md:leading-8">{body}</p>
    </div>
  )
}

export function BasescanLink({ href, label = 'Lihat di Basescan' }: { href: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-700 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2">
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  )
}

export function PublicElectionBackLink({ href = '/pemilihan', label = 'Kembali ke daftar pemilihan' }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-800 transition-colors hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  )
}
