import Link from 'next/link'
import { ArrowRight, BarChart3, CalendarDays, ChevronRight, Download } from 'lucide-react'

import { PublicShell } from '@/components/layout/PublicShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ActiveElection {
  id: string
  title: string
  summary: string
  status: 'commit' | 'reveal'
  endIn: string
  participation: string
  proofLabel: string
  proofValue: string
  cta: string
}

interface UpcomingElection {
  id: string
  title: string
  schedule: string
}

interface EndedElection {
  id: string
  title: string
  month: string
  totalVotes: string
}

const activeElections: ActiveElection[] = [
  {
    id: 'ketua-bem-2026',
    title: 'Pemilihan Ketua BEM FTI 2026',
    summary: 'Pemilihan ketua organisasi mahasiswa untuk periode 2026/2027.',
    status: 'commit',
    endIn: 'Berakhir dalam 12 jam',
    participation: '39 / 47 pemilih',
    proofLabel: 'Hash terbaru',
    proofValue: '0x8f2a...9c3b',
    cta: 'Mulai Memilih',
  },
  {
    id: 'proposal-divisi-riset',
    title: 'Voting Proposal Divisi Riset',
    summary: 'Pengambilan keputusan pembaruan program kerja divisi riset.',
    status: 'reveal',
    endIn: 'Berakhir dalam 2 hari',
    participation: '24 / 47 pemilih',
    proofLabel: 'Kontrak',
    proofValue: '0x1d9f...4a2e',
    cta: 'Lihat Statistik',
  },
]

const upcomingElections: UpcomingElection[] = [
  {
    id: 'pengurus-koperasi',
    title: 'Pemilihan Pengurus Koperasi Mahasiswa',
    schedule: '15 Okt 2026 - 17 Okt 2026',
  },
  {
    id: 'audit-keuangan-yayasan',
    title: 'Audit Keuangan Tahunan Yayasan',
    schedule: '1 Nov 2026 - 5 Nov 2026',
  },
]

const endedElections: EndedElection[] = [
  {
    id: 'direksi-inovasi-digital',
    title: 'Pemilihan Direksi Baru PT. Inovasi Digital',
    month: 'Agustus 2026',
    totalVotes: '89.201 suara',
  },
  {
    id: 'prioritas-proyek-komunitas',
    title: 'Voting Prioritas Proyek Komunitas Kota',
    month: 'Juli 2026',
    totalVotes: '15.430 suara',
  },
]

export default function DaftarPemilihanPage() {
  return (
    <PublicShell mainClassName="py-10">
        <section className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Daftar Pemilihan Publik</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Pantau status pemilihan, partisipasi, dan hasil akhir secara terbuka. Data tersimpan permanen dan bisa diaudit
            publik melalui Basescan.
          </p>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-[#0F172A]" />
            <h2 className="text-2xl font-semibold">Sedang Berlangsung</h2>
            <Badge variant="info">{activeElections.length} aktif</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {activeElections.map((election) => (
              <Card className="p-6" key={election.id} variant="hover">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant={election.status}>{election.status === 'commit' ? 'Fase Commit' : 'Fase Reveal'}</Badge>
                  <p className="text-xs uppercase tracking-[0.06em] text-slate-400">{election.endIn}</p>
                </div>

                <h3 className="mt-4 text-[18px] font-semibold leading-tight text-slate-900">{election.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{election.summary}</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Partisipasi</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{election.participation}</p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">{election.proofLabel}</p>
                    <p className="mt-1 truncate font-mono text-xs text-slate-600">{election.proofValue}</p>
                  </div>
                </div>

                <div className="mt-5 flex gap-2">
                  <Link className="flex-1" href="/login">
                    <Button fullWidth variant="primary">
                      {election.cta} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>

                  <Link href={`/pemilihan/${election.id}/hasil`}>
                    <Button variant="secondary">Detail</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-slate-400" />
            <h2 className="text-2xl font-semibold">Akan Datang</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {upcomingElections.map((election) => (
              <Card className="p-6" key={election.id}>
                <Badge variant="commit">Menunggu</Badge>
                <h3 className="mt-4 text-[17px] font-semibold leading-tight text-slate-900">{election.title}</h3>

                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {election.schedule}
                </p>

                <Link className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-slate-900" href="/login">
                  Lihat Detail <ChevronRight className="h-4 w-4" />
                </Link>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-slate-300" />
            <h2 className="text-2xl font-semibold">Selesai</h2>
          </div>

          <div className="space-y-3">
            {endedElections.map((election) => (
              <Card className="bg-slate-50 p-5" key={election.id}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="ended">Selesai</Badge>
                      <p className="text-xs uppercase tracking-[0.06em] text-slate-400">{election.month}</p>
                    </div>
                    <h3 className="mt-2 text-[16px] font-semibold text-slate-900">{election.title}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                      {election.totalVotes}
                    </div>

                    <Link href={`/pemilihan/${election.id}/hasil`}>
                      <Button variant="secondary">Detail Hasil</Button>
                    </Link>

                    <button
                      aria-label="Unduh rekap"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100"
                      type="button"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-8 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Perlu audit lebih detail? Buka transaksi terbaru langsung di Basescan.</p>
          <a className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700" href="https://sepolia.basescan.org" rel="noreferrer" target="_blank">
            Buka Basescan <BarChart3 className="h-4 w-4" />
          </a>
        </section>
    </PublicShell>
  )
}
