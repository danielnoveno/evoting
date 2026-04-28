import { Database, Lock, ShieldCheck, TriangleAlert } from 'lucide-react'

import { VoterFooterMeta } from '@/components/voter/VoterFooterMeta'
import { VoterPhaseProgress } from '@/components/voter/VoterPhaseProgress'
import { VoterShell } from '@/components/voter/VoterShell'

export default function VoterRevealPage() {
  return (
    <VoterShell active="beranda">
      <section className="space-y-10">
        <VoterPhaseProgress activeStep={3} />

        <article className="rounded-[32px] bg-white p-10 shadow-sm ring-1 ring-slate-200">
          <p className="font-label inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-800">
            <Lock className="h-4 w-4" /> Keamanan Blockchain Aktif
          </p>

          <h1 className="mt-6 text-6xl font-semibold leading-tight text-slate-900">Buka Kunci Suara Anda (Reveal Phase)</h1>
          <p className="mt-5 max-w-5xl text-2xl leading-relaxed text-slate-600">
            Anda telah memberikan suara terenkripsi sebelumnya. Sekarang, masukkan kode rahasia (Secret Salt) yang Anda simpan saat memberikan suara untuk memvalidasi pilihan Anda di jaringan blockchain.
          </p>

          <div className="mt-9">
            <label className="font-label block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600" htmlFor="salt-input">
              Secret Salt
            </label>
            <div className="mt-3 flex h-24 items-center gap-4 rounded-3xl bg-slate-200 px-6 text-slate-500">
              <Lock className="h-8 w-8" />
              <input
                className="w-full bg-transparent text-2xl tracking-[0.2em] text-slate-700 placeholder:text-slate-400 focus:outline-none"
                defaultValue="••••••••••••••••"
                id="salt-input"
                placeholder="Masukkan secret salt"
                type="password"
              />
            </div>
          </div>

          <div className="mt-8 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-5">
            <p className="flex items-start gap-3 text-xl font-semibold text-slate-800">
              <TriangleAlert className="mt-1 h-6 w-6 text-amber-500" />
              Perhatian: Tanpa proses Reveal, suara Anda tidak akan dihitung oleh sistem. Pastikan kode yang Anda masukkan sama persis dengan yang diberikan saat fase pertama.
            </p>
          </div>

          <div className="mt-9 flex flex-wrap gap-4">
            <button className="h-16 rounded-2xl bg-gradient-to-r from-black via-[#0f1628] to-[#162544] px-10 text-2xl font-semibold text-white" type="button">
              Buka Suara Sekarang
            </button>
            <button className="h-16 rounded-2xl bg-transparent px-10 text-2xl font-semibold text-slate-800" type="button">
              Batal
            </button>
          </div>
        </article>

        <div className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-[26px] border border-slate-200 bg-white p-6">
            <p className="font-label inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
              <Database className="h-4 w-4" /> Hash Commitment
            </p>
            <p className="mt-4 break-all font-mono text-xl text-slate-500">
              0x82f1b8a9d0c2e3f4g5h6i7j8k910m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8
            </p>
          </article>

          <article className="rounded-[26px] border border-slate-200 bg-white p-6">
            <p className="font-label inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
              <ShieldCheck className="h-4 w-4" /> Status Validasi
            </p>
            <p className="mt-4 text-4xl font-semibold text-blue-600">● Menunggu Dekripsi Suara</p>
          </article>
        </div>

        <VoterFooterMeta />
      </section>
    </VoterShell>
  )
}
