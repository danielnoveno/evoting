import Link from 'next/link'
import { ArrowUpRight, BadgeCheck, Eye, Lock, UserPlus } from 'lucide-react'

import { PublicShell } from '@/components/layout/PublicShell'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const steps = [
  {
    title: '1. Registrasi (Whitelist)',
    description:
      'Admin mendaftarkan wallet pemilih yang berhak. Hanya wallet terdaftar yang bisa mengikuti proses voting.',
    proofLabel: 'Status Identitas',
    proofValue: 'Diverifikasi & terenkripsi',
    icon: UserPlus,
  },
  {
    title: '2. Fase Commit',
    description:
      'Pemilih memilih kandidat, lalu sistem mengunci pilihan dalam hash agar isi suara tetap rahasia selama fase commit.',
    proofLabel: 'Contoh Hash',
    proofValue: '0x7a3b...9f2c (Terkunci)',
    icon: Lock,
  },
  {
    title: '3. Fase Reveal',
    description:
      'Saat reveal dibuka, pemilih mengirim data konfirmasi. Kontrak memverifikasi kecocokan commit dan reveal secara otomatis.',
    proofLabel: 'Validasi Kontrak',
    proofValue: 'Pencocokan berjalan otomatis',
    icon: Eye,
  },
  {
    title: '4. Finalisasi Hasil',
    description:
      'Setelah fase ended, hasil dipublikasikan dan jejak transaksi dapat diaudit publik melalui Basescan.',
    proofLabel: 'Audit Publik',
    proofValue: 'Hasil final siap diverifikasi',
    icon: BadgeCheck,
  },
]

export default function CaraKerjaPage() {
  return (
    <PublicShell mainClassName="py-10">
        <section className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Transparansi dalam Setiap Suara</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Pelajari bagaimana sistem menjaga keamanan pilihanmu dengan alur yang jelas: Registration → Commit → Reveal →
            Ended. Semua tahapan punya jejak audit yang bisa diperiksa publik.
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <Card className="p-6" key={step.title}>
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-900">
                <step.icon className="h-5 w-5" />
              </div>
              <h2 className="text-[15px] font-semibold text-slate-900">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{step.proofLabel}</p>
                <p className="mt-1 text-xs text-slate-600">{step.proofValue}</p>
              </div>
            </Card>
          ))}
        </section>

        <section className="mt-8">
          <div className="rounded-xl border border-[#0F172A] bg-[#0F172A] p-6 text-white md:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_280px] md:items-center">
              <div>
                <h2 className="text-xl font-semibold">Bukti Transparansi</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">
                  Semua proses terekam di jaringan publik. Kamu bisa memeriksa status kontrak dan transaksi untuk memastikan
                  voting berjalan sesuai aturan.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a href="https://sepolia.basescan.org" rel="noreferrer" target="_blank">
                    <Button variant="secondary">
                      Eksplorasi Basescan <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </a>
                  <Link href="/pemilihan">
                    <Button className="text-white hover:bg-[#1E293B] hover:text-white" variant="ghost">
                      Lihat Daftar Pemilihan
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-white/20 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">Status Kontrak</p>
                <div className="mt-2 flex items-center gap-2 text-sm text-white">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Aktif & terverifikasi
                </div>
                <p className="mt-3 break-all font-mono text-xs text-slate-300">0x8f2A...c91E</p>
              </div>
            </div>
          </div>
        </section>
    </PublicShell>
  )
}
