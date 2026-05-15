import { ArrowLeft, Bell, CopyCheck, ExternalLink, Menu } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

const navItems = [
  { href: '/', label: 'Beranda' },
  { href: '/cara-kerja', label: 'Cara Kerja' },
  { href: '/pemilihan', label: 'Pemilihan' },
]

export function PublicNavbar({ activePath }: { activePath: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
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
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50 md:inline-flex"
            aria-label="Buka shortcut audit"
          >
            <CopyCheck className="h-4 w-4" />
          </button>
          <button
            type="button"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
            aria-label="Menu navigasi"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-slate-50/95 py-4 backdrop-blur-sm">
      <div className="public-container flex flex-col gap-3 text-[11px] uppercase tracking-[0.06em] text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© 2026 E-Voting Indonesia · Keamanan Tingkat Tinggi</p>
        <div className="flex items-center gap-4">
          <Link href="/kebijakan-privasi" className="hover:text-slate-600">Kebijakan Privasi</Link>
          <Link href="/ketentuan-layanan" className="hover:text-slate-600">Ketentuan Layanan</Link>
        </div>
      </div>
    </footer>
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
