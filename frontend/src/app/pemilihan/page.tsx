import { ArrowRight, BarChart3, Download, ExternalLink } from 'lucide-react'
import { PublicPage } from '@/components/public/site-shell'

const activeElections = [
  {
    phase: 'Fase Commit',
    deadline: 'Berakhir dalam 12 jam',
    title: 'Pemilihan Ketua BEM Universitas Teknologi 2024',
    body: 'Pemilihan umum mahasiswa untuk menentukan kepemimpinan Badan Eksekutif Mahasiswa periode 2024/2025.',
    participation: '4,250 Suara',
    hash: '0x8f2a ... 9c3b',
    primary: 'Mulai Memilih',
  },
  {
    phase: 'Fase Reveal',
    deadline: 'Berakhir dalam 2 hari',
    title: 'Voting Proposal Desentralisasi Jaringan',
    body: 'Pengambilan keputusan teknis terkait pembaruan protokol konsensus jaringan utama.',
    participation: '12,400 Node',
    hash: '0x1d9f ... 4a2e',
    primary: 'Lihat Statistik',
  },
]

const upcoming = [
  'Pemilihan Pengurus Koperasi Karyawan',
  'Audit Keuangan Tahunan Yayasan',
]

const finished = [
  { month: 'Agustus 2024', title: 'Pemilihan Direksi Baru PT. Inovasi Digital', total: '89,201' },
  { month: 'Juli 2024', title: 'Voting Prioritas Proyek Komunitas Kota', total: '15,430' },
]

export default function PemilihanPage() {
  return (
    <PublicPage activePath="/pemilihan">
      <section className="public-section">
        <div className="public-container">
          <div className="max-w-[860px]">
            <h1 className="text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] text-slate-900 md:text-[64px]">Daftar Pemilihan Publik</h1>
            <p className="mt-5 text-[18px] leading-9 text-slate-600">
              Pantau seluruh agenda pemilihan, status blockchain, dan hasil akhir secara transparan. Semua data tersimpan permanen di jaringan terdesentralisasi.
            </p>
          </div>

          <section className="mt-14">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 rounded-full bg-slate-900" />
              <h2 className="text-[24px] font-semibold text-slate-900">Sedang Berlangsung</h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">2 Aktif</span>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              {activeElections.map((item, index) => (
                <article key={item.title} className="public-card overflow-hidden p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-blue-700">{item.phase}</span>
                    <span className="text-[11px] uppercase tracking-[0.06em] text-slate-500">{item.deadline}</span>
                  </div>
                  <h3 className="mt-8 max-w-[560px] text-[24px] font-semibold leading-tight text-slate-900">{item.title}</h3>
                  <p className="mt-4 max-w-[560px] text-[16px] leading-8 text-slate-600">{item.body}</p>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-100 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Partisipasi</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">{item.participation}</p>
                    </div>
                    <div className="rounded-xl bg-slate-100 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">{index === 0 ? 'Hash Terbaru' : 'Smart Contract'}</p>
                      <p className="mt-2 font-mono text-[13px] text-slate-700">{item.hash}</p>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <a href={index === 0 ? '/pemilihan/ketua-bem-2024/hasil' : '#'} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-5 text-[14px] font-medium text-white hover:bg-[#1E293B]">
                      {item.primary}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <a href={index === 0 ? '/pemilihan/ketua-bem-2024/hasil' : '#'} className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
                      Detail
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 rounded-full bg-slate-500" />
              <h2 className="text-[24px] font-semibold text-slate-900">Akan Datang</h2>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-[repeat(2,minmax(0,490px))]">
              {upcoming.map((item) => (
                <article key={item} className="public-card p-7">
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-700">Menunggu</span>
                  <h3 className="mt-8 max-w-[20ch] text-[24px] font-semibold leading-tight text-slate-900">{item}</h3>
                  <p className="mt-4 text-[16px] text-slate-500">Jadwal: 15 Okt 2024 - 17 Okt 2024</p>
                  <a href="#" className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                    Lihat Detail
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-14">
            <div className="flex items-center gap-4">
              <div className="h-6 w-1 rounded-full bg-slate-500" />
              <h2 className="text-[24px] font-semibold text-slate-900">Selesai</h2>
            </div>
            <div className="mt-8 space-y-4">
              {finished.map((item) => (
                <article key={item.title} className="public-flat-card flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-emerald-700">Selesai</span>
                      <span className="text-[11px] uppercase tracking-[0.06em] text-slate-400">{item.month}</span>
                    </div>
                    <h3 className="mt-5 text-[24px] font-semibold text-slate-900">{item.title}</h3>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total suara</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">{item.total}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <a href="/pemilihan/ketua-bem-2024/hasil" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-50">Detail Hasil</a>
                      <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-900 hover:bg-slate-50">
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </PublicPage>
  )
}
