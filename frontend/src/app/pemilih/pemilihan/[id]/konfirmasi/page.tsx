'use client'

import { CalendarDays, Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ScrollReveal } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { basescanTxUrl, findElection, formatDateTime, getPhaseLabel, useVoterStore } from '@/lib/voter-mock-store'

export default function VoterConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { store, loading, actions } = useVoterStore()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-[32px] bg-slate-200" /></VoterShell>
  }

  const election = findElection(store, params.id)

  if (!election) {
    return (
      <VoterShell>
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 text-[15px] text-slate-600">
          <h1 className="text-[28px] font-semibold text-slate-900 sm:text-[32px]">Data pemilihan tidak tersedia</h1>
          <p className="mt-3 leading-8">Halaman konfirmasi ini tidak menemukan data pemilihan yang diminta pada mode dummy saat ini.</p>
          <Link href="/pemilih" className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white">Kembali ke Beranda</Link>
        </section>
      </VoterShell>
    )
  }

  const selectedCandidate = election.candidates.find((candidate) => candidate.id === election.selectedCandidateId)

  if (!selectedCandidate) {
    return (
      <VoterShell>
        <section className="rounded-[32px] border border-slate-100 bg-white p-6 sm:p-8">
          <h1 className="text-[28px] font-semibold text-slate-900 sm:text-[32px]">Belum ada kandidat dipilih</h1>
          <p className="mt-3 text-[15px] leading-8 text-slate-600">Kembali ke fase commit untuk memilih kandidat terlebih dahulu sebelum mengirim komitmen terenkripsi.</p>
          <Link href={`/pemilih/pemilihan/${params.id}/commit`} className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white">Kembali ke Commit</Link>
        </section>
      </VoterShell>
    )
  }

  const handleCommit = () => {
    setConfirmOpen(false)
    const proof = actions.commitVote(election.id)
    showToast({
      tone: 'success',
      title: 'Commit berhasil dikirim',
      description: proof ? `Hash transaksi siap diverifikasi di Basescan: ${proof.txHash.slice(0, 12)}...` : 'Data komitmen tersimpan pada simulasi frontend.',
    })
    router.push(`/pemilih/pemilihan/${election.id}/reveal`)
  }

  return (
    <VoterShell>
      <section>
        <VoterStepper
          steps={[
            { number: 1, label: 'Commit', done: true },
            { number: 2, label: 'Konfirmasi', active: true },
            { number: 3, label: 'Reveal' },
            { number: 4, label: 'Result' },
          ]}
        />
      </section>

      <ScrollReveal variant="fade-up" duration={800}>
      <section className="mt-8 max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">
          <LockKeyhole className="h-4 w-4" />
          Konfirmasi pilihan
        </span>
        <h1 className="mt-6 text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[44px] md:text-[58px]">Tinjau Suara Anda</h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-8 text-slate-600 md:text-[18px] md:leading-9">
          Pastikan pilihan sudah benar. Setelah dikonfirmasi, suara Anda akan diubah menjadi commit terenkripsi dan hanya bisa dibuka pada fase reveal.
        </p>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.72fr)]">
        <article className="rounded-[32px] border border-slate-100 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Kandidat terpilih</p>
              <h2 className="mt-3 text-[24px] font-semibold text-slate-900 sm:text-[28px] md:text-[44px]">{selectedCandidate.name}</h2>
              <p className="mt-2 text-[16px] leading-8 text-slate-600 md:text-[18px]">{selectedCandidate.vision}</p>
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-slate-900 text-[28px] font-semibold text-white">
              {selectedCandidate.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex flex-col gap-2 rounded-[20px] bg-slate-100 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-slate-700" />
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-700">ID Pemilih</span>
              </div>
              <span className="break-all text-[13px] text-slate-600 md:text-right">{election.voterIdentifier}</span>
            </div>
            <div className="flex flex-col gap-2 rounded-[20px] bg-slate-100 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-slate-700" />
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-700">Waktu transaksi</span>
              </div>
              <span className="text-[13px] text-slate-600 md:text-right">{formatDateTime(new Date().toISOString())} WIB</span>
            </div>
          </div>
        </article>

        <article className="rounded-[32px] bg-[#161f35] p-6 text-white sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="mt-8 text-[24px] font-semibold text-white">Protokol Enkripsi</h3>
          <p className="mt-4 text-[16px] leading-8 text-slate-300">
            Suara akan diubah menjadi commit hash di sisi klien agar isi pilihan tidak terekspos selama fase commit berlangsung.
          </p>
          <div className="mt-10">
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Node aktif
            </div>
            <p className="mt-3 font-mono text-[12px] text-slate-400">Mode simulasi frontend · {getPhaseLabel(election.phase)}</p>
          </div>
        </article>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={150} duration={800}>
      <section className="mt-8 rounded-[32px] bg-slate-100 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[18px] font-semibold text-slate-900">Pernyataan Privasi</h4>
            <p className="mt-2 text-[15px] leading-8 text-slate-600">
              Sesuai standar keamanan pemilu digital, pilihan Anda tidak dapat dihubungkan kembali ke identitas setelah proses commit selesai. Server frontend ini hanya mensimulasikan alur interaksi tanpa menyimpan data nyata.
            </p>
          </div>
        </div>
      </section>
      </ScrollReveal>

      <section className="mt-8 flex flex-col gap-3 md:flex-row md:justify-end">
        <Link href={`/pemilih/pemilihan/${election.id}/commit`} className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-100 px-6 text-[14px] font-semibold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-200 md:w-auto">
          Batal & Ubah
        </Link>
        <button type="button" onClick={() => setConfirmOpen(true)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-8 text-[14px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-slate-900 md:w-auto">
          <ShieldCheck className="h-4 w-4" />
          Kirim Suara Terenkripsi
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Kirim commit terenkripsi sekarang?"
        description="Pilihan Anda akan disimpan sebagai hash terenkripsi. Setelah terkirim, Anda harus kembali pada fase reveal untuk membuka suara yang sama."
        confirmLabel="Ya, Kirim Commit"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleCommit}
      />
    </VoterShell>
  )
}
