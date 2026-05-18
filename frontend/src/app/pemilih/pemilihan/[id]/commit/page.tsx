'use client'

import { ArrowRight, Clock3 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { findElection, formatDateTime, getPhaseLabel, useVoterStore } from '@/lib/voter-mock-store'

export default function VoterCommitPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { store, loading, actions } = useVoterStore()

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-[32px] bg-slate-200" /></VoterShell>
  }

  const election = findElection(store, params.id)

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-[28px] font-semibold text-slate-900 sm:text-[32px]">Pemilihan tidak ditemukan</h1>
          <p className="mt-3 text-[15px] leading-8 text-slate-600">Ruang voting yang Anda cari tidak tersedia pada simulasi frontend ini.</p>
          <Link href="/pemilih" className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white">Kembali ke Beranda</Link>
        </section>
      </VoterShell>
    )
  }

  const selectedCandidate = election.candidates.find((candidate) => candidate.id === election.selectedCandidateId) ?? null

  return (
    <VoterShell>
      <section>
        <VoterStepper
          steps={[
            { number: 1, label: 'Commit', active: true },
            { number: 2, label: 'Konfirmasi' },
            { number: 3, label: 'Reveal' },
            { number: 4, label: 'Result' },
          ]}
        />
      </section>

      <ScrollReveal variant="fade-up" duration={800}>
      <section className="mt-8 rounded-[32px] bg-[#161f35] px-5 py-6 text-white sm:px-7 sm:py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">Status saat ini</span>
            <h1 className="mt-4 text-[34px] font-semibold leading-none tracking-[-0.05em] text-white sm:text-[44px] md:text-[52px]">Fase Commit</h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-8 text-slate-300 md:text-[18px] md:leading-9">
              Berikan suara Anda secara terenkripsi ke dalam blockchain. Pilihan Anda tetap rahasia sampai fase reveal resmi dibuka.
            </p>
          </div>
          <div className="w-full max-w-[240px] rounded-[24px] border border-white/10 bg-white/10 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">Waktu tersisa</p>
            <div className="mt-5 flex items-center gap-4 text-white">
              <Clock3 className="h-5 w-5 text-slate-300" />
              <p className="text-[28px] font-semibold">{new Date(election.deadlineIso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <p className="mt-3 text-[13px] text-slate-300">{formatDateTime(election.deadlineIso)}</p>
          </div>
        </div>
      </section>
      </ScrollReveal>

      <section className="mt-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[26px] font-semibold text-slate-900 sm:text-[32px]">Kandidat Aktif</h2>
            <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">{election.title}</p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">{election.candidateCount} kandidat terdaftar</span>
        </div>

        <StaggerContainer stagger={120} variant="fade-up" className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {election.candidates.map((candidate, index) => {
            const active = candidate.id === election.selectedCandidateId

            return (
              <article key={candidate.id} className={active ? 'rounded-[32px] border-2 border-black bg-white p-5' : 'rounded-[32px] border border-slate-100 bg-white p-5'}>
                <div className="rounded-[24px] bg-slate-900 p-5 text-white">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold">#{String(index + 1).padStart(2, '0')}</span>
                  <div className="mt-6 flex h-[220px] items-center justify-center rounded-[24px] bg-[radial-gradient(circle_at_top,_#374151,_#111827)] text-[56px] font-semibold tracking-[-0.05em] text-white/90 sm:h-[280px] sm:text-[72px]">
                    {candidate.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}
                  </div>
                </div>
                <h3 className="mt-6 text-[22px] font-semibold text-slate-900">{candidate.name}</h3>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Visi</p>
                <p className="mt-2 text-[16px] leading-8 text-slate-600">{candidate.vision}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Misi</p>
                <ul className="mt-3 space-y-2 text-[16px] leading-8 text-slate-600">
                  {candidate.mission.map((item) => <li key={item}>• {item}</li>)}
                </ul>
                <button
                  type="button"
                  onClick={() => actions.selectCandidate(election.id, candidate.id)}
                  className={active
                    ? 'mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-black px-5 text-[15px] font-medium text-white'
                    : 'mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#111827] px-5 text-[15px] font-medium text-white hover:bg-black'}
                >
                  {active ? 'Kandidat Dipilih' : 'Pilih Kandidat'}
                </button>
              </article>
            )
          })}
        </StaggerContainer>
      </section>

      {selectedCandidate ? (
        <section className="mt-8 rounded-[32px] border border-slate-100 bg-white p-7 md:p-8">
          <p className="text-[13px] font-semibold text-slate-900">Detail Komitmen</p>
          <p className="mt-2 text-[13px] leading-7 text-slate-500">Pilihan akan diteruskan ke langkah konfirmasi sebelum commit disimpan ke blockchain.</p>
          <div className="mt-5 rounded-[24px] bg-slate-50 p-5 font-mono text-[12px] leading-7 text-slate-600">
            candidate: {selectedCandidate.name}\nstatus: siap dikonfirmasi\nfase saat ini: {getPhaseLabel(election.phase)}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => actions.selectCandidate(election.id, '')} className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-700 hover:bg-slate-200">
              Batal
            </button>
            <button type="button" onClick={() => router.push(`/pemilih/pemilihan/${election.id}/konfirmasi`)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-black px-5 text-[14px] font-medium text-white hover:bg-slate-900">
              Kirim ke Konfirmasi
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}
    </VoterShell>
  )
}
