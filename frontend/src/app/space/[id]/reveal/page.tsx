import { AppShell } from '@/components/layout/AppShell'
import { Card, SectionLabel } from '@/components/ui/Card'
import { ProofRows } from '@/components/ui/ProofRows'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { RevealCard } from '@/components/voting/RevealCard'

const tabs = [
  { label: 'Admin', href: '/space/1/admin' },
  { label: 'Voting', href: '/space/1/vote' },
  { label: 'Konfirmasi', href: '/space/1/reveal' },
  { label: 'Hasil', href: '/space/1/results' },
]

export default function RevealPage() {
  return (
    <AppShell mainClassName="py-8" spaceName="Ketua HIMAFORKA 2026" tabs={tabs}>
        <h1 className="text-xl font-semibold text-slate-900">Konfirmasi Suara</h1>
        <p className="mt-1 text-sm text-slate-400">Ketua HIMAFORKA 2026 · Fase Reveal</p>

        <div className="mt-6">
          <StepIndicator
            steps={[
              { label: 'Terdaftar', state: 'done' },
              { label: 'Commit', state: 'done' },
              { label: 'Reveal', state: 'active' },
              { label: 'Selesai', state: 'pending' },
            ]}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionLabel>DATA KOMITMENMU</SectionLabel>
            <ProofRows
              rows={[
                { key: 'Kandidat', value: 'Bella Sari Putri (ID: 1)' },
                { key: 'Salt', value: '0x43ca7f8e...f6cbba', mono: true },
                { key: 'Commitment', value: '0x9f1bf6e8...2f326f1', mono: true },
                { key: 'Nonce', value: '1' },
                { key: 'Waktu Commit', value: '20 Apr 2026, 14:32' },
              ]}
            />
          </Card>
          <RevealCard />
        </div>
    </AppShell>
  )
}
