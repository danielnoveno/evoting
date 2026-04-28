import { CheckCircle2, Download, ExternalLink, Info, Shield } from 'lucide-react'

import { VoterFooterMeta } from '@/components/voter/VoterFooterMeta'
import { VoterPhaseProgress } from '@/components/voter/VoterPhaseProgress'
import { VoterShell } from '@/components/voter/VoterShell'

const candidateResults = [
  { name: 'Siti Aminah', votes: '84,120', percentage: '36.6%', width: 'w-[36.6%]' },
  { name: 'Ahmad Fauzi', votes: '21,128', percentage: '9.2%', width: 'w-[9.2%]' },
  { name: 'Nadya Pratiwi', votes: '7,880', percentage: '3.4%', width: 'w-[3.4%]' },
]

export default function VoterResultPage() {
  return (
    <VoterShell active="beranda">
      <section className="space-y-10">
        <VoterPhaseProgress activeStep={4} />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_auto] xl:items-end">
          <div>
            <p className="font-label inline-flex rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
              Laporan Publik
            </p>
            <h1 className="mt-4 text-6xl font-semibold leading-tight text-slate-900">Hasil Akhir & Rekapitulasi Suara</h1>
            <p className="mt-4 max-w-4xl text-2xl leading-relaxed text-slate-600">
              Transparansi penuh hasil pemilihan yang telah divalidasi oleh protokol blockchain secara real-time.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button className="inline-flex h-20 items-center justify-center gap-3 rounded-3xl bg-slate-200 px-8 text-xl font-semibold text-slate-800" type="button">
              <Download className="h-5 w-5" /> Unduh Sertifikat
            </button>
            <a
              className="inline-flex h-20 items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-black via-[#0f1628] to-[#162544] px-8 text-xl font-semibold text-white"
              href="https://sepolia.basescan.org"
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-5 w-5" /> Lihat di Basescan
            </a>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <article className="rounded-[30px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-6 md:grid-cols-[340px_1fr]">
              <div className="rounded-3xl bg-[radial-gradient(circle_at_center,_#4b5563_0%,_#111827_75%)]" />
              <div>
                <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Pemenang Terpilih</p>
                <h2 className="mt-3 text-6xl font-semibold leading-tight text-slate-900">Budi Santoso</h2>
                <p className="mt-2 text-4xl text-slate-600">Partai Maju Bersama (PMB)</p>

                <div className="mt-8 grid grid-cols-2 gap-5 border-t border-slate-200 pt-5">
                  <div>
                    <p className="font-label text-xs uppercase tracking-[0.12em] text-slate-500">Total Suara</p>
                    <p className="mt-1 text-5xl font-semibold text-slate-900">124,502</p>
                  </div>
                  <div>
                    <p className="font-label text-xs uppercase tracking-[0.12em] text-slate-500">Persentase</p>
                    <p className="mt-1 text-5xl font-semibold text-slate-900">54.2%</p>
                  </div>
                </div>

                <p className="mt-8 inline-flex rounded-full bg-emerald-100 px-4 py-1 text-lg font-semibold text-emerald-700">Selesai</p>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] bg-gradient-to-b from-[#131B2E] to-[#0F172A] p-8 text-white">
            <p className="font-label inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
              <Shield className="h-4 w-4" /> Blockchain Audit Trail
            </p>

            <div className="mt-6 space-y-8">
              {[{ title: 'Result Proof Generation', hash: '0x71c7656ec7ab88b098defb751b7401b56d8976f', time: '12/10/2023 - 14:45:01 UTC' }, { title: 'Tally Validation Hash', hash: '0xbc281e0573e35186b198f399f7d49b29cd00fe78', time: '12/10/2023 - 14:30:12 UTC' }].map((item) => (
                <div key={item.title}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-2xl font-semibold">{item.title}</p>
                    <span className="rounded-xl bg-emerald-500/25 px-3 py-1 text-sm font-semibold text-emerald-300">FINALIZED</span>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="font-label text-xs uppercase tracking-[0.1em] text-slate-300">Transaction Hash</p>
                    <p className="mt-2 break-all font-mono text-lg">{item.hash}</p>
                  </div>
                  <p className="mt-2 font-mono text-sm text-slate-300">Timestamp: {item.time}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/15 pt-6 text-slate-300">
              <p className="font-label text-xs uppercase tracking-[0.12em]">Node Network: Active</p>
              <p className="mt-1 font-mono text-sm">Base Mainnet v1.4</p>
            </div>
          </article>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <article className="rounded-[30px] bg-[#F2F4F6] p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-label text-xl font-semibold uppercase tracking-[0.12em] text-slate-900">Rekapitulasi Suara Kandidat</h3>
              <p className="font-mono text-lg text-slate-600">Update: 12 Okt 2023, 15:00 WIB</p>
            </div>

            <div className="space-y-4">
              {candidateResults.map((candidate) => (
                <div className="rounded-2xl bg-white p-5" key={candidate.name}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-3xl font-semibold text-slate-900">{candidate.name}</p>
                    <p className="text-3xl font-semibold text-slate-900">
                      {candidate.votes} <span className="text-2xl font-normal text-slate-500">({candidate.percentage})</span>
                    </p>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className={`h-3 rounded-full bg-slate-500 ${candidate.width}`} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] bg-[#F2F4F6] p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-800">
                <Info className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-4xl font-semibold text-slate-900">Informasi Sertifikat</h3>
                <p className="mt-3 text-2xl leading-relaxed text-slate-700">
                  Sertifikat digital ini berisi bukti kriptografis bahwa suara Anda telah dihitung dalam hasil akhir. Gunakan sertifikat ini untuk verifikasi mandiri di penjelajah blockchain manapun.
                </p>
              </div>
            </div>
          </article>
        </div>

        <VoterFooterMeta />
      </section>
    </VoterShell>
  )
}
