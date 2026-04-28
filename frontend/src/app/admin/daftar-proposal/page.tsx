import {
  BadgeCheck,
  BellRing,
  CirclePlus,
  Eye,
  Gauge,
  Hourglass,
  Pencil,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'

const proposals = [
  {
    name: 'Pemilihan Ketua OSIS 2024',
    category: 'Pendidikan',
    date: '24 Okt 2023',
    estimate: '1,250 Peserta',
    hash: '0x71c...4f92',
    status: 'Disetujui',
    statusClass: 'bg-emerald-50 text-emerald-700',
  },
  {
    name: 'Votasi Kebijakan Lingkungan',
    category: 'Organisasi',
    date: '22 Okt 2023',
    estimate: '450 Peserta',
    hash: '0x92A...1e88',
    status: 'Menunggu Review',
    statusClass: 'bg-amber-50 text-amber-700',
  },
  {
    name: 'Sayembara Logo Komunitas',
    category: 'Umum',
    date: '18 Okt 2023',
    estimate: '3,000 Peserta',
    hash: 'Belum di-hash',
    status: 'Draf',
    statusClass: 'bg-slate-100 text-slate-600',
  },
  {
    name: 'Survei Fasilitas Publik',
    category: 'Pemerintah',
    date: '15 Okt 2023',
    estimate: '15,000 Peserta',
    hash: '0x3B2...9c41',
    status: 'Ditolak',
    statusClass: 'bg-red-50 text-red-700',
  },
]

export default function AdminDaftarProposalPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[34px] font-semibold leading-tight text-slate-900">Ringkasan Pengajuan</p>
          <p className="mt-2 max-w-5xl text-xl leading-relaxed text-slate-600">
            Pantau dan kelola seluruh proposal pemilihan yang masuk dalam protokol blockchain.
            Pastikan integritas data sebelum menyetujui publikasi.
          </p>
        </div>
        <button
          className="h-24 rounded-3xl bg-gradient-to-r from-black to-[#0E1A3A] px-8 text-[20px] font-semibold text-white"
          type="button"
        >
          <span className="inline-flex items-center gap-3">
            <CirclePlus className="h-6 w-6" />
            Buat Proposal Baru
          </span>
        </button>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-3 text-slate-700">
            <Gauge className="h-6 w-6" />
          </div>
          <p className="text-[56px] font-semibold leading-none text-slate-900">128</p>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Proposal</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="mb-4 inline-flex rounded-xl bg-amber-50 p-3 text-amber-600">
            <Hourglass className="h-6 w-6" />
          </div>
          <p className="text-[56px] font-semibold leading-none text-amber-500">14</p>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">Menunggu Review</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
            <Rocket className="h-6 w-6" />
          </div>
          <p className="text-[56px] font-semibold leading-none text-blue-600">08</p>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">Berjalan</p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <p className="text-[56px] font-semibold leading-none text-emerald-500">106</p>
          <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-500">Selesai</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-4xl font-semibold text-slate-900">Daftar Pengajuan Terbaru</h3>
          <div className="flex items-center gap-3 text-slate-500">
            <button className="rounded-lg p-2 hover:bg-slate-100" type="button">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            <button className="rounded-lg p-2 hover:bg-slate-100" type="button">
              <BellRing className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Nama Pemilihan</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Tanggal Pengajuan</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Estimasi Pemilih</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Blockchain Hash</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Status</th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr className="border-t border-slate-100" key={proposal.name}>
                  <td className="px-6 py-5 align-top">
                    <p className="text-[19px] font-semibold leading-tight text-slate-900">{proposal.name}</p>
                    <p className="mt-1 text-sm text-slate-500">Kategori: {proposal.category}</p>
                  </td>
                  <td className="px-6 py-5 text-[18px] text-slate-800">{proposal.date}</td>
                  <td className="px-6 py-5 text-[18px] text-slate-800">{proposal.estimate}</td>
                  <td className="px-6 py-5">
                    <span className="rounded-md bg-slate-100 px-3 py-1 font-mono text-sm text-slate-600">{proposal.hash}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${proposal.statusClass}`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 text-slate-700">
                      <button className="rounded-md p-1 hover:bg-slate-100" type="button">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="rounded-md p-1 hover:bg-slate-100" type="button">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-5">
          <p className="text-sm text-slate-500">Menampilkan 4 dari 128 proposal</p>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-lg border border-slate-200 text-slate-400" type="button">‹</button>
            <button className="h-9 w-9 rounded-lg bg-black text-sm font-semibold text-white" type="button">1</button>
            <button className="h-9 w-9 rounded-lg text-sm font-semibold text-slate-700" type="button">2</button>
            <button className="h-9 w-9 rounded-lg text-sm font-semibold text-slate-700" type="button">3</button>
            <button className="h-9 w-9 rounded-lg border border-slate-200 text-slate-400" type="button">›</button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6">
          <h4 className="text-5xl font-semibold text-slate-900">Verifikasi Blockchain Otomatis</h4>
          <p className="mt-3 max-w-4xl text-xl leading-relaxed text-slate-600">
            Setiap proposal yang disetujui akan secara otomatis dicatat ke dalam smart contract.
            Hal ini menjamin bahwa parameter pemilihan tidak dapat diubah setelah pemungutan suara dimulai.
          </p>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Keamanan Militer
            </span>
            <span>Audit Publik</span>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-[#EBEEF2] p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-400">Safe Chain Network</p>
          <div className="mt-8 rounded-2xl bg-white p-5">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-900">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Node Sinkronisasi
            </p>
            <p className="mt-3 font-mono text-sm text-slate-600">
              0x4f...a3e2 connected
              <br />
              block #192,841 valid
              <br />
              TPS: 2,400 stable
            </p>
          </div>
        </article>
      </section>
    </div>
  )
}
