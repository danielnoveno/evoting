import { ArrowRight, Globe, LockKeyhole, SquarePen, Zap } from 'lucide-react'
import Link from 'next/link'
import { PublicPage } from '@/components/public/site-shell'
import { sharedDummyContext } from '@/lib/dummy-shared-context'

const auditItems = [
  { hash: '0x7a2...4f9e', label: 'Suara Terverifikasi', time: 'Baru saja' },
  { hash: '0x3b1...8d2c', label: 'Suara Terverifikasi', time: '12d lalu' },
  { hash: '0x9f4...1a5b', label: 'Suara Terverifikasi', time: '45d lalu' },
]

export default function HomePage() {
  return (
    <PublicPage activePath="/">
      <section className="public-section">
        <div className="public-container grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16">
          <div className="max-w-[760px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
              E-Voting berbasis blockchain
            </span>

            <h1 className="mt-8 text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] text-slate-900 md:text-[64px] lg:text-[72px]">
              Tata kelola pemilihan yang lebih bermartabat.
            </h1>

            <p className="mt-8 max-w-[720px] text-[18px] leading-9 text-slate-600">
              Keamanan kelas institusi bertemu dengan transparansi yang dapat diaudit. Platform e-voting ini
              mengubah kepercayaan abstrak menjadi jejak kriptografis yang tercatat permanen untuk konteks
              organisasi mahasiswa seperti {sharedDummyContext.organizationShort}.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href={`/pemilih/pemilihan/${sharedDummyContext.electionId}/commit`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-6 text-[14px] font-medium text-white hover:bg-[#1E293B]">
                Mulai Memilih
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/cara-kerja" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-6 text-[14px] font-medium text-slate-900 hover:bg-white">
                Pelajari Lebih Lanjut
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-none">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Live audit log</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Sinkron
              </span>
            </div>

            <div className="mt-8 space-y-3">
              {auditItems.map((item) => (
                <div key={item.hash} className="rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3 text-[12px]">
                    <div>
                      <p className="font-mono text-slate-600">{item.hash}</p>
                      <p className="mt-1 text-slate-500">{item.label}</p>
                    </div>
                    <span className="text-slate-400">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-24 border-t border-slate-100 pt-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.06em] text-slate-400">Total suara</p>
                  <p className="mt-1 text-[40px] font-semibold tracking-[-0.03em] text-slate-900">142,893</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 py-12 md:py-16 lg:py-20">
        <div className="public-container">
          <div className="max-w-[680px]">
            <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-slate-900 md:text-[40px]">Infrastruktur Kepercayaan</h2>
            <p className="mt-4 text-[18px] leading-9 text-slate-600">
              Dibangun di atas protokol terdesentralisasi, menjamin setiap suara dihitung dan dapat diaudit oleh publik tanpa mengorbankan privasi pemilih.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
            <article className="public-flat-card p-7 lg:col-span-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h3 className="mt-8 text-[24px] font-semibold text-slate-900">Enkripsi End-to-End</h3>
              <p className="mt-4 max-w-[820px] text-[16px] leading-8 text-slate-600">
                Identitas pemilih dipisahkan dari pilihan suara menggunakan mekanisme commit-reveal. Suara Anda sepenuhnya rahasia, namun secara matematis dapat dibuktikan keabsahannya.
              </p>
            </article>

            <article className="public-card p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-900">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="mt-8 text-[24px] font-semibold text-slate-900">Audit Buku Besar Publik</h3>
              <p className="mt-4 text-[16px] leading-8 text-slate-600">
                Setiap transaksi dicatat secara permanen di blockchain, memungkinkan siapa saja untuk memverifikasi integritas pemilihan secara independen.
              </p>
            </article>

            <article className="public-card p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-900">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mt-8 text-[24px] font-semibold text-slate-900">Verifikasi Real-time</h3>
              <p className="mt-4 text-[16px] leading-8 text-slate-600">
                Pantau aliran suara dan hasil sementara secara instan. Tidak ada lagi kotak hitam dalam proses penghitungan.
              </p>
            </article>

            <article className="rounded-[28px] bg-[#161b33] p-7 text-white lg:col-span-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <SquarePen className="h-5 w-5" />
              </div>
              <h3 className="mt-8 text-[24px] font-semibold">UX Sederhana, Teknologi Kompleks</h3>
              <p className="mt-4 max-w-[720px] text-[16px] leading-8 text-slate-300">
                Kami menyembunyikan kompleksitas blockchain di balik antarmuka yang intuitif. Memilih semudah mengirim pesan, dapat diakses oleh siapa saja tanpa pengetahuan teknis.
              </p>
              <Link href="/cara-kerja" className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium text-white hover:text-slate-200">
                Coba Demo UX
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}
