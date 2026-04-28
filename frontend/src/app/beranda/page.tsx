import { AppShell } from '@/components/layout/AppShell'
import { SpaceGrid } from '@/components/space/SpaceGrid'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/ui/MetricCard'

const tabs = [
  { label: 'Beranda', href: '/beranda' },
  { label: 'Buat Space', href: '/space/create' },
]

export default function BerandaPage() {
  return (
    <AppShell mainClassName="py-8" tabs={tabs}>
        <section className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Ruang Voting</h1>
            <p className="mt-1 text-sm text-slate-400">Pilih ruang untuk mulai atau pantau voting kamu</p>
          </div>
          <Button variant="primary">+ Buat Space Baru</Button>
        </section>

        <section className="mt-6">
          <SpaceGrid />
        </section>

        <section className="mt-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">RINGKASAN SAYA</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Space Diikuti" value="4" />
            <MetricCard label="Sudah Voting" value="2" />
            <MetricCard label="Menunggu Reveal" value="1" />
            <MetricCard label="Bukti Tersimpan" value="2" />
          </div>
        </section>
    </AppShell>
  )
}
