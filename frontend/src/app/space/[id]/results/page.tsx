import { AppShell } from '@/components/layout/AppShell'
import { Card, SectionLabel } from '@/components/ui/Card'
import { MetricCard } from '@/components/ui/MetricCard'
import { ProofRows } from '@/components/ui/ProofRows'

export default function ResultsPage() {
  return (
    <AppShell mainClassName="py-8" spaceName="Ketua HIMAFORKA 2026">
        <h1 className="text-xl font-semibold text-slate-900">Hasil Voting</h1>
        <p className="mt-1 text-sm text-slate-400">Ketua HIMAFORKA 2026</p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Suara" value="39" />
          <MetricCard label="Partisipasi" value="83%" />
          <MetricCard label="Contract" value="0x7F3a...c28E" />
          <MetricCard label="Jaringan" value="Base Sepolia" />
        </div>

        <Card className="mt-4">
          <SectionLabel>PEROLEHAN SUARA</SectionLabel>
          <ProofRows
            rows={[
              { key: '🥇 Bella Sari Putri', value: '22 suara (56%)' },
              { key: 'Dion Pratama', value: '17 suara (44%)' },
            ]}
          />
        </Card>
    </AppShell>
  )
}
