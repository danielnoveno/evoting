'use client'

import { Activity, AlertTriangle, ArrowRight, BadgeCheck, CalendarDays, ExternalLink, Hourglass, Lock, ShieldCheck, Wallet } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { SuperadminDetailIntro, SuperadminSectionCard, SuperadminShell, SuperadminStatusBadge, SuperadminToolbarButton } from '@/components/superadmin/superadmin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { sharedDummyContext } from '@/lib/dummy-shared-context'
import { type SuperadminElectionState } from '@/lib/superadmin-dummy-data'
import { useSuperadminElectionsStore } from '@/lib/superadmin-mock-store'

type ModerationDetail = {
  network: string
  electionCode: string
  endLabel: string
  totalVotes: string
  totalVotesDelta: string
  verificationNote: string
  participationValue: string
  participationTarget: string
  participationNote: string
  phaseTitle: string
  nextPhase: string
  blockNumber: string
  blockSyncLabel: string
  contractAddress: string
  contractUrl: string
  suspensionNote: string
  candidateSectionTitle: string
  candidateSectionDescription: string
  encryptedLabel: string
  candidates: Array<{
    id: string
    ballotNumber: string
    name: string
    vision: string
    commitmentCount: string
    initials: string
  }>
  supportCards: Array<{
    id: string
    title: string
    description: string
    icon: 'shield' | 'activity'
  }>
  feed: Array<{
    id: string
    title: string
    description: string
    hash: string
    time: string
    tone: 'info' | 'teal' | 'slate'
  }>
}

const moderationDetails: Record<string, ModerationDetail> = {
  [sharedDummyContext.electionId]: {
    network: 'Base Mainnet Secured',
    electionCode: 'ID: BEM-UI-2024-X92',
    endLabel: 'Berakhir dalam 2 hari, 14 jam',
    totalVotes: '12,842',
    totalVotesDelta: '+4.2%',
    verificationNote: 'Verifikasi on-chain: 100%',
    participationValue: '68.4%',
    participationTarget: '80%',
    participationNote: 'Quorum tercapai',
    phaseTitle: 'Voting Langsung',
    nextPhase: 'Reveal & Tally',
    blockNumber: '#19,482,102',
    blockSyncLabel: 'Terakhir sinkron 2 detik lalu',
    contractAddress: '0x42f1...91ec',
    contractUrl: 'https://sepolia.basescan.org/address/0x42f100000000000000000000000000000091ec',
    suspensionNote: 'Penangguhan akan membekukan seluruh interaksi kontrak pintar secara permanen.',
    candidateSectionTitle: 'Monitoring Kandidat',
    candidateSectionDescription: 'Status suara bersifat tersembunyi (commitment-based) hingga fase Reveal.',
    encryptedLabel: 'Suara Dienkripsi',
    candidates: [
      { id: sharedDummyContext.candidates[0].id, ballotNumber: 'KANDIDAT 01', name: sharedDummyContext.candidates[0].name, vision: `Visi: ${sharedDummyContext.candidates[0].vision}`, commitmentCount: '96', initials: 'NP' },
      { id: sharedDummyContext.candidates[1].id, ballotNumber: 'KANDIDAT 02', name: sharedDummyContext.candidates[1].name, vision: `Visi: ${sharedDummyContext.candidates[1].vision}`, commitmentCount: '72', initials: 'RM' },
      { id: sharedDummyContext.candidates[2].id, ballotNumber: 'KANDIDAT 03', name: sharedDummyContext.candidates[2].name, vision: `Visi: ${sharedDummyContext.candidates[2].vision}`, commitmentCount: '50', initials: 'SW' },
    ],
    supportCards: [
      { id: 's1', title: 'ZK-Proof Validation', description: 'Setiap suara diverifikasi tanpa membuka identitas pemilih.', icon: 'shield' },
      { id: 's2', title: 'Real-time IPFS Hash', description: 'Backup data pemilihan terdistribusi secara global.', icon: 'activity' },
    ],
    feed: [
      { id: 'f1', title: 'New Commitment Created', description: 'Suara baru telah didaftarkan pada kontrak melalui address 0x42f...91e.', hash: '0x9a2b...4f8c', time: '2 detik yang lalu', tone: 'info' },
      { id: 'f2', title: 'Merkle Tree Update', description: 'Root hash diperbarui untuk validasi batch suara #921.', hash: '0x11e4...8a22', time: '1 menit yang lalu', tone: 'teal' },
      { id: 'f3', title: 'New Commitment Created', description: 'Suara baru telah didaftarkan pada kontrak melalui address 0xbc1...22d.', hash: '0x77d1...f2e0', time: '3 menit yang lalu', tone: 'info' },
      { id: 'f4', title: 'Admin Configuration Change', description: 'Penambahan Moderator View pada dashboard monitoring.', hash: '0xbb34...cc11', time: '12 menit yang lalu', tone: 'slate' },
    ],
  },
}

function getFallbackDetail(title: string, code: string): ModerationDetail {
  return {
    network: 'Base Mainnet Secured',
    electionCode: `ID: ${code}`,
    endLabel: 'Jadwal akhir sedang disinkronkan',
    totalVotes: '0',
    totalVotesDelta: '+0%',
    verificationNote: 'Verifikasi on-chain: menunggu data',
    participationValue: '0%',
    participationTarget: '80%',
    participationNote: 'Belum ada partisipasi',
    phaseTitle: 'Monitoring Aktif',
    nextPhase: 'Reveal & Tally',
    blockNumber: '#19,480,000',
    blockSyncLabel: 'Terakhir sinkron 1 menit lalu',
    contractAddress: '0x0000...demo',
    contractUrl: 'https://sepolia.basescan.org/',
    suspensionNote: 'Penangguhan akan menghentikan alur demo moderasi ini.',
    candidateSectionTitle: `Monitoring Kandidat ${title}`,
    candidateSectionDescription: 'Detail kandidat untuk pemilihan ini masih menggunakan data dummy demonstrasi.',
    encryptedLabel: 'Suara Dienkripsi',
    candidates: [],
    supportCards: [
      { id: 'sf1', title: 'Audit Placeholder', description: 'Konten dukungan belum diisi untuk pemilihan ini.', icon: 'shield' },
      { id: 'sf2', title: 'Activity Placeholder', description: 'Silakan lengkapi dummy data jika ingin presentasi lebih detail.', icon: 'activity' },
    ],
    feed: [],
  }
}

function getFeedToneClass(tone: ModerationDetail['feed'][number]['tone']) {
  if (tone === 'teal') return 'border-teal-200 bg-teal-50 text-teal-700'
  if (tone === 'slate') return 'border-slate-200 bg-slate-100 text-slate-700'
  return 'border-blue-200 bg-blue-50 text-blue-700'
}

function getElectionStatusColor(status: SuperadminElectionState) {
  if (status === 'Ditangguhkan') return 'text-red-600'
  if (status === 'Selesai') return 'text-emerald-600'
  return 'text-emerald-600'
}

function getParticipationWidthClass(value: string) {
  if (value === '68.4%') return 'w-[68.4%]'
  if (value === '0%') return 'w-0'
  return 'w-1/2'
}

export default function SuperadminElectionModerationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { elections, setElections } = useSuperadminElectionsStore()
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)

  const election = useMemo(() => elections.find((item) => item.id === params.id), [elections, params.id])

  if (!election) notFound()

  const detail = moderationDetails[election.id] ?? getFallbackDetail(election.title, election.code)

  return (
    <SuperadminShell>
      <SuperadminDetailIntro
        backHref="/superadmin/manajemen-pemilihan"
        backLabel="Kembali ke Daftar"
        chips={(
          <>
            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[14px] font-medium text-blue-700">
              <BadgeCheck className="h-4 w-4" />
              {detail.network}
            </span>
            <span className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-[13px] text-slate-500">{detail.electionCode}</span>
          </>
        )}
        title={election.title}
        meta={(
          <>
            <SuperadminStatusBadge status={election.status} />
            <div className={`flex items-center gap-2 ${getElectionStatusColor(election.status)}`}>
              <CalendarDays className="h-4 w-4" />
              <span className="text-slate-600">{detail.endLabel}</span>
            </div>
          </>
        )}
        actions={(
          <div className="flex w-full max-w-[460px] flex-col items-stretch gap-4 xl:items-end">
            <div className="flex flex-col gap-3 sm:flex-row xl:w-full xl:justify-end">
            <a
              href={detail.contractUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-50"
            >
              <Wallet className="h-4 w-4" />
              Lihat Smart Contract
            </a>
            <button
              type="button"
              onClick={() => setSuspendDialogOpen(true)}
              className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-red-500 px-6 text-[15px] font-medium text-white hover:bg-red-600"
            >
              <AlertTriangle className="h-4 w-4" />
              Tangguhkan Pemilihan
            </button>
            </div>
            <p className="max-w-[320px] text-[14px] leading-6 text-slate-500 xl:text-right">{detail.suspensionNote}</p>
          </div>
        )}
      />

      <section className="mt-8 grid gap-6 xl:grid-cols-4">
        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total Suara Masuk</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-[28px] font-semibold tracking-[-0.04em] text-slate-900">{detail.totalVotes}</p>
            <span className="pb-1 text-[14px] font-semibold text-emerald-600">{detail.totalVotesDelta}</span>
          </div>
          <p className="mt-4 text-[15px] leading-7 text-slate-600">{detail.verificationNote}</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Tingkat Partisipasi</p>
          <p className="mt-6 text-[28px] font-semibold tracking-[-0.04em] text-slate-900">{detail.participationValue}</p>
          <div className="mt-5 h-2 rounded-full bg-slate-100">
            <div className={`h-2 rounded-full bg-slate-900 ${getParticipationWidthClass(detail.participationValue)}`} />
          </div>
          <p className="mt-4 text-[15px] leading-7 text-slate-600">Target: {detail.participationTarget} ({detail.participationNote})</p>
        </article>

        <article className="rounded-[24px] bg-[#11182a] p-6 text-white">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-300">Fase Pemilihan</p>
          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[22px] font-semibold leading-tight">{detail.phaseTitle}</p>
              <div className="mt-5 flex items-center gap-2 text-[15px] text-slate-300">
                Selanjutnya: {detail.nextPhase}
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
            <Hourglass className="h-12 w-12 text-slate-700" />
          </div>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Blockchain Block</p>
          <p className="mt-6 text-[28px] font-semibold tracking-[-0.04em] text-slate-900">{detail.blockNumber}</p>
          <p className="mt-4 text-[15px] font-medium text-emerald-600">{detail.blockSyncLabel}</p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.85fr)]">
        <div className="space-y-6">
          <SuperadminSectionCard className="bg-white border border-slate-200 p-0">
            <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">{detail.candidateSectionTitle}</h2>
                <p className="mt-3 max-w-[540px] text-[15px] leading-7 text-slate-600">{detail.candidateSectionDescription}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-[15px] font-medium text-slate-700">
                <Lock className="h-4 w-4" />
                {detail.encryptedLabel}
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              {detail.candidates.length > 0 ? detail.candidates.map((candidate) => (
                <article key={candidate.id} className="flex flex-col gap-5 rounded-[22px] border border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-[16px] font-semibold text-white">
                      {candidate.initials}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{candidate.ballotNumber}</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">{candidate.name}</p>
                      <p className="mt-2 max-w-[420px] text-[15px] leading-7 text-slate-600">{candidate.vision}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 self-end lg:self-auto">
                    <div className="text-right">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Jumlah Commitment</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">{candidate.commitmentCount} <span className="text-[14px] font-normal text-slate-500">tx</span></p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                  </div>
                </article>
              )) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 px-5 py-8 text-[15px] text-slate-500">
                  Belum ada kandidat dummy yang terhubung untuk tampilan moderasi ini.
                </div>
              )}
            </div>
          </SuperadminSectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            {detail.supportCards.map((card) => (
              <SuperadminSectionCard key={card.id} className="border border-slate-200 bg-white">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    {card.icon === 'shield' ? <ShieldCheck className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">{card.description}</p>
                  </div>
                </div>
              </SuperadminSectionCard>
            ))}
          </div>
        </div>

        <SuperadminSectionCard className="border border-slate-200 bg-white p-0">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <h2 className="text-[18px] font-semibold text-slate-900">Aktivitas Blockchain</h2>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] font-medium text-emerald-600">Live Feed</span>
          </div>

          <div className="max-h-[920px] overflow-y-auto px-6 py-6">
            <div className="space-y-8">
              {detail.feed.length > 0 ? detail.feed.map((item) => (
                <article key={item.id} className="relative pl-10">
                  <span className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border ${getFeedToneClass(item.tone)}`}>+</span>
                  <h3 className="text-[16px] font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-slate-600">{item.description}</p>
                  <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 font-mono text-[12px] text-slate-500">{item.hash}</div>
                  <p className="mt-3 text-[14px] text-slate-400">{item.time}</p>
                  <div className="absolute bottom-[-22px] left-[13px] top-8 w-px bg-slate-200 last:hidden" />
                </article>
              )) : (
                <div className="rounded-[22px] border border-dashed border-slate-200 px-5 py-8 text-[15px] text-slate-500">
                  Aktivitas blockchain belum tersedia untuk mode dummy ini.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-5">
            <button
              type="button"
              onClick={() => showToast({ tone: 'info', title: 'Explorer lengkap dibuka', description: 'Versi demo hanya menampilkan feed aktivitas statis.' })}
              className="inline-flex w-full items-center justify-center gap-2 text-[15px] font-medium text-slate-900 hover:text-slate-700"
            >
              Buka Explorer Lengkap
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </SuperadminSectionCard>
      </section>

      <ConfirmDialog
        open={suspendDialogOpen}
        title="Tangguhkan pemilihan ini?"
        description="Mode demo akan menandai pemilihan sebagai ditangguhkan lalu mengembalikan Anda ke daftar manajemen pemilihan."
        confirmLabel="Ya, Tangguhkan"
        tone="danger"
        onCancel={() => setSuspendDialogOpen(false)}
        onConfirm={() => {
          setSuspendDialogOpen(false)
          setElections((current) => current.map((item) => item.id === election.id ? { ...item, status: 'Ditangguhkan', note: 'Halted' } : item))
          showToast({ tone: 'success', title: 'Pemilihan ditangguhkan', description: 'Status dummy berhasil diperbarui ke mode halted.' })
          window.setTimeout(() => {
            router.push('/superadmin/manajemen-pemilihan')
          }, 500)
        }}
      />
    </SuperadminShell>
  )
}
