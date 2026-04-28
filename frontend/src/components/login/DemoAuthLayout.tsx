import Link from 'next/link'
import { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

import { BrandLogo } from '@/components/layout/BrandLogo'

interface DemoAuthLayoutProps {
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
}

export function DemoAuthLayout({ title, description, icon, children }: DemoAuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-slate-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-slate-200/30 blur-3xl" />

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between">
          <Link
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            href="/login"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Kembali
          </Link>

          <BrandLogo className="h-8" />
        </div>

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
            {icon}
          </div>

          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        </div>

        {children}
      </section>
    </main>
  )
}
