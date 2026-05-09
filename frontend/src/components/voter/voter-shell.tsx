'use client'

import { Bell, CircleHelp, Home, LogOut, Menu, Search, ShieldCheck, UserCircle2, UserRoundCheck, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { CommandPalette } from '@/components/ui/command-palette'
import { formatWallet, useVoterStore } from '@/lib/voter-mock-store'

const sidebarItems = [
  { href: '/pemilih', label: 'Beranda', icon: Home },
  { href: '/pemilih/bukti-saya', label: 'Bukti Saya', icon: ShieldCheck },
  { href: '/pemilih/bantuan', label: 'Bantuan', icon: CircleHelp },
] as const

export function VoterShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { showToast } = useToast()
  const { store } = useVoterStore()

  const profile = store?.profile

  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false)
    showToast({
      tone: 'success',
      title: 'Keluar berhasil',
      description: 'Sesi pemilih ditutup. Anda diarahkan kembali ke halaman login.',
    })
    window.setTimeout(() => router.push('/hubungkan-dompet'), 400)
  }

  const topLabel = useMemo(() => {
    if (pathname === '/pemilih/bukti-saya') return 'Arsip digital pemilih'
    if (pathname === '/pemilih/bantuan') return 'Pusat bantuan pemilih'
    if (pathname === '/pemilih/profil') return 'Pengaturan profil'
    if (pathname.includes('/pemilih/pemilihan/')) return 'Alur voting pemilih'
    return 'Dashboard utama pemilih'
  }, [pathname])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {mobileOpen ? (
          <button type="button" className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Tutup sidebar" />
        ) : null}

        <aside className={`fixed inset-y-0 left-0 z-50 w-[264px] shrink-0 border-r border-slate-100 bg-white/95 transition-transform duration-200 lg:z-40 lg:flex lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex h-full w-full flex-col overflow-y-auto">
            <div className="flex items-start justify-between px-5 pb-4 pt-6">
              <div>
                <img src="/assets/votein-logo" alt="Votein" className="h-10 w-auto" />
                <p className="mt-3 max-w-[140px] text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  E-Voting with blockchain system
                </p>
              </div>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="px-4 pt-4">
              <div className="space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  const isActive = item.href === '/pemilih'
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={isActive
                        ? 'flex h-[52px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-900 shadow-sm'
                        : 'flex h-[52px] items-center gap-3 rounded-2xl border border-transparent px-4 text-[15px] text-slate-500 hover:bg-slate-50'}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {isActive ? <span className="h-8 w-1 rounded-full bg-black" /> : null}
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="mt-auto p-4">
              <div className="rounded-[28px] bg-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <img src={profile?.avatarUrl ?? 'https://i.pravatar.cc/320?img=12'} alt={profile?.name ?? 'Pemilih'} className="h-11 w-11 rounded-full object-cover" />
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900">{profile?.name ?? 'Pemilih'}</p>
                    <p className="mt-1 text-[12px] text-slate-500">{profile ? formatWallet(profile.wallet) : '0x71C...4f21'}</p>
                  </div>
                </div>
                <Link
                  href="/pemilih/profil"
                  className={pathname === '/pemilih/profil'
                    ? 'mt-4 inline-flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-900'
                    : 'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-[13px] text-slate-700 hover:text-slate-900'}
                >
                  {pathname === '/pemilih/profil' ? (
                    <>
                      <span className="flex items-center gap-2">
                        <UserRoundCheck className="h-4 w-4" />
                        Sunting Profil
                      </span>
                      <span className="h-6 w-1 rounded-full bg-black" />
                    </>
                  ) : (
                    <>
                      <UserRoundCheck className="h-4 w-4" />
                      Sunting Profil
                    </>
                  )}
                </Link>
              </div>
              <button type="button" onClick={() => setLogoutConfirmOpen(true)} className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-black text-[14px] font-medium text-white hover:bg-slate-900">
                <LogOut className="mr-2 h-4 w-4" />
                Keluar Sesi
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:ml-[264px]">
          <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 px-4 py-4 backdrop-blur-sm md:px-6 lg:px-10">
            <div className="flex items-center justify-between gap-3 md:gap-4">
              <div className="min-w-0 flex-1 lg:flex-none">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{topLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 md:gap-3">
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setSearchOpen(true)} className="hidden h-11 items-center gap-3 rounded-full bg-slate-100 px-4 md:flex md:w-[280px] hover:bg-slate-200 transition-colors text-left">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-[13px] text-slate-400 truncate flex-1">Cari kandidat, pemilihan...</span>
                  <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500">
                    <span className="text-[12px]">⌘</span>K
                  </kbd>
                </button>
                <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[13px] font-medium text-slate-700 sm:flex md:px-4 md:text-[14px]">
                  <ShieldCheck className="h-4 w-4" />
                  {profile ? formatWallet(profile.wallet) : '0x71C...4f21'}
                </div>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-white">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-10 lg:py-8">
            {children}
          </div>

          <footer className="sticky bottom-0 z-20 border-t border-slate-100 bg-slate-50/95 px-4 pb-4 pt-3 backdrop-blur-sm md:px-6 lg:px-10">
            <div className="flex flex-col gap-3 text-[10px] uppercase tracking-[0.06em] text-slate-400 sm:text-[11px] md:flex-row md:items-center md:justify-between">
              <p>© 2026 E-Voting Indonesia · Keamanan Tingkat Tinggi</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <a href="#" className="hover:text-slate-600">Kebijakan Privasi</a>
                <a href="#" className="hover:text-slate-600">Ketentuan Layanan</a>
              </div>
            </div>
          </footer>
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

      <CommandPalette role="voter" open={searchOpen} onOpenChange={setSearchOpen} />
    </main>
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
