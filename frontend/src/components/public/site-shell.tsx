'use client'

import { ArrowLeft, Bell, CopyCheck, ExternalLink, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { AppNavbar, AppFooter } from '@/components/ui/app-bar'
import { useToast } from '@/components/ui/toast-provider'

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/cara-kerja', label: 'Cara Kerja' },
  { href: '/pemilihan', label: 'Pemilihan' },
]

export function PublicNavbar({ activePath }: { activePath: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { showToast } = useToast()

  return (
    <AppNavbar className="sticky top-0 z-40">
      <div className="public-container flex h-[60px] items-center justify-between gap-4 md:h-[62px]">
        <div className="flex min-w-0 items-center gap-6 lg:gap-10">
          <Link href="/" className="flex items-center" aria-label="Votein beranda">
            <img
              src="/assets/votein-logo"
              alt="Votein"
              className="h-9 w-auto md:h-10"
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex lg:gap-10">
            {navItems.map((item) => {
              const isActive = activePath === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive
                    ? 'border-b-2 border-[#0F172A] pb-[7px] pt-[9px] text-[14px] font-semibold text-slate-900'
                    : 'pb-[7px] pt-[9px] text-[14px] text-slate-500 hover:text-slate-900'}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-100 pl-3 md:gap-3 md:pl-6">
          <button
            type="button"
            onClick={() => showToast({ tone: 'info', title: 'Shortcut audit', description: 'Fitur audit shortcut belum tersedia pada versi demo.' })}
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 md:inline-flex"
            aria-label="Buka shortcut audit"
          >
            <CopyCheck className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => showToast({ tone: 'info', title: 'Notifikasi', description: 'Notifikasi belum tersedia pada versi demo.' })}
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 md:inline-flex"
            aria-label="Notifikasi"
          >
            <Bell className="h-4 w-4" />
          </button>
          <Link
            href="/hubungkan-dompet"
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#0F172A] px-4 text-[14px] font-medium text-white hover:bg-[#1E293B] md:h-11 md:px-5"
          >
            Masuk
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
            aria-label="Menu navigasi"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {mobileOpen ? (
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
                    ? 'rounded-xl bg-slate-100 px-4 py-3 text-[15px] font-semibold text-slate-900'
                    : 'rounded-xl px-4 py-3 text-[15px] text-slate-600 hover:bg-slate-50'}
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
    <AppFooter className="fixed bottom-0 left-0 right-0 z-40 py-4">
      <div className="public-container flex flex-col gap-3 text-[11px] uppercase tracking-[0.06em] text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© 2026 E-Voting Indonesia · Keamanan Tingkat Tinggi</p>
        <div className="flex items-center gap-4">
          <Link href="/kebijakan-privasi" className="hover:text-slate-600">Kebijakan Privasi</Link>
          <Link href="/ketentuan-layanan" className="hover:text-slate-600">Ketentuan Layanan</Link>
        </div>
      </div>
    </AppFooter>
  )
}

export function PublicPage({ activePath, children }: { activePath: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PublicNavbar activePath={activePath} />
      <div className="flex-1 pb-24 md:pb-20">{children}</div>
      <PublicFooter />
    </main>
  )
}

export function SectionTitle({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-[760px]">
      <h1 className="text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[56px]">
        {title}
      </h1>
      <p className="mt-5 text-[18px] leading-9 text-slate-600">{body}</p>
    </div>
  )
}

export function BasescanLink({ href, label = 'Lihat di Basescan' }: { href: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800">
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  )
}

export function PublicElectionBackLink({ href = '/pemilihan', label = 'Kembali ke daftar pemilihan' }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 transition-colors hover:text-slate-900">
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  )
}
