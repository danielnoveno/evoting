import Link from 'next/link'
import {
  ChevronRight,
  Chrome,
  Fingerprint,
  KeyRound,
  Mail,
  ShieldCheck,
  ShieldEllipsis,
  UserRound,
  Wallet,
} from 'lucide-react'

import { BrandLogo } from '@/components/layout/BrandLogo'
import { Button } from '@/components/ui/Button'
import { getDemoRoleDestination } from '@/lib/demo-auth'

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-slate-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-slate-200/30 blur-3xl" />

      <section className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <header className="mb-7 flex justify-center" aria-label="Logo Votein">
          <BrandLogo className="h-10" />
        </header>

        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100">
            <Fingerprint className="h-7 w-7 text-slate-900" />
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">Sambungkan Dompet</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
            Masuk dengan cepat menggunakan Google, email, atau dompet eksternal. Sistem tetap menjaga keamanan
            proses voting tanpa membuat alur terasa rumit.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/login/google">
            <Button className="h-12 rounded-2xl text-sm" fullWidth variant="primary">
              <Chrome className="h-4 w-4" />
              Login dengan Google
            </Button>
          </Link>

          <Link href="/login/email">
            <Button className="h-12 rounded-2xl text-sm" fullWidth variant="secondary">
              <Mail className="h-4 w-4" />
              Login dengan Email
            </Button>
          </Link>

          <div className="my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Atau hubungkan dengan</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Link
            className="flex h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-slate-900 transition-colors hover:bg-slate-100"
            href="/login/metamask"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <Wallet className="h-4 w-4" />
              </span>
              Dompet Eksternal (MetaMask)
            </span>
            <ChevronRight aria-hidden className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            className="flex h-14 w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-slate-900 transition-colors hover:bg-slate-100"
            href="/login/smart-wallet"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <KeyRound className="h-4 w-4" />
              </span>
              Dompet Pintar (Passkey / QR)
            </span>
            <ChevronRight aria-hidden className="h-4 w-4 text-slate-400" />
          </Link>
        </div>

        <div className="mb-6 mt-7 px-1">
          <p className="text-center text-xs leading-relaxed text-slate-500">
            Sistem akan mengenali peran akunmu secara otomatis (pemilih, admin, atau superadmin) setelah dompet
            berhasil terhubung.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600 hover:bg-slate-100"
              href={getDemoRoleDestination('voter')}
            >
              <UserRound className="h-3 w-3" />
              Pemilih
            </Link>
            <Link
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-700 hover:bg-blue-100"
              href={getDemoRoleDestination('admin')}
            >
              <ShieldEllipsis className="h-3 w-3" />
              Admin
            </Link>
            <Link
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-slate-800"
              href={getDemoRoleDestination('superadmin')}
            >
              <ShieldCheck className="h-3 w-3" />
              Superadmin
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-relaxed text-slate-500">
            Dompet kamu dipakai sebagai identitas akun untuk voting. Platform tidak menyimpan private key atau akses
            aset kripto milikmu.
          </p>
        </div>
      </section>

      <p className="sr-only">
        Halaman login disesuaikan dari export Stitch: login_hubungkan_dompet dengan struktur tombol sosial, opsi
        wallet, badge peran, dan panel informasi keamanan.
      </p>
    </main>
  )
}
