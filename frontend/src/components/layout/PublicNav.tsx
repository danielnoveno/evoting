'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet } from 'lucide-react'

import { BrandLogo } from '@/components/layout/BrandLogo'
import { SiteContainer } from '@/components/layout/SiteContainer'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function PublicNav() {
  const pathname = usePathname()

  const items = [
    { label: 'Beranda', href: '/' },
    { label: 'Cara Kerja', href: '/cara-kerja' },
    { label: 'Pemilihan', href: '/pemilihan' },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-slate-50/95 backdrop-blur">
      <SiteContainer className="relative flex h-14 items-center">
        <Link className="shrink-0" href="/">
          <BrandLogo className="h-7" />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-sm text-slate-600 md:flex">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                className={cn(
                  'border-b-2 pb-1 transition-colors',
                  active ? 'border-[#0F172A] font-semibold text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800',
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            aria-label="Status dompet"
            className="hidden h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 md:inline-flex"
            type="button"
          >
            <Wallet className="h-4 w-4" />
          </button>

          <Link href="/login">
            <Button size="sm" variant="primary">
              Mulai Memilih
            </Button>
          </Link>
        </div>
      </SiteContainer>
    </header>
  )
}
