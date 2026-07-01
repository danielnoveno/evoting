'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Clock, ArrowLeft } from 'lucide-react'
import { PublicNavbar, PublicFooter } from '@/components/public/site-shell'
import Link from 'next/link'

function SesiBerakhirContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/pemilih'
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const handleMasukUlang = () => {
    // ponytail: langsung ke halaman login sesuai role — tidak perlu ?reason=session-timeout
    if (redirect.startsWith('/superadmin') || redirect.startsWith('/portal-admin')) {
      router.push('/portal-admin')
    } else if (redirect.startsWith('/admin')) {
      router.push('/hubungkan-dompet?activate=admin')
    } else {
      router.push('/hubungkan-dompet')
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PublicNavbar activePath="/sesi-berakhir" minimal />

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px] rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>

          <h1 className="mt-6 text-[24px] font-semibold text-slate-900">
            Sesi Telah Berakhir
          </h1>

          <p className="mt-3 text-[14px] leading-7 text-slate-500">
            Sesi Anda telah berakhir atau akses tidak valid demi keamanan. Silakan masuk kembali untuk melanjutkan pengelolaan platform.
          </p>

          <button
            type="button"
            onClick={handleMasukUlang}
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0F172A] px-6 text-[14px] font-semibold text-white transition hover:bg-[#1E293B]"
          >
            Masuk Ulang
          </button>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-400 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </main>
  )
}

export default function SesiBerakhirPage() {
  return (
    <Suspense fallback={null}>
      <SesiBerakhirContent />
    </Suspense>
  )
}
