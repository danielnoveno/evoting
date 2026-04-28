import { AppShell } from '@/components/layout/AppShell'
import { InfoBanner } from '@/components/ui/InfoBanner'
import { StepIndicator } from '@/components/ui/StepIndicator'
import { CandidateCard } from '@/components/voting/CandidateCard'
import { CommitPreview } from '@/components/voting/CommitPreview'

const tabs = [
  { label: 'Admin', href: '/space/1/admin' },
  { label: 'Voting', href: '/space/1/vote' },
  { label: 'Konfirmasi', href: '/space/1/reveal' },
  { label: 'Hasil', href: '/space/1/results' },
]

export default function VotePage() {
  return (
    <AppShell mainClassName="py-8" spaceName="Ketua HIMAFORKA 2026" tabs={tabs}>
        <h1 className="text-xl font-semibold text-slate-900">Pilih Kandidatmu</h1>
        <p className="mt-1 text-sm text-slate-400">Ketua HIMAFORKA 2026 · Fase Commit</p>

        <div className="mt-6">
          <StepIndicator
            steps={[
              { label: 'Terdaftar', state: 'done' },
              { label: 'Commit', state: 'active' },
              { label: 'Reveal', state: 'pending' },
              { label: 'Selesai', state: 'pending' },
            ]}
          />
        </div>

        <InfoBanner variant="info">
          Pilihanmu akan dienkripsi menjadi hash sebelum dikirim. Kamu akan mengkonfirmasi di fase Reveal.
        </InfoBanner>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CandidateCard name="Bella Sari Putri" nim="220711001" selected />
          <CandidateCard name="Dion Pratama" nim="220711112" />
        </div>

        <CommitPreview
          candidateId={1}
          commitment="0x9f1bf6e8063a6cb054c3924d9fdf4ad4dcf38a25e07994122f15563ec2f326f1"
          salt="0x43ca7f8ecaa0fe14f8f040f941bde9f4b1499234a91818e8358c4480b0f6cbba"
        />
    </AppShell>
  )
}
