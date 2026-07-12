'use client'

import { Bell, CircleHelp, Copy, Home, Menu, Search, ShieldCheck, UserCircle2, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RoleGate } from '@/components/auth/role-gate'
import { AppNavbar, AppFooter } from '@/components/ui/app-bar'
import { AppSidebar, useSidebarLayout } from '@/components/ui/app-sidebar'
import { useToast } from '@/components/ui/toast-provider'
import { CommandPalette } from '@/components/ui/command-palette'
import { formatWallet, useVoterStore } from '@/lib/voter-store'
import { useCurrentProfile } from '@/hooks/use-profile'
import { useLogoutSession } from '@/hooks/use-auth-session'
import { useNotificationBadge } from '@/hooks/use-notification-badge'
import { OnboardingTour } from './onboarding-tour'
import { useWelcomeToast } from '@/hooks/use-welcome-toast'
import { useSilentReconnect } from '@/hooks/use-silent-reconnect'
import { LocalClock } from '@/components/ui/local-clock'

export function VoterShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()
  const { store } = useVoterStore()
  const { sidebarWidthClass } = useSidebarLayout(collapsed)
  const { data: currentProfile } = useCurrentProfile()
  const logoutSession = useLogoutSession()
  const { hasUnread, unreadCount } = useNotificationBadge()
  // ponytail: locale hardcoded to Bahasa Indonesia (English unreachable) — no i18n runtime.
  const t = {
    sidebar: {
      dashboard: 'Beranda',
      superadmin: 'Manajemen Superadmin',
      admin: 'Manajemen Admin',
      election: 'Manajemen Pemilihan',
      proposal: 'Manajemen Proposal',
      audit: 'Audit Log',
      voter: 'Data Master Voter',
      risk: 'Risk Activity',
      profile: 'Profil',
      help: 'Pusat Bantuan',
      voter_home: 'Beranda Pemilih',
      voter_elections: 'Pemilihan Aktif',
      voter_history: 'Riwayat Suara',
    },
    header: {
      search: 'Cari data...',
      logout: 'Keluar Sesi',
      connect_wallet: 'Hubungkan Dompet',
    },
    voter: {
      welcome: 'Selamat Datang di VoteIn',
      description: 'Gunakan hak suara Anda dengan aman melalui teknologi blockchain.',
      start_voting: 'Mulai Memilih',
    },
    profile: {
      title: 'Profil Pengguna',
      save: 'Simpan Perubahan',
      cancel: 'Batal',
    },
  }
  const locale = 'Bahasa Indonesia'

  // Tampilkan toast selamat datang sekali per sesi login
  useWelcomeToast()

  // Silent wallet reconnect: restore Base Account session tanpa popup
  useSilentReconnect()

  const sidebarItems = [
    { href: '/pemilih', label: t.sidebar.dashboard, icon: Home },
    { href: '/pemilih/bukti-saya', label: t.sidebar.voter_history, icon: ShieldCheck },
    { href: '/pemilih/bantuan', label: t.sidebar.help, icon: CircleHelp },
  ] as const

  const profile = currentProfile
    ? {
        name: currentProfile.displayName ?? store?.profile.name ?? 'Pemilih',
        email: currentProfile.email ?? store?.profile.email ?? '',
        wallet: currentProfile.walletAddress,
        bio: store?.profile.bio ?? '',
        avatarUrl: currentProfile.avatarUrl ?? store?.profile.avatarUrl ?? '',
      }
    : store?.profile

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false)
    logoutSession.mutate(undefined, {
      onSettled: () => {
        showToast({
          tone: 'success',
          title: locale === 'Bahasa Indonesia' ? 'Keluar berhasil' : 'Logout successful',
          description: locale === 'Bahasa Indonesia' 
            ? 'Sesi pemilih ditutup. Anda diarahkan kembali ke halaman utama.'
            : 'Voter session closed. You are being redirected to the home page.',
        })
        window.setTimeout(() => router.push('/'), 400)
      },
    })
  }

  const topLabel = useMemo(() => {
    const isIndo = locale === 'Bahasa Indonesia'
    if (pathname === '/pemilih/bukti-saya') return isIndo ? 'Arsip digital pemilih' : 'Voter digital archive'
    if (pathname === '/pemilih/bantuan') return isIndo ? 'Pusat bantuan pemilih' : 'Voter help center'
    if (pathname === '/pemilih/profil') return isIndo ? 'Pengaturan profil' : 'Profile settings'
    if (pathname.includes('/pemilih/pemilihan/')) return isIndo ? 'Alur voting pemilih' : 'Voter voting flow'
    return isIndo ? 'Dashboard utama pemilih' : 'Voter main dashboard'
  }, [pathname, locale])

  return (
    <RoleGate
      allowedRoles={['voter', 'admin', 'super_admin']}
      fallbackTitle={locale === 'Bahasa Indonesia' ? 'Sesi Telah Berakhir' : 'Session Timeout'}
      fallbackDescription={locale === 'Bahasa Indonesia' 
        ? 'Sesi Anda telah berakhir atau akses tidak valid demi keamanan. Silakan masuk kembali untuk melanjutkan penggunaan portal pemilih.'
        : 'Your session has ended or access is invalid for your protection. Please log in again to continue using the voter portal.'}
    >
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar
          items={[...sidebarItems]}
          profile={{
            name: profile?.name ?? 'Pemilih',
            wallet: profile ? formatWallet(profile.wallet) : (locale === 'Bahasa Indonesia' ? 'Belum terhubung' : 'Not connected'),
            avatarUrl: profile?.avatarUrl,
            editLabel: t.sidebar.profile,
            editHref: '/pemilih/profil',
            logoutLabel: t.header.logout,
          }}
          rootPaths={['/pemilih']}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onLogout={() => setLogoutConfirmOpen(true)}
        />

        <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${sidebarWidthClass}`}>
          <AppNavbar className="sticky top-0 z-30 px-4 py-3 md:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 md:gap-4">
              <div className="min-w-0 flex-1 lg:flex-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{topLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 md:gap-3">
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Buka menu pemilih">
                  <Menu className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setSearchOpen(true)} className="hidden h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 md:flex md:w-[280px]" aria-label="Cari kandidat atau pemilihan">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 truncate text-[13px] text-slate-400">{t.header.search}</span>
                  <kbd className="hidden h-5 items-center gap-1 rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500 md:inline-flex">
                    <span className="text-[12px]">⌘</span>K
                  </kbd>
                </button>
                <LocalClock className="rounded-md py-2" />
                <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 sm:flex md:text-[13px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="truncate max-w-[120px] md:max-w-none">
                    {profile ? formatWallet(profile.wallet) : (locale === 'Bahasa Indonesia' ? 'Belum terhubung' : 'Not connected')}
                  </span>
                  {profile?.wallet && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(profile.wallet)
                        showToast({
                          tone: 'success',
                          title: locale === 'Bahasa Indonesia' ? 'Alamat Disalin' : 'Address Copied',
                          description: locale === 'Bahasa Indonesia' ? 'Alamat dompet disalin ke clipboard.' : 'Wallet address copied to clipboard.',
                        })
                      }}
                      className="ml-1 rounded p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                      title="Salin alamat dompet"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <Link
                  href="/pemilih/notifikasi"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  aria-label="Notifikasi pemilih"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/pemilih/profil"
                  className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition ${
                    pathname === '/pemilih/profil' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  aria-label="Buka profil pemilih"
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-5 w-5" />
                  )}
                </Link>
              </div>
            </div>
          </AppNavbar>

          <div className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-6">
            <div className="mx-auto w-full max-w-[1200px]">
              {children}
            </div>
          </div>

          <AppFooter className="px-4 py-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-3 text-[10px] uppercase tracking-[0.06em] text-slate-400 sm:text-[11px] md:flex-row md:items-center md:justify-between">
              <p>© 2026 Votein · {locale === 'Bahasa Indonesia' ? 'Portal pemilih' : 'Voter portal'}</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Link href="/kebijakan-privasi" className="hover:text-slate-800">{locale === 'Bahasa Indonesia' ? 'Kebijakan Privasi' : 'Privacy Policy'}</Link>
                <Link href="/ketentuan-layanan" className="hover:text-slate-800">{locale === 'Bahasa Indonesia' ? 'Ketentuan Layanan' : 'Terms of Service'}</Link>
              </div>
            </div>
          </AppFooter>
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title={t.header.logout + '?'}
        description={locale === 'Bahasa Indonesia' 
          ? 'Anda akan kembali ke halaman login. Pastikan bukti atau detail transaksi yang masih dibutuhkan sudah tersimpan.'
          : 'You will return to the login page. Ensure any necessary proofs or transaction details are saved.'}
        confirmLabel={t.header.logout}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      <CommandPalette role="voter" open={searchOpen} onOpenChange={setSearchOpen} />

      <OnboardingTour />
    </main>
    </RoleGate>

  )
}

export function VoterPageSkeleton() {
  return (
    <div className="min-h-[85vh] space-y-6">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-[340px] animate-pulse rounded-[28px] bg-slate-100" />
      <div className="rounded-xl border border-slate-100 bg-white p-4">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-50" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-50" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[180px] animate-pulse rounded-xl bg-slate-100" />
        <div className="h-[180px] animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="h-[80px] animate-pulse rounded-lg bg-slate-100" />
        <div className="h-[80px] animate-pulse rounded-lg bg-slate-100" />
        <div className="h-[80px] animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  )
}
