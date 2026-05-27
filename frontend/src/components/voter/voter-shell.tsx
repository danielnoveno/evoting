'use client'

import { Bell, CircleHelp, Home, Menu, Search, ShieldCheck, UserCircle2, X } from 'lucide-react'
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
import { NotificationModal } from '@/components/public/notification-modal'

const sidebarItems = [
  { href: '/pemilih', label: 'Beranda', icon: Home },
  { href: '/pemilih/bukti-saya', label: 'Bukti Saya', icon: ShieldCheck },
  { href: '/pemilih/bantuan', label: 'Bantuan', icon: CircleHelp },
] as const

export function VoterShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()
  const { store } = useVoterStore()
  const { sidebarWidthClass } = useSidebarLayout(collapsed)
  const { data: currentProfile } = useCurrentProfile()
  const logoutSession = useLogoutSession()

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
          title: 'Keluar berhasil',
          description: 'Sesi pemilih ditutup. Anda diarahkan kembali ke halaman utama.',
        })
        window.setTimeout(() => router.push('/'), 400)
      },
    })
  }

  const topLabel = useMemo(() => {
    if (pathname === '/pemilih/bukti-saya') return 'Arsip digital pemilih'
    if (pathname === '/pemilih/bantuan') return 'Pusat bantuan pemilih'
    if (pathname === '/pemilih/profil') return 'Pengaturan profil'
    if (pathname.includes('/pemilih/pemilihan/')) return 'Alur voting pemilih'
    return 'Dashboard utama pemilih'
  }, [pathname])

  return (
    <RoleGate
      allowedRoles={['voter', 'admin', 'super_admin']}
      fallbackTitle="Akses portal pemilih tidak tersedia"
      fallbackDescription="Masuk kembali dengan akun yang memiliki akses pemilih untuk membuka halaman ini."
    >
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <AppSidebar
          items={[...sidebarItems]}
          profile={{
            name: profile?.name ?? 'Pemilih',
            wallet: profile ? formatWallet(profile.wallet) : 'Belum terhubung',
            avatarUrl: profile?.avatarUrl,
            editLabel: 'Sunting Profil',
            editHref: '/pemilih/profil',
            logoutLabel: 'Keluar Sesi',
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
                  <span className="flex-1 truncate text-[13px] text-slate-400">Cari kandidat, pemilihan...</span>
                  <kbd className="hidden h-5 items-center gap-1 rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500 md:inline-flex">
                    <span className="text-[12px]">⌘</span>K
                  </kbd>
                </button>
                <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] font-medium text-slate-700 sm:flex md:text-[13px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {profile ? formatWallet(profile.wallet) : 'Belum terhubung'}
                </div>
                <button type="button" onClick={() => setNotifOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2" aria-label="Notifikasi pemilih">
                  <Bell className="h-4 w-4" />
                </button>
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

          <div className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {children}
          </div>

          <AppFooter className="px-4 py-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-3 text-[10px] uppercase tracking-[0.06em] text-slate-400 sm:text-[11px] md:flex-row md:items-center md:justify-between">
              <p>© 2026 Votein · Portal pemilih</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Link href="/kebijakan-privasi" className="hover:text-slate-800">Kebijakan Privasi</Link>
                <Link href="/ketentuan-layanan" className="hover:text-slate-800">Ketentuan Layanan</Link>
              </div>
            </div>
          </AppFooter>
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Keluar dari sesi pemilih?"
        description="Anda akan kembali ke halaman login. Pastikan bukti atau detail transaksi yang masih dibutuhkan sudah tersimpan."
        confirmLabel="Keluar Sesi"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      <NotificationModal 
        open={notifOpen} 
        onClose={() => setNotifOpen(false)} 
        profileId={currentProfile?.id}
        walletAddress={currentProfile?.walletAddress}
      />

      <CommandPalette role="voter" open={searchOpen} onOpenChange={setSearchOpen} />
    </main>
    </RoleGate>
  )
}

export function VoterPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-[220px] animate-pulse rounded-[28px] bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[320px] animate-pulse rounded-[28px] bg-slate-200" />
        <div className="h-[320px] animate-pulse rounded-[28px] bg-slate-200" />
      </div>
    </div>
  )
}
