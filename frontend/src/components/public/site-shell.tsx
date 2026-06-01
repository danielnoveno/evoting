'use client'

import { ArrowLeft, Bell, ChevronDown, CopyCheck, ExternalLink, LayoutGrid, Menu, UserCircle2, X } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { AppNavbar, AppFooter } from '@/components/ui/app-bar'
import { AuditShortcutModal } from './audit-shortcut-modal'
import { NotificationModal } from './notification-modal'
import { useNotificationBadge } from '@/hooks/use-notification-badge'
import { useAuthSession } from '@/hooks/use-auth-session'
import { useCurrentProfile } from '@/hooks/use-profile'
import { formatWallet } from '@/lib/voter-store'
import type { AppRole } from '@/lib/repositories/types'

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

export function PublicNavbar({ activePath, minimal = false }: { activePath: string; minimal?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { hasUnread } = useNotificationBadge()
  const authSession = useAuthSession()
  const currentProfile = useCurrentProfile()

  const hasSession = Boolean(authSession.data?.user)
  const profile = currentProfile.data
  const profileReady = hasSession && Boolean(profile)
  const authLoading = authSession.isLoading || (hasSession && currentProfile.isLoading)
  const dashboardHref = profile ? getDashboardHref(profile.role) : '/hubungkan-dompet'
  const profileHref = profile ? getProfileHref(profile.role) : '/hubungkan-dompet'
  const profileLabel = profile ? getRoleLabel(profile.role) : 'Akun'
  const profileName = profile?.displayName?.trim() || profileLabel
  const profileMeta = profile?.walletAddress ? formatWallet(profile.walletAddress) : profile?.email?.trim() || 'Sesi aktif'
  const profileInitial = profile ? getProfileInitial(profile.displayName, profile.role) : 'VT'

  return (
    <AppNavbar className="sticky top-0 z-40">
      <div className="public-container flex h-14 items-center justify-between gap-4">
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
          <div className="flex items-center gap-2 border-l border-slate-100 pl-3 md:gap-3 md:pl-5">
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
                <Link
                  href={profileHref}
                  className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 lg:inline-flex"
                  aria-label={`Buka profil ${profileName}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-[12px] font-semibold text-slate-700">
                    {profile?.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profileName} className="h-full w-full object-cover" />
                    ) : (
                      profileInitial
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-900">{profileName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{profileLabel}</span>
                      <span className="truncate text-[11px] text-slate-400">{profileMeta}</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                </Link>
                <Link
                  href={profileHref}
                  className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 lg:hidden"
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
                <p className="mt-2 text-[12px] text-slate-600">{profileMeta}</p>
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
