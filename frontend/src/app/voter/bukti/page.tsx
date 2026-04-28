import Link from 'next/link'
import { ArrowRight, CheckCircle2, Download, ExternalLink, QrCode, ShieldCheck } from 'lucide-react'

import { VoterFooterMeta } from '@/components/voter/VoterFooterMeta'
import { VoterShell } from '@/components/voter/VoterShell'
import { quickProofHistory } from '@/lib/voter-proof-data'

export default function VoterBuktiPage() {
  return (
    <VoterShell active="bukti">
      <section className="space-y-10">
        <div>
          <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Arsip Digital</p>
          <h1 className="mt-3 text-6xl font-semibold leading-tight text-slate-900">Bukti Saya</h1>
          <p className="mt-3 max-w-4xl text-2xl leading-relaxed text-slate-600">
            Setiap suara yang Anda berikan dicatat secara permanen di blockchain. Di bawah ini adalah riwayat partisipasi pemilihan Anda beserta bukti kriptografinya.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
          <article className="rounded-[30px] bg-gradient-to-b from-[#131B2E] to-[#0F172A] p-8 text-white">
            <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Total Partisipasi</p>
            <p className="mt-2 text-8xl font-semibold">04</p>
            <p className="mt-4 text-2xl leading-relaxed text-slate-300">Pemilihan yang telah Anda ikuti sejak bergabung.</p>
          </article>

          <div className="space-y-4">
            {quickProofHistory.map((item) => (
              <article className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200" key={item.id}>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-lg text-slate-500">
                      {item.date} <span className="ml-3 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">{item.status}</span>
                    </p>
                  </div>
                </div>

                <Link
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-6 py-3 text-lg font-semibold text-slate-800"
                  href={`/voter/bukti/${item.id}`}
                >
                  Lihat Bukti <ArrowRight className="h-5 w-5" />
                </Link>
              </article>
            ))}

            <article className="rounded-[30px] border-l-4 border-black bg-white p-7 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-label inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                    <CheckCircle2 className="h-4 w-4" /> Terkonfirmasi On-Chain
                  </p>
                  <h3 className="mt-3 text-5xl font-semibold leading-tight text-slate-900">Pemilihan Anggota Senat Universitas</h3>
                  <p className="mt-2 text-2xl text-slate-600">Dilaksanakan pada 15 Januari 2024 • 09:42 WIB</p>
                </div>

                <button className="inline-flex h-16 items-center gap-2 rounded-2xl bg-gradient-to-r from-black via-[#0f1628] to-[#162544] px-7 text-xl font-semibold text-white" type="button">
                  <Download className="h-5 w-5" /> Unduh Sertifikat
                </button>
              </div>

              <div className="rounded-3xl bg-slate-100 p-6">
                <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Blockchain Transaction Hash</p>
                <div className="mt-3 rounded-2xl bg-white px-5 py-4">
                  <p className="break-all font-mono text-xl text-slate-700">0x7f8832a886b84518a996f01119b9109012f2c8d23467e7c8</p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="font-label text-xs uppercase tracking-[0.12em] text-slate-500">Blok</p>
                    <p className="mt-1 text-4xl font-semibold text-slate-900">#18,442,109</p>
                  </div>
                  <div>
                    <p className="font-label text-xs uppercase tracking-[0.12em] text-slate-500">Status</p>
                    <p className="mt-1 text-4xl font-semibold text-emerald-600">Confirmed</p>
                  </div>
                  <div>
                    <p className="font-label text-xs uppercase tracking-[0.12em] text-slate-500">Gas Used</p>
                    <p className="mt-1 text-4xl font-semibold text-slate-900">21,000</p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <article className="rounded-[30px] bg-[#F2F4F6] p-8">
            <h3 className="text-5xl font-semibold text-slate-900">Bagaimana cara verifikasi?</h3>
            <p className="mt-4 max-w-4xl text-2xl leading-relaxed text-slate-700">
              Setiap bukti suara berisi tanda tangan digital unik yang hanya diketahui oleh Anda dan sistem blockchain. Anda dapat memverifikasi keabsahan suara Anda secara independen menggunakan penjelajah blockchain (Block Explorer) publik.
            </p>

            <ol className="mt-8 space-y-5">
              {[
                'Salin Transaction Hash (TxHash) dari kartu bukti di atas.',
                'Gunakan Portal Verifikasi Independen untuk mencari hash tersebut.',
                "Pastikan status transaksi menunjukkan 'Success' dan data sesuai.",
              ].map((item, index) => (
                <li className="flex items-start gap-3 text-2xl text-slate-800" key={item}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#131B2E] text-base font-semibold text-white">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-[30px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="flex h-48 items-center justify-center rounded-3xl bg-slate-100 text-slate-700">
              <QrCode className="h-24 w-24" />
            </div>
            <p className="font-label mt-5 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Pindai Verifikasi Cepat</p>
            <p className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-center font-mono text-lg text-slate-700">VERIFY-ID: EV-2024-X921</p>
            <a className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-6 py-4 text-lg font-semibold text-slate-800" href="https://sepolia.basescan.org" rel="noreferrer" target="_blank">
              Buka Basescan <ExternalLink className="h-5 w-5" />
            </a>
          </article>
        </div>

        <VoterFooterMeta />
      </section>
    </VoterShell>
  )
}
