import Link from 'next/link'
import { ArrowRight, Globe, Hand, Lock, ReceiptText, Zap } from 'lucide-react'

import { PublicShell } from '@/components/layout/PublicShell'

const logs = [
  { hash: '0x7a2...4f9e', time: 'Baru saja', muted: false },
  { hash: '0x3b1...8d2c', time: '12d lalu', muted: false },
  { hash: '0x9f4...1a5b', time: '45d lalu', muted: true },
]

export default function LandingPage() {
  return (
    <PublicShell mainClassName="py-10 text-[#191c1e] antialiased">
        <section className="flex flex-col items-center gap-16 py-20 lg:flex-row lg:py-32">
          <div className="space-y-8 lg:w-1/2">
            <div className="font-label inline-flex items-center gap-2 rounded-full bg-[#f2f4f6] px-3 py-1.5 text-sm uppercase tracking-wider text-[#45464d]">
              <span className="h-2 w-2 rounded-full bg-black" />
              E-Voting Berbasis Blockchain
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-[#191c1e] lg:text-7xl">
              Governance, <br />
              <span className="text-gradient">Dignified.</span>
            </h1>

            <p className="max-w-lg text-xl leading-relaxed text-[#45464d]">
              Keamanan kelas institusi bertemu dengan transparansi absolut. Platform e-voting yang mengubah kepercayaan
              abstrak menjadi data kriptografis yang tak dapat diubah.
            </p>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Link
                className="btn-gradient flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-medium transition-opacity hover:opacity-90"
                href="/login"
              >
                Mulai Memilih
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="rounded-xl bg-[#e6e8ea] px-8 py-4 text-lg font-medium text-[#191c1e] transition-colors hover:bg-[#eceef0]"
                href="/cara-kerja"
              >
                Pelajari Lebih Lanjut
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-lg lg:w-1/2">
            <div className="absolute inset-0 scale-105 rotate-3 rounded-[2rem] bg-[#f2f4f6] transition-transform duration-500 hover:rotate-6" />

            <div className="ambient-shadow absolute inset-0 flex flex-col justify-between rounded-[2rem] bg-white p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-label text-sm uppercase tracking-widest text-[#45464d]">Live Audit Log</span>
                  <span className="flex items-center gap-1 rounded-sm bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                    Sinkron
                  </span>
                </div>

                <div className="space-y-3 pt-4">
                  {logs.map((log) => (
                    <div
                      className={`relative flex items-center gap-4 overflow-hidden rounded-lg bg-[#f2f4f6] p-3 ${
                        log.muted ? 'opacity-60' : ''
                      }`}
                      key={log.hash}
                    >
                      <div className={`absolute bottom-0 left-0 top-0 w-1 ${log.muted ? 'bg-[#c6c6cd]' : 'bg-black'}`} />
                      <ReceiptText className="h-[18px] w-[18px] text-[#45464d]" />
                      <div className="flex-1">
                        <div className="font-mono text-xs text-[#191c1e]">{log.hash}</div>
                        <div className="text-[10px] text-[#45464d]">Suara Terverifikasi</div>
                      </div>
                      <span className="text-[10px] text-[#45464d]">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#e0e3e5] pt-6">
                <div className="flex items-center justify-between">
                  <div className="font-label text-sm uppercase text-[#45464d]">Total Suara</div>
                  <div className="text-2xl font-bold tracking-tight text-[#191c1e]">142,893</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[#e0e3e5] py-24">
          <div className="mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#191c1e]">Infrastruktur Kepercayaan</h2>
            <p className="mt-2 max-w-2xl text-[#45464d]">
              Dibangun di atas protokol terdesentralisasi, menjamin setiap suara dihitung dan dapat diaudit oleh publik
              tanpa mengorbankan privasi pemilih.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="group flex flex-col justify-between rounded-2xl bg-[#f2f4f6] p-8 transition-colors hover:bg-[#eceef0] md:col-span-2">
              <div className="ambient-shadow mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                <Lock className="h-5 w-5 text-black" />
              </div>
              <div>
                <h3 className="mb-3 text-xl font-bold">Enkripsi End-to-End</h3>
                <p className="leading-relaxed text-[#45464d]">
                  Identitas pemilih dipisahkan dari pilihan suara menggunakan kriptografi zero-knowledge proof. Suara Anda
                  sepenuhnya rahasia, namun secara matematis dapat dibuktikan keabsahannya.
                </p>
              </div>
            </div>

            <div className="ambient-shadow flex flex-col justify-between rounded-2xl bg-white p-8">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2f4f6]">
                <Globe className="h-5 w-5 text-black" />
              </div>
              <div>
                <h3 className="mb-3 text-xl font-bold">Audit Buku Besar Publik</h3>
                <p className="text-sm leading-relaxed text-[#45464d]">
                  Setiap transaksi dicatat secara permanen di blockchain, memungkinkan siapa saja untuk memverifikasi
                  integritas pemilihan secara independen.
                </p>
              </div>
            </div>

            <div className="ambient-shadow flex flex-col justify-between rounded-2xl bg-white p-8">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2f4f6]">
                <Zap className="h-5 w-5 text-black" />
              </div>
              <div>
                <h3 className="mb-3 text-xl font-bold">Verifikasi Real-time</h3>
                <p className="text-sm leading-relaxed text-[#45464d]">
                  Pantau aliran suara dan hasil sementara secara instan. Tidak ada lagi kotak hitam dalam proses
                  penghitungan.
                </p>
              </div>
            </div>

            <div className="relative flex items-center justify-between overflow-hidden rounded-2xl bg-[#131b2e] p-8 text-white md:col-span-2">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),transparent_60%)]" />
              <div className="relative z-10 max-w-md">
                <h3 className="mb-3 text-2xl font-bold">UX Sederhana, Teknologi Kompleks</h3>
                <p className="mb-6 text-sm leading-relaxed text-[#c6cfdf]">
                  Kami menyembunyikan kompleksitas blockchain di balik antarmuka yang intuitif. Memilih semudah mengirim
                  pesan, dapat diakses oleh siapa saja tanpa pengetahuan teknis.
                </p>
                <button className="font-label flex items-center gap-2 text-sm font-medium uppercase tracking-wide" type="button">
                  Coba Demo UX
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="relative z-10 hidden h-32 w-32 rotate-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md lg:flex">
                <Hand className="h-10 w-10 text-white/80" />
              </div>
            </div>
          </div>
        </section>
    </PublicShell>
  )
}
