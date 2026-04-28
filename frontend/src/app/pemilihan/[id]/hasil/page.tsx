import Link from 'next/link'

import { PublicShell } from '@/components/layout/PublicShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, SectionLabel } from '@/components/ui/Card'
import { MetricCard } from '@/components/ui/MetricCard'
import { basescan } from '@/lib/basescan'

interface ResultRow {
  candidate: string
  votes: number
  percentage: number
  widthClass: string
}

interface TxRow {
  wallet: string
  action: 'Commit' | 'Reveal' | 'Finalisasi'
  block: number
  txHash: string
  time: string
}

const contractAddress = '0x7F3a00000000000000000000000000000000c28E'

const results: ResultRow[] = [
  { candidate: 'Bella Sari Putri', votes: 22, percentage: 56, widthClass: 'w-[56%]' },
  { candidate: 'Dion Pratama', votes: 17, percentage: 44, widthClass: 'w-[44%]' },
]

const txs: TxRow[] = [
  {
    wallet: '0x1234...c2a1',
    action: 'Commit',
    block: 14823917,
    txHash: '0x8f3a00000000000000000000000000000000000000000000000000000000d291',
    time: '2 menit lalu',
  },
  {
    wallet: '0x91a2...8de3',
    action: 'Reveal',
    block: 14824025,
    txHash: '0x6ab100000000000000000000000000000000000000000000000000000000c201',
    time: '1 menit lalu',
  },
  {
    wallet: '0xAdmin...af31',
    action: 'Finalisasi',
    block: 14824091,
    txHash: '0x5ca100000000000000000000000000000000000000000000000000000000f0e1',
    time: 'Baru saja',
  },
]

export default async function DetailHasilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <PublicShell mainClassName="py-10">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">ID Pemilihan: {id}</p>
            <h1 className="mt-1 text-3xl font-semibold">Detail Hasil & Audit Trail</h1>
            <p className="mt-2 text-sm text-slate-600">Pemilihan Ketua HIMAFORKA 2026</p>

            <p className="mt-2 text-xs text-slate-400">
              Contract:{' '}
              <a className="text-blue-700" href={basescan.address(contractAddress)} rel="noreferrer" target="_blank">
                {contractAddress.slice(0, 10)}...{contractAddress.slice(-4)} ↗
              </a>
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant="info">Terverifikasi</Badge>
            <Badge variant="ended">Final</Badge>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Suara" value="39" />
          <MetricCard label="Partisipasi" value="83%" />
          <MetricCard label="Kandidat" value="2" />
          <MetricCard label="Jaringan" value="Base Sepolia" />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-8">
            <SectionLabel>KANDIDAT DENGAN SUARA TERBANYAK</SectionLabel>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Pemenang sementara/final</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Bella Sari Putri</h2>
              <p className="mt-1 text-sm text-slate-600">22 suara dari total 39 suara sah</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">56%</p>
            </div>

            <div className="mt-4 space-y-4">
              {results.map((row, index) => (
                <div key={row.candidate}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {index === 0 ? '🥇 ' : ''}
                      {row.candidate}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{row.percentage}%</p>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{row.votes} suara</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded bg-slate-100">
                    <div className={`h-full rounded bg-[#0F172A] ${row.widthClass}`} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-4">
            <SectionLabel>AKSI PUBLIK</SectionLabel>
            <div className="space-y-2">
              <Link href="/pemilihan">
                <Button fullWidth variant="secondary">
                  Kembali ke Daftar Pemilihan
                </Button>
              </Link>
              <a href={basescan.address(contractAddress)} rel="noreferrer" target="_blank">
                <Button fullWidth variant="ghost">
                  Audit Kontrak di Basescan ↗
                </Button>
              </a>
            </div>

            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Keterangan</p>
              <p className="mt-1 text-sm text-slate-600">Data diperbarui dari event kontrak dan dapat diverifikasi publik.</p>
            </div>
          </Card>
        </section>

        <section className="mt-4">
          <Card>
            <SectionLabel>LOG TRANSAKSI</SectionLabel>

            <div className="space-y-2">
              {txs.map((tx) => (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3" key={tx.txHash}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          tx.action === 'Commit' ? 'commit' : tx.action === 'Reveal' ? 'reveal' : 'ended'
                        }
                      >
                        {tx.action}
                      </Badge>
                      <p className="font-mono text-xs text-slate-600">{tx.wallet}</p>
                    </div>

                    <p className="text-xs text-slate-400">{tx.time}</p>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-400">Block {new Intl.NumberFormat('id-ID').format(tx.block)}</p>
                    <a className="font-mono text-xs text-blue-700" href={basescan.tx(tx.txHash)} rel="noreferrer" target="_blank">
                      {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-4)} ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
    </PublicShell>
  )
}
