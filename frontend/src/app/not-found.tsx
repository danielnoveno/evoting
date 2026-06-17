import Link from 'next/link'
import { PublicPage } from '@/components/public/site-shell'
import { SearchX, ArrowLeft, Home, Vote, BookOpen } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <PublicPage activePath="/">
      <section className="public-section flex items-center justify-center">
        <div className="public-container flex flex-col items-center text-center">
          {/* 404 Number */}
          <div className="relative">
            <span className="text-[120px] font-semibold leading-none tracking-[-0.06em] text-slate-100 select-none md:text-[180px]">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white md:h-20 md:w-20">
                <SearchX className="h-8 w-8 text-slate-400 md:h-10 md:w-10" />
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="mt-6 text-[24px] font-semibold text-slate-900 md:text-[28px]">
            Halaman Tidak Ditemukan
          </h1>
          <p className="mt-3 max-w-[400px] text-[14px] leading-7 text-slate-500 md:text-[15px]">
            Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
            Silakan kembali ke halaman utama untuk melanjutkan.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-[14px] font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
            <Link
              href="/pemilihan"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-[14px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Vote className="h-4 w-4" />
              Lihat Pemilihan
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12 flex flex-col items-center gap-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">
              Tautan Lainnya
            </p>
            <div className="flex items-center gap-4 text-[13px] text-slate-500">
              <Link href="/cara-kerja" className="flex items-center gap-1.5 transition-colors hover:text-slate-900">
                <BookOpen className="h-3.5 w-3.5" />
                Cara Kerja
              </Link>
              <span className="text-slate-300">·</span>
              <Link href="/hubungkan-dompet" className="flex items-center gap-1.5 transition-colors hover:text-slate-900">
                Hubungkan Dompet
              </Link>
              <span className="text-slate-300">·</span>
              <Link href="/kebijakan-privasi" className="flex items-center gap-1.5 transition-colors hover:text-slate-900">
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}
