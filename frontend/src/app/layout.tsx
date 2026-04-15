import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'VoteChain MVP',
  description: 'MVP e-voting commit-reveal untuk skripsi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white">
          <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-6">
            <Link href="/beranda" className="text-[15px] font-semibold text-slate-900">
              VoteChain
            </Link>
            <span className="rounded-md border border-slate-200 px-3 py-1.5 font-mono text-xs text-slate-600">
              Wallet belum terhubung
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
