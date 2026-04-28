import { ArrowRight, Plus, ShieldCheck } from 'lucide-react'

const modules = [
  'Beranda',
  'Proposal Saya',
  'Manajemen Fase',
  'Kandidat',
  'Whitelist',
  'Monitoring',
  'Hasil',
]

export default function AdminBerandaPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-8">
        <p className="inline-flex rounded-full bg-black px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white">
          Sistem e-voting aman
        </p>
        <div className="mt-4 grid items-center gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-6xl font-semibold leading-tight text-slate-900">Kelola Pemilihan dengan Transparansi Blockchain</h2>
            <p className="mt-3 max-w-3xl text-2xl leading-relaxed text-slate-600">
              Pantau, kelola, dan audit seluruh proses pemilihan secara real-time dalam satu panel admin.
            </p>
            <div className="mt-6 flex gap-3">
              <button className="h-11 rounded-xl bg-[#0F172A] px-5 text-sm font-semibold text-white" type="button">Mulai Memilih</button>
              <button className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900" type="button">Unduh Laporan</button>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="flex h-56 w-56 items-center justify-center rounded-[28px] bg-black text-white">
              <ShieldCheck className="h-20 w-20" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-4xl font-semibold text-slate-900">Manajemen Sistem</h3>
        <p className="mt-1 text-sm text-slate-500">Pilih modul untuk mengelola siklus pemilihan</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5" key={module}>
              <h4 className="text-[22px] font-semibold text-slate-900">{module}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">Kelola data dan proses terkait modul ini secara terpusat.</p>
              <button className="mt-4 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold" type="button">
                Lihat Detail <ArrowRight className="h-3 w-3" />
              </button>
            </article>
          ))}

          <article className="rounded-2xl bg-[#020617] p-5 text-white">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20">
              <Plus className="h-5 w-5" />
            </div>
            <h4 className="mt-4 text-3xl font-semibold">Tambah Pemilihan Baru</h4>
            <p className="mt-2 text-sm text-slate-300">Mulai inisialisasi ruang voting baru untuk organisasi.</p>
            <button className="mt-4 h-10 rounded-xl bg-white px-4 text-xs font-semibold text-slate-900" type="button">Inisialisasi</button>
          </article>
        </div>
      </section>
    </div>
  )
}
