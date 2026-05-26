'use client'

import { ArrowLeft, Bell, CopyCheck, ExternalLink, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { AppNavbar, AppFooter } from '@/components/ui/app-bar'
import { useToast } from '@/components/ui/toast-provider'
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'
import { AuditShortcutModal } from './audit-shortcut-modal'
import { NotificationModal } from './notification-modal'

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/cara-kerja', label: 'Cara Kerja' },
  { href: '/pemilihan', label: 'Pemilihan' },
]

export function PublicNavbar({ activePath, minimal = false }: { activePath: string; minimal?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { showToast } = useToast()

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
              className="hidden h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 md:inline-flex"
              aria-label="Notifikasi"
            >
              <Bell className="h-4 w-4" />
            </button>
            <ConnectWalletButton />
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
      <NotificationModal open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Mobile navigation menu */}
      {!minimal && mobileOpen ? (
        <nav className="border-t border-slate-100 bg-white px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
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
