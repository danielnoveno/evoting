'use client'

import { CalendarDays, CheckCircle2, ExternalLink, Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { basescanTxUrl, findElection, formatDateTime, formatNumber, useVoterStore } from '@/lib/voter-mock-store'
import { loadDemoVoteCommitment } from '@/lib/vote-commitment-demo'

const headshots: Record<string, string> = {
  c1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
  c2: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
  c3: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
}

const defaultHeadshot = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop'

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Fingerprint
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-800">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
        <p className="mt-1 break-all text-[13px] text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function VoterCommitPage({ params }: { params: { id: string } }) {
  const { store, loading, actions } = useVoterStore()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (loading || !store) {
    return (
      <VoterShell>
        <div className="h-[420px] animate-pulse rounded-xl bg-slate-200" />
      </VoterShell>
    )
  }

  const election = findElection(store, params.id)

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Pemilihan tidak ditemukan</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">Ruang voting yang Anda cari belum tersedia saat ini.</p>
          <Link href="/pemilih" className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]">
            Kembali ke Beranda
          </Link>
        </section>
      </VoterShell>
    )
  }

  const selectedCandidate = election.candidates.find((candidate) => candidate.id === election.selectedCandidateId)
    ?? election.candidates.find((candidate) => candidate.id === election.committedCandidateId)
    ?? null
  const savedCommitment = loadDemoVoteCommitment(election.id)
  const commitProof = election.commitProof

  const stepState = commitProof
    ? [
        { label: 'pilih kandidat', done: true },
        { label: 'commit', done: true },
        { label: 'reveal' },
        { label: 'result' },
      ]
    : [
        { label: 'pilih kandidat', done: true },
        { label: 'commit', active: true },
        { label: 'reveal' },
        { label: 'result' },
      ]

  if (!selectedCandidate || !savedCommitment) {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-[20px] font-semibold text-slate-900">Data pilihan belum siap</h1>
          <p className="mt-2 text-[14px] leading-7 text-slate-800">
            Pilih kandidat terlebih dahulu dari halaman pilih kandidat sebelum masuk ke tahap commit.
          </p>
          <Link
            href={`/pemilih/pemilihan/${params.id}/pilih-kandidat`}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#0F172A] px-4 text-[13px] font-medium text-white hover:bg-[#1E293B]"
          >
            Ke Halaman Pilih Kandidat
          </Link>
        </section>
      </VoterShell>
    )
  }

  const handleCommit = () => {
    setConfirmOpen(false)
    setIsSubmitting(true)

    setTimeout(() => {
      actions.commitVote(election.id, savedCommitment.commitment)
      setIsSubmitting(false)
    }, 1200)
  }

  if (commitProof) {
    return (
      <VoterShell>
        <VoterStepper steps={stepState} />

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>

          <h1 className="mt-5 text-center text-[24px] font-semibold text-slate-900">Commit berhasil dikirim</h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[14px] leading-7 text-slate-700">
            Suaramu sudah dienkripsi menjadi hash komitmen dan tercatat. Simpan browser yang sama sampai fase reveal dibuka.
          </p>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat terpilih</p>
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={headshots[selectedCandidate.id] || defaultHeadshot}
                  alt={selectedCandidate.name}
                  className="h-16 w-16 rounded-2xl object-cover grayscale"
                />
                <div>
                  <h2 className="text-[20px] font-semibold text-slate-900">{selectedCandidate.name}</h2>
                  <p className="mt-1 text-[14px] text-slate-600">{selectedCandidate.vision}</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-[#0F172A] p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Hash komitmen</p>
              <p className="mt-4 break-all font-mono text-[12px] leading-6 text-slate-200">{election.commitmentHash ?? savedCommitment.commitment}</p>
              <p className="mt-4 text-[13px] leading-6 text-slate-300">Bukti ini bisa ditinjau kapan saja lewat Basescan sebagai jejak audit commit.</p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <DetailRow icon={Fingerprint} label="ID Pemilih" value={election.voterIdentifier} />
            <DetailRow icon={CalendarDays} label="Waktu Transaksi" value={`${formatDateTime(commitProof.createdAt)} WIB`} />
            <DetailRow icon={ShieldCheck} label="Nomor Block" value={formatNumber(commitProof.blockNumber)} />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <a
              href={basescanTxUrl(commitProof.txHash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-900 hover:bg-slate-50"
            >
              Lihat di Basescan
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href={`/pemilih/pemilihan/${election.id}/reveal`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0F172A] px-5 text-[13px] font-semibold text-white hover:bg-[#1E293B]"
            >
              Lanjut ke Reveal
            </Link>
          </div>
        </section>
      </VoterShell>
    )
  }

  return (
    <VoterShell>
      <VoterStepper steps={stepState} />

      <section className="mt-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">
          <LockKeyhole className="h-3.5 w-3.5" />
          Konfirmasi pilihan
        </span>
        <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-slate-900 md:text-[40px]">Tinjau Suara Anda</h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-8 text-slate-700">
          Pastikan pilihan Anda sudah benar. Setelah dikonfirmasi, suara akan dienkripsi dan dikirim sebagai commit ke blockchain.
        </p>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.85fr)]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kandidat terpilih</p>
              <h2 className="mt-4 text-[24px] font-semibold text-slate-900">{selectedCandidate.name}</h2>
              <p className="mt-2 text-[18px] text-slate-700">{selectedCandidate.vision}</p>
            </div>
            <img
              src={headshots[selectedCandidate.id] || defaultHeadshot}
              alt={selectedCandidate.name}
              className="h-[96px] w-[96px] rounded-3xl object-cover grayscale"
            />
          </div>

          <div className="mt-8 grid gap-4">
            <DetailRow icon={Fingerprint} label="ID Pemilih" value={election.voterIdentifier} />
            <DetailRow icon={CalendarDays} label="Waktu Transaksi" value={`${formatDateTime(savedCommitment.timestamp)} WIB`} />
          </div>
        </article>

        <article className="rounded-[28px] bg-[#0F172A] p-6 text-white shadow-sm md:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-slate-100">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-8 text-[18px] font-semibold text-white">Protokol Enkripsi</h2>
          <p className="mt-4 text-[16px] leading-8 text-slate-300">
            Suara Anda akan dienkripsi secara lokal di browser sebelum dikirim sebagai hash komitmen. Pilihan asli tetap tersembunyi sampai fase reveal dibuka.
          </p>

          <div className="mt-8 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-300">Node aktif</p>
            <p className="font-mono text-[12px] leading-6 text-slate-300">{savedCommitment.commitment}</p>
          </div>
        </article>
      </section>

      <section className="mt-8 rounded-[28px] border border-slate-200 bg-slate-100 px-6 py-5 md:px-8">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" />
          <div>
            <h2 className="text-[18px] font-semibold text-slate-900">Pernyataan privasi</h2>
            <p className="mt-2 text-[14px] leading-7 text-slate-700">
              Setelah proses commit selesai, pilihan Anda tidak dapat dihubungkan kembali ke identitas Anda sampai Anda sendiri membuka reveal dengan salt yang sama.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-3 pb-2 sm:flex-row sm:justify-end">
        <Link
          href={`/pemilih/pemilihan/${election.id}/pilih-kandidat`}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-200 px-6 text-[13px] font-semibold text-slate-900 hover:bg-slate-300"
        >
          Batal & Ubah
        </Link>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-6 text-[13px] font-semibold text-white hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? 'Mengirim commit...' : 'Kirim Suara Terenkripsi'}
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Kirim commit sekarang?"
        description="Setelah commit dikirim, kamu harus kembali saat fase reveal dibuka untuk mengkonfirmasi suara yang sama. Pastikan pilihan kandidat sudah benar."
        confirmLabel="Ya, Kirim Commit"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleCommit}
      />
    </VoterShell>
  )
}
