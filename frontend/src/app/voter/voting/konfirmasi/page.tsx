import Link from 'next/link'
import { CalendarDays, Fingerprint, Info, Lock, Shield } from 'lucide-react'

import { VoterFooterMeta } from '@/components/voter/VoterFooterMeta'
import { VoterPhaseProgress } from '@/components/voter/VoterPhaseProgress'
import { VoterShell } from '@/components/voter/VoterShell'

export default function VoterKonfirmasiPage() {
  return (
    <VoterShell active="beranda">
      <section className="space-y-10">
        <VoterPhaseProgress activeStep={2} />

        <div>
          <p className="font-label inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-800">
            <Lock className="h-4 w-4" /> Konfirmasi Pilihan
          </p>
          <h1 className="mt-4 text-6xl font-semibold leading-tight text-slate-900">Tinjau Suara Anda</h1>
          <p className="mt-4 max-w-4xl text-2xl leading-relaxed text-slate-600">
            Pastikan pilihan Anda sudah benar. Setelah dikonfirmasi, suara Anda akan dienkripsi secara permanen dan dikirim ke jaringan blockchain.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
          <article className="rounded-[30px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
              <div>
                <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Kandidat Terpilih</p>
                <h2 className="mt-2 text-6xl font-semibold leading-tight text-slate-900">Dr. Aris Setiawan</h2>
                <p className="mt-2 text-2xl text-slate-600">Visi Indonesia Digital 2045</p>
              </div>

              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,_#374151_0%,_#111827_70%)] text-white">
                Kandidat
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-5 py-4">
                <span className="inline-flex items-center gap-3 text-base font-semibold text-slate-800">
                  <Fingerprint className="h-5 w-5" /> ID Pemilih
                </span>
                <span className="font-mono text-lg text-slate-700">VOTER-SHA-9921-X</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-5 py-4">
                <span className="inline-flex items-center gap-3 text-base font-semibold text-slate-800">
                  <CalendarDays className="h-5 w-5" /> Waktu Transaksi
                </span>
                <span className="font-mono text-lg text-slate-700">14 Okt 2023, 14:22 WIB</span>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] bg-gradient-to-b from-[#131B2E] to-[#0F172A] p-8 text-white">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-5xl font-semibold">Protokol Enkripsi</h3>
            <p className="mt-4 text-2xl leading-relaxed text-slate-300">
              Suara Anda akan dienkripsi secara lokal sebelum dikirim ke blockchain menggunakan algoritma AES-256.
            </p>

            <p className="mt-10 inline-flex items-center gap-2 text-emerald-300">
              <span className="h-3 w-3 rounded-full bg-emerald-400" /> NODE AKTIF
            </p>
            <p className="mt-2 font-mono text-base text-slate-400">SH256: 8f2a...c0de</p>
          </article>
        </div>

        <article className="rounded-[30px] border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-4 text-slate-700">
            <Info className="mt-1 h-6 w-6" />
            <div>
              <p className="text-3xl font-semibold text-slate-900">Pernyataan Privasi</p>
              <p className="mt-2 text-xl leading-relaxed">
                Sesuai dengan standar keamanan pemilu digital, pilihan Anda tidak dapat dihubungkan kembali ke identitas Anda setelah proses commit selesai. Server pusat tidak pernah melihat pilihan Anda dalam bentuk teks mentah.
              </p>
            </div>
          </div>
        </article>

        <div className="grid gap-4 md:grid-cols-[280px_1fr] md:items-center">
          <button className="h-16 rounded-2xl bg-slate-200 text-2xl font-semibold text-slate-800" type="button">
            Batal & Ubah
          </button>

          <Link
            className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-black via-[#0f1628] to-[#162544] text-2xl font-semibold text-white"
            href="/voter/voting/reveal"
          >
            <Shield className="h-5 w-5" /> Kirim Suara Terenkripsi
          </Link>
        </div>

        <p className="font-label text-center text-sm uppercase tracking-[0.12em] text-slate-500">🔒 End-to-end encrypted selection</p>

        <VoterFooterMeta />
      </section>
    </VoterShell>
  )
}
