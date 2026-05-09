'use client'

import { CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { VoterShell } from '@/components/voter/voter-shell'
import { VoterStepper } from '@/components/voter/voter-stepper'
import { basescanTxUrl, findElection, formatDateTime, formatNumber, useVoterStore } from '@/lib/voter-mock-store'

export default function VoterRevealPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { store, loading, actions } = useVoterStore()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-[32px] bg-slate-200" /></VoterShell>
  }

  const election = findElection(store, params.id)

  if (!election) {
    return <VoterShell><div className="rounded-[32px] border border-slate-200 bg-white p-8 text-[15px] text-slate-600">Data pemilihan tidak tersedia.</div></VoterShell>
  }

  const committedCandidate = election.candidates.find((candidate) => candidate.id === election.committedCandidateId)

  if (!committedCandidate || !election.commitProof) {
    return (
      <VoterShell>
        <section className="rounded-[32px] border border-slate-100 bg-white p-6 sm:p-8">
          <h1 className="text-[28px] font-semibold text-slate-900 sm:text-[32px]">Commit belum ditemukan</h1>
          <p className="mt-3 text-[15px] leading-8 text-slate-600">Silakan kirim commit terlebih dahulu agar halaman reveal bisa digunakan.</p>
          <Link href={`/pemilih/pemilihan/${params.id}/commit`} className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-[14px] font-medium text-white">Kembali ke Commit</Link>
        </section>
      </VoterShell>
    )
  }

  const handleReveal = () => {
    setConfirmOpen(false)
    const proof = actions.revealVote(election.id)
    showToast({
      tone: 'success',
      title: 'Reveal berhasil divalidasi',
      description: proof ? `Bukti reveal siap dilihat di Basescan: ${proof.txHash.slice(0, 12)}...` : 'Data reveal berhasil diperbarui.',
    })
    router.push(`/pemilih/pemilihan/${election.id}/hasil`)
  }

  return (
    <VoterShell>
      <section>
        <VoterStepper
          steps={[
            { number: 1, label: 'Commit', done: true },
            { number: 2, label: 'Konfirmasi', done: true },
            { number: 3, label: 'Reveal', active: true },
            { number: 4, label: 'Result' },
          ]}
        />
      </section>

      <section className="mt-8 max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-700">
          <ShieldCheck className="h-4 w-4" />
          Reveal suara
        </span>
        <h1 className="mt-6 text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[44px] md:text-[58px]">Konfirmasi Suara Anda</h1>
        <p className="mt-4 max-w-3xl text-[16px] leading-8 text-slate-600 md:text-[18px] md:leading-9">
          Kirim kandidat dan salt yang sama untuk membuka commit sebelumnya. Setelah langkah ini berhasil, hasil akhir bisa langsung dilihat oleh publik.
        </p>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)]">
        <article className="rounded-[32px] border border-slate-100 bg-white p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Data komitmenmu</p>
          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-100">
            {[
              ['Kandidat', `${committedCandidate.name} (${committedCandidate.id.toUpperCase()})`],
              ['Commitment', election.commitmentHash ?? '-'],
              ['Tx Hash', election.commitProof.txHash],
              ['Block', formatNumber(election.commitProof.blockNumber)],
              ['Waktu Commit', formatDateTime(election.commitProof.createdAt)],
            ].map(([label, value], index) => (
              <div key={label} className={`flex flex-col gap-2 px-4 py-4 sm:px-5 md:flex-row md:items-start md:justify-between ${index < 4 ? 'border-b border-slate-100' : ''}`}>
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</span>
                <span className="break-all font-mono text-[12px] text-slate-700 md:text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[20px] border border-slate-100 bg-slate-50 p-4">
            <p className="text-[12px] text-slate-500">Kontrak memverifikasi:</p>
            <code className="mt-2 block font-mono text-[12px] text-slate-700">keccak256(candidateId + salt) == commitment</code>
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-100 bg-white p-6 sm:p-8">
          {!election.revealProof ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Konfirmasi & kirim</p>
              <p className="mt-6 text-[16px] leading-8 text-slate-600">
                Dengan mengklik tombol di bawah, Anda mengirim candidateId dan salt ke smart contract untuk diverifikasi terhadap commitment hash sebelumnya.
              </p>
              <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-[14px] leading-7 text-amber-800">
                Pastikan admin telah membuka fase reveal sebelum melanjutkan. Salt pada simulasi frontend ini tetap dijaga lokal dan tidak ditampilkan ke publik.
              </div>
              <button type="button" onClick={() => setConfirmOpen(true)} className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-black px-5 text-[15px] font-medium text-white hover:bg-slate-900">
                Konfirmasi Suara ke Blockchain →
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <h3 className="mt-6 text-center text-[26px] font-semibold text-slate-900">Suara Berhasil Dicatat</h3>
              <p className="mt-3 text-center text-[15px] leading-7 text-slate-500">
                Suara Anda telah direkam secara permanen pada simulasi blockchain dan siap ditinjau melalui proof publik.
              </p>

              <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-100">
                {[
                  ['Tx Hash', election.revealProof.txHash],
                  ['Block', formatNumber(election.revealProof.blockNumber)],
                  ['Gas Used', formatNumber(election.revealProof.gasUsed)],
                ].map(([label, value], index) => (
                  <div key={label} className={`flex flex-col gap-2 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between ${index < 2 ? 'border-b border-slate-100' : ''}`}>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</span>
                    <span className="break-all font-mono text-[12px] text-slate-700 md:text-right">{value}</span>
                  </div>
                ))}
              </div>

              <a href={basescanTxUrl(election.revealProof.txHash)} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 text-[14px] font-semibold text-blue-700 hover:text-blue-800">
                Lihat di Basescan
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link href={`/pemilih/pemilihan/${election.id}/hasil`} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-100 px-5 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
                Lanjut ke Hasil
              </Link>
            </>
          )}
        </article>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Kirim reveal sekarang?"
        description="CandidateId dan salt akan dipakai untuk membuka commit yang sama. Setelah tervalidasi, proses voting untuk akun ini dianggap selesai."
        confirmLabel="Ya, Buka Suara"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleReveal}
      />
    </VoterShell>
  )
}
