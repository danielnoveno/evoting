import Link from 'next/link'
import { ArrowRight, CheckCircle2, CircleDot, Clock3, ExternalLink, Shield, Sparkles } from 'lucide-react'

import { VoterFooterMeta } from '@/components/voter/VoterFooterMeta'
import { VoterShell } from '@/components/voter/VoterShell'

const recentLogs = [
  { title: 'Commit berhasil dicatat', tx: '0x9f8...2a1e', block: '18,294,201', status: 'Selesai', time: '2 menit lalu' },
  { title: 'Fase reveal dimulai', tx: '0x4d2...9c4f', block: '18,294,198', status: 'Berlangsung', time: '8 menit lalu' },
]

export default function VoterBerandaPage() {
  return (
    <VoterShell active="beranda">
      <section className="space-y-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-label text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Dashboard Pemilih</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">Selamat Datang, Aditya.</h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
              Sistem pemilihan berbasis blockchain yang menjamin imutabilitas dan transparansi suara Anda secara real-time.
            </p>
          </div>

          <div className="rounded-[28px] bg-white px-8 py-7 shadow-sm ring-1 ring-slate-200">
            <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status Jaringan</p>
            <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-emerald-600">
              <CircleDot className="h-5 w-5" /> Mainnet Aktif
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
          <article className="rounded-[30px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-label rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Pemilihan Aktif
              </p>
              <p className="rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">Fase Reveal</p>
            </div>

            <h2 className="mt-5 text-4xl font-semibold leading-tight text-slate-900">Ketua Umum BEM 2024</h2>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">
              Silakan masukkan kunci privat Anda untuk membuka enkripsi suara yang telah Anda kirimkan sebelumnya.
            </p>

            <div className="mt-8 flex flex-wrap gap-8 border-b border-slate-200 pb-8">
              <div>
                <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Waktu Tersisa</p>
                <p className="mt-1 text-4xl font-semibold text-slate-900">04:12:55</p>
              </div>
              <div>
                <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Total Partisipan</p>
                <p className="mt-1 text-4xl font-semibold text-slate-900">12,842</p>
              </div>
            </div>

            <Link
              className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-black via-[#0f1628] to-[#162544] px-8 py-4 text-lg font-semibold text-white"
              href="/voter/voting/reveal"
            >
              Mulai Reveal Suara <ArrowRight className="h-5 w-5" />
            </Link>
          </article>

          <article className="rounded-[30px] bg-gradient-to-b from-[#131B2E] to-[#0F172A] p-8 text-white shadow-xl">
            <p className="inline-flex rounded-full bg-emerald-500/20 px-4 py-1 text-sm font-semibold text-emerald-300">Fase Commit</p>
            <h3 className="mt-5 text-3xl font-semibold leading-tight">Votasi Anggaran Proyek IT</h3>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">Berikan suara Anda untuk alokasi dana infrastruktur server semester ganjil.</p>

            <div className="mt-8 h-2 rounded-full bg-white/15">
              <div className="h-2 w-[65%] rounded-full bg-emerald-400" />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.08em] text-slate-300">
              <span>Progress</span>
              <span>65% Quorum</span>
            </div>

            <Link className="mt-8 block rounded-2xl bg-white px-6 py-4 text-center text-lg font-semibold text-slate-900" href="/voter/voting/commit">
              Berikan Suara
            </Link>
          </article>
        </div>

        <article className="rounded-[30px] bg-[#F2F4F6] p-8">
          <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h3 className="text-3xl font-semibold text-slate-900">Log Transaksi Blockchain Terkini</h3>
              <p className="mt-1 text-lg text-slate-600">Verifikasi real-time aktivitas smart contract pada ledger publik.</p>
            </div>
            <button className="font-label text-sm font-semibold uppercase tracking-[0.12em] text-slate-900" type="button">
              Eksplorasi Semua
            </button>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4" key={log.title}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{log.title}</p>
                    <p className="font-mono text-sm text-slate-500">
                      Tx: {log.tx} • Block #{log.block}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">{log.status}</span>
                  <span className="font-mono text-slate-500">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
          <article className="rounded-[30px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock3 className="h-7 w-7" />
            </div>
            <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">Menunggu</p>
            <h3 className="mt-4 text-3xl font-semibold text-slate-900">Pemilihan Duta Kampus</h3>
            <p className="mt-2 text-lg leading-relaxed text-slate-600">Pendaftaran kandidat masih dibuka. Voting akan dimulai pada 15 Oktober 2024.</p>
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 text-base">
              <span className="font-label uppercase tracking-[0.12em] text-slate-400">Status</span>
              <span className="font-semibold text-slate-900">Pre-registration</span>
            </div>
          </article>

          <article className="rounded-[30px] bg-[#E6E8EA] p-8">
            <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Partisipasi Anda</p>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-6xl font-semibold text-slate-900">85%</p>
              <p className="text-2xl font-semibold text-emerald-600">+12%</p>
            </div>
            <p className="mt-3 text-lg text-slate-600">Dari total pemilihan yang Anda ikuti tahun ini.</p>

            <div className="mt-8 flex items-center">
              {['A', 'D', 'R'].map((item) => (
                <div
                  className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-50 bg-slate-800 text-xs font-semibold text-white"
                  key={item}
                >
                  {item}
                </div>
              ))}
              <span className="ml-2 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">+2K</span>
            </div>
          </article>

          <article className="rounded-[30px] bg-gradient-to-b from-[#131B2E] to-[#0D162D] p-8 text-white">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-3xl font-semibold">Butuh Bantuan Teknis?</h3>
            <p className="mt-3 text-lg leading-relaxed text-slate-300">
              Panduan langkah-demi-langkah menggunakan wallet dan kunci privat untuk keamanan suara.
            </p>
            <Link className="mt-8 inline-flex items-center gap-2 text-xl font-semibold text-white" href="/voter/bantuan">
              Buka Pusat Bantuan <ExternalLink className="h-5 w-5" />
            </Link>
          </article>
        </div>

        <VoterFooterMeta />
      </section>
    </VoterShell>
  )
}
