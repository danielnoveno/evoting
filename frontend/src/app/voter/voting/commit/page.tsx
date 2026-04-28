import Link from 'next/link'

import { VoterFooterMeta } from '@/components/voter/VoterFooterMeta'
import { VoterPhaseProgress } from '@/components/voter/VoterPhaseProgress'
import { VoterShell } from '@/components/voter/VoterShell'

const candidates = [
  {
    id: '01',
    name: 'Andhika Pratama',
    vision:
      'Mewujudkan ekosistem digital yang inklusif dan transparan bagi seluruh lapisan masyarakat melalui inovasi teknologi yang berkelanjutan.',
    missions: ['Digitalisasi birokrasi total.', 'Pengembangan talenta IT lokal.'],
  },
  {
    id: '02',
    name: 'Siti Rahayu',
    vision: 'Membangun harmoni sosial melalui pemerataan akses ekonomi dan pendidikan di seluruh wilayah nusantara.',
    missions: ['Beasiswa 1 juta siswa berprestasi.', 'Revitalisasi pasar tradisional modern.'],
  },
  {
    id: '03',
    name: 'Budi Sudarsono',
    vision:
      'Transformasi ketahanan pangan nasional berbasis kearifan lokal dan teknologi tepat guna untuk kesejahteraan petani.',
    missions: ['Jaminan harga jual komoditas tani.', 'Modernisasi alat pertanian desa.'],
  },
]

export default function VoterCommitPage() {
  return (
    <VoterShell active="beranda">
      <section className="space-y-10">
        <VoterPhaseProgress activeStep={1} />

        <article className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#111B33] via-[#131B2E] to-[#0E1E43] p-8 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-10 top-0 h-72 w-72 rounded-full bg-black/30 blur-[90px]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-label inline-flex rounded-full bg-blue-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                Status Saat Ini
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight">Fase Commit</h1>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
                Berikan suara Anda secara terenkripsi ke dalam blockchain. Suara Anda bersifat privat hingga fase reveal dimulai.
              </p>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur">
              <p className="font-label text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">Waktu Tersisa</p>
              <div className="mt-4 flex items-end gap-4 text-5xl font-semibold">
                <div>
                  <p>12</p>
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-300">Jam</p>
                </div>
                <span className="pb-6 text-slate-400">:</span>
                <div>
                  <p>45</p>
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-300">Menit</p>
                </div>
                <span className="pb-6 text-slate-400">:</span>
                <div>
                  <p>08</p>
                  <p className="text-sm uppercase tracking-[0.12em] text-slate-300">Detik</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-4xl font-semibold text-slate-900">Kandidat Aktif</h2>
            <p className="font-label mt-2 text-sm uppercase tracking-[0.16em] text-slate-600">Pemilihan Ketua Umum 2024</p>
          </div>
          <p className="rounded-full bg-blue-100 px-4 py-2 text-lg font-semibold text-slate-900">3 Kandidat Terdaftar</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {candidates.map((candidate) => (
            <article className="rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200" key={candidate.id}>
              <div className="relative mb-5 overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-700 p-3">
                <div className="font-label absolute left-3 top-3 rounded-lg bg-black/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">
                  #{candidate.id}
                </div>
                <div className="flex h-80 items-end justify-center rounded-xl bg-[radial-gradient(circle_at_center,_#4b5563_0%,_#111827_75%)]">
                  <span className="mb-6 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">Kandidat {candidate.id}</span>
                </div>
              </div>

              <h3 className="text-4xl font-semibold leading-tight text-slate-900">{candidate.name}</h3>

              <p className="font-label mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Visi</p>
              <p className="mt-2 text-lg leading-relaxed text-slate-700">{candidate.vision}</p>

              <p className="font-label mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">Misi</p>
              <ul className="mt-2 space-y-1 text-lg text-slate-700">
                {candidate.missions.map((mission) => (
                  <li key={mission}>• {mission}</li>
                ))}
              </ul>

              <Link
                className="mt-8 block rounded-2xl bg-gradient-to-r from-black via-[#0f1628] to-[#162544] px-6 py-4 text-center text-lg font-semibold text-white"
                href="/voter/voting/konfirmasi"
              >
                Pilih Kandidat
              </Link>
            </article>
          ))}
        </div>

        <VoterFooterMeta />
      </section>
    </VoterShell>
  )
}
