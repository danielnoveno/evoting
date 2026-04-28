import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

import { PublicShell } from '@/components/layout/PublicShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function SuperadminBerandaPage() {
  return (
    <PublicShell mainClassName="py-10">
      <section className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          Demo Superadmin
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Dashboard Superadmin (Demo)</h1>
        <p className="mt-2 text-sm text-slate-600">
          Halaman ini disediakan untuk demo alur login. Dari sini kamu bisa lanjut ke area pemantauan atau manajemen.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-900">Manajemen Pemilihan</h2>
          <p className="mt-1 text-sm text-slate-600">Pantau semua ruang voting dan lakukan moderasi jika dibutuhkan.</p>
          <Link className="mt-4 inline-block" href="/pemilihan">
            <Button variant="secondary">Buka Daftar Pemilihan</Button>
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-slate-900">Masuk sebagai Admin</h2>
          <p className="mt-1 text-sm text-slate-600">Lanjutkan ke beranda admin untuk akses menu utama operasional.</p>
          <Link className="mt-4 inline-block" href="/admin/beranda">
            <Button variant="primary">Ke Beranda Admin</Button>
          </Link>
        </Card>
      </section>
    </PublicShell>
  )
}
