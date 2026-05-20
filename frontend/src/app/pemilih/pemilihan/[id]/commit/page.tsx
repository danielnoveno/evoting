'use client'

import { AlertCircle, ArrowRight, CheckCircle2, Clock3, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { basescanTxUrl, findElection, formatDateTime, getPhaseLabel, useVoterStore } from '@/lib/voter-mock-store'
import {
  DemoVoteCommitmentData,
  generateDemoCommitment,
  generateDemoSalt,
  loadDemoVoteCommitment,
  saveDemoVoteCommitment,
} from '@/lib/vote-commitment-demo'

function CandidateInitials({ name }: { name: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[14px] font-semibold text-blue-800">
      {name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')}
    </div>
  )
}

function CommitmentPreview({ preview }: { preview: DemoVoteCommitmentData }) {
  return (
    <pre className="rounded-md border border-slate-100 bg-slate-50 p-3 font-mono text-[11px] leading-6 text-slate-800 whitespace-pre-wrap break-all">
      {`commitment: ${preview.commitment}\nsalt (tersimpan lokal): ${preview.salt}\ncandidateId: ${preview.candidateId}`}
    </pre>
  )
}

export default function VoterCommitPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { store, loading, actions } = useVoterStore()
  const [preview, setPreview] = useState<DemoVoteCommitmentData | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)

  const election = findElection(store, params.id)
  const selectedCandidate = election?.candidates.find((candidate) => candidate.id === election.selectedCandidateId) ?? null

  useEffect(() => {
    if (!election?.selectedCandidateId) {
      setPreview(null)
      setPreviewError('')
      setPreviewLoading(false)
      return
    }

    let active = true

    const preparePreview = async () => {
      setPreviewLoading(true)
      setPreviewError('')

      try {
        const selectedCandidateId = election.selectedCandidateId
        if (!selectedCandidateId) return

        const existing = loadDemoVoteCommitment(election.id)

        if (existing && existing.candidateId === selectedCandidateId) {
          if (!active) return
          setPreview(existing)
          setPreviewLoading(false)
          return
        }

        const salt = generateDemoSalt()
        const commitment = await generateDemoCommitment(election.id, selectedCandidateId, salt)

        const nextPreview: DemoVoteCommitmentData = {
          candidateId: selectedCandidateId,
          salt,
          commitment,
          timestamp: new Date().toISOString(),
        }

        saveDemoVoteCommitment(election.id, nextPreview)

        if (!active) return

        setPreview(nextPreview)
      } catch {
        if (!active) return
        setPreview(null)
        setPreviewError('Salt tidak bisa disimpan di browser ini. Commit diblokir sampai penyimpanan lokal tersedia.')
      } finally {
        if (active) {
          setPreviewLoading(false)
        }
      }
    }

    void preparePreview()

    return () => {
      active = false
    }
  }, [election?.id, election?.selectedCandidateId])

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-xl bg-slate-200" /></VoterShell>
  }

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-[20px] font-semibold text-slate-900">Pemilihan tidak ditemukan</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Ruang voting yang Anda cari belum tersedia saat ini.</p>
          <Link href="/pemilih" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">Kembali ke Beranda</Link>
        </section>
      </VoterShell>
    )
  }

  const stepState = election.commitProof
    ? [
        { label: 'Terdaftar', done: true },
        { label: 'Commit', done: true },
        { label: 'Reveal' },
        { label: 'Selesai' },
      ]
    : [
        { label: 'Terdaftar', done: true },
        { label: 'Commit', active: true },
        { label: 'Reveal' },
        { label: 'Selesai' },
      ]

  if (election.commitProof) {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-[20px] font-semibold text-slate-900">Commit sudah tersimpan</h1>
              <p className="mt-2 text-[14px] leading-7 text-slate-800">
                Pilihan Anda sudah dikirim sebagai hash. Tunggu fase reveal dibuka untuk mengkonfirmasi suara dengan data yang sama.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
              {getPhaseLabel(election.phase)}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Commitment hash</p>
              <p className="mt-2 break-all font-mono text-[12px] leading-6 text-slate-800">{election.commitmentHash ?? '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400">Bukti transaksi</p>
              <p className="mt-2 text-[14px] font-semibold text-slate-900">{formatDateTime(election.commitProof.createdAt)}</p>
              <a href={basescanTxUrl(election.commitProof.txHash)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-blue-700 hover:text-blue-800">
                Lihat di Basescan
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link href="/pemilih/bukti-saya" className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 hover:bg-slate-50">
              Lihat Bukti Saya
            </Link>
            {election.phase === 'reveal' ? (
              <Link href={`/pemilih/pemilihan/${election.id}/reveal`} className="inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">
                Lanjut ke Reveal
              </Link>
            ) : null}
          </div>
        </section>
      </VoterShell>
    )
  }

  if (election.phase !== 'commit') {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-[20px] font-semibold text-slate-900">Fase commit belum tersedia</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">
            Halaman ini hanya aktif saat fase commit dibuka. Status saat ini: <span className="font-semibold text-slate-900">{getPhaseLabel(election.phase)}</span>.
          </p>
          <Link href="/pemilih" className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 hover:bg-slate-50">
            Kembali ke Beranda
          </Link>
        </section>
      </VoterShell>
    )
  }

  return (
    <VoterShell>
      <VoterStepper steps={stepState} />

      <section className="mt-6">
        <h1 className="text-[20px] font-semibold text-slate-900">Pilih Kandidatmu</h1>
        <p className="mt-1 text-[14px] text-slate-400">{election.title} · Fase Commit</p>
      </section>

      <section className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-[12px] leading-6 text-blue-800">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Pilihanmu akan diubah menjadi hash di browser sebelum dikirim. Kamu akan mengkonfirmasi suara yang sama saat fase reveal dibuka.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {election.candidates.map((candidate) => {
          const active = candidate.id === election.selectedCandidateId

          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => actions.selectCandidate(election.id, candidate.id)}
              className={`rounded-xl border bg-white p-5 text-left transition-colors ${active ? 'border-2 border-[#0F172A]' : 'border-slate-200 hover:border-slate-300'}`}
              aria-label={`${candidate.name}, ${candidate.faculty}, ${active ? 'terpilih' : 'belum dipilih'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <CandidateInitials name={candidate.name} />
                <div className={`mt-1 flex h-[22px] w-[22px] items-center justify-center rounded-full ${active ? 'border-2 border-[#0F172A] bg-[#0F172A]' : 'border border-slate-300 bg-white'}`}>
                  {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                </div>
              </div>
              <h2 className="mt-4 text-[15px] font-semibold text-slate-900">{candidate.name}</h2>
              <p className="mt-1 font-mono text-[12px] text-slate-400">{candidate.faculty}</p>
              <div className="my-3 h-px bg-slate-100" />
              <p className="text-[13px] leading-6 text-slate-800 line-clamp-3">{candidate.vision}</p>
            </button>
          )
        })}
      </section>

      {selectedCandidate ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-[13px] font-semibold text-slate-900">Detail Komitmen</h2>
          <p className="mt-1 text-[12px] leading-6 text-slate-400">
            Hash ini disiapkan di browser sebelum commit dikirim. Isi pilihanmu tidak ditampilkan ke pengguna lain.
          </p>

          <div className="mt-4">
            {previewLoading ? (
              <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-[12px] text-slate-400">Menyiapkan hash komitmen...</div>
            ) : preview ? (
              <CommitmentPreview preview={preview} />
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[12px] leading-6 text-red-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{previewError}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => actions.selectCandidate(election.id, '')}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!preview || previewLoading}
              onClick={() => router.push(`/pemilih/pemilihan/${election.id}/konfirmasi`)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Kirim Commit
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-slate-400">Batas fase commit</p>
            <p className="mt-1 text-[14px] font-semibold text-slate-900">{formatDateTime(election.deadlineIso)}</p>
          </div>
        </div>
      </section>
    </VoterShell>
  )
}
