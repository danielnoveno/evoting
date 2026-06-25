'use client'

import { ArrowRight, Download, ExternalLink, HelpCircle, QrCode, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { ScrollReveal } from '@/components/public/parallax'
import { useToast } from '@/components/ui/toast-provider'
import { VoterShell } from '@/components/voter/voter-shell'
import {
  basescanTxUrl,
  formatDateShort,
  formatNumber,
  formatWallet,
  getPhaseLabel,
  getPhaseTone,
  useVoterStore,
} from '@/lib/voter-store'
import type { VoterElection } from '@/lib/voter-store'

const phaseToneClassName = {
  success: 'bg-emerald-50 text-emerald-700',
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
} as const

function downloadCertificate(election: VoterElection, wallet?: string) {
  const W = 1200
  const H = 680
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Top accent bar
  ctx.fillStyle = '#0B1120'
  ctx.fillRect(0, 0, W, 8)

  // Border
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 2
  ctx.strokeRect(20, 20, W - 40, H - 40)

  // Inner decorative border
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.strokeRect(30, 30, W - 60, H - 60)

  // Title
  ctx.fillStyle = '#0B1120'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('BUKTI PEMILIHAN SUARA', W / 2, 70)

  ctx.fillStyle = '#334155'
  ctx.font = '600 28px sans-serif'
  ctx.fillText(election.title, W / 2, 110)

  // Separator line
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(200, 135)
  ctx.lineTo(W - 200, 135)
  ctx.stroke()

  // Details grid
  const leftX = 100
  const rightX = W / 2 + 50
  let y = 180

  ctx.textAlign = 'left'
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 11px sans-serif'
  ctx.fillText('PEMILIH', leftX, y)
  ctx.fillText('WALLET', rightX, y)

  ctx.fillStyle = '#1e293b'
  ctx.font = '500 15px sans-serif'
  ctx.fillText(election.voterIdentifier || 'Pemilih Terdaftar', leftX, y + 24)
  ctx.fillText(formatWallet(wallet ?? ''), rightX, y + 24)

  y += 70
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 11px sans-serif'
  ctx.fillText('KODE TRANSAKSI', leftX, y)
  ctx.fillText('BLOK', rightX, y)

  ctx.fillStyle = '#1e293b'
  ctx.font = '500 13px sans-serif'
  const txHash = election.revealProof?.txHash ?? election.commitProof?.txHash ?? 'N/A'
  ctx.fillText(txHash.length > 40 ? txHash.slice(0, 40) + '...' : txHash, leftX, y + 24)
  ctx.fillText(`#${formatNumber(election.revealProof?.blockNumber ?? election.commitProof?.blockNumber ?? 0)}`, rightX, y + 24)

  y += 70
  ctx.fillStyle = '#94a3b8'
  ctx.font = '600 11px sans-serif'
  ctx.fillText('STATUS', leftX, y)
  ctx.fillText('TANGGAL', rightX, y)

  ctx.fillStyle = '#059669'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText(election.revealProof?.statusLabel ?? election.commitProof?.statusLabel ?? 'Pilihan tersimpan', leftX, y + 24)

  ctx.fillStyle = '#1e293b'
  ctx.font = '500 15px sans-serif'
  ctx.fillText(formatDateShort(election.deadlineIso), rightX, y + 24)

  // Network badge
  y += 70
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(leftX, y, 200, 30)
  ctx.fillStyle = '#475569'
  ctx.font = '600 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Base Sepolia Testnet', leftX + 100, y + 20)
  ctx.textAlign = 'left'

  // Footer
  ctx.fillStyle = '#94a3b8'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Dikelola oleh VoteIn · Sistem E-Voting Berbasis Blockchain', W / 2, H - 55)
  ctx.fillText(`Diverifikasi: ${basescanTxUrl(txHash)}`, W / 2, H - 35)

  // Bottom accent bar
  ctx.fillStyle = '#0B1120'
  ctx.fillRect(0, H - 8, W, 8)

  // Download
  const link = document.createElement('a')
  link.download = `bukti-voting-${election.title.replace(/\s+/g, '-').toLowerCase()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function VoterProofPage() {
  const { showToast } = useToast()
  const { store, loading, actions } = useVoterStore()

  if (loading || !store) {
    return <VoterShell><div className="h-[420px] animate-pulse rounded-[32px] bg-slate-200" /></VoterShell>
  }

  // ponytail: bukti-saya only shows elections where voter has actually voted
  const votedElections = store.elections.filter((election) => election.commitProof || election.revealProof)
  const selectedElection = votedElections.find((election) => election.id === store.selectedProofElectionId) ?? votedElections[0]

  if (!selectedElection) {
    return (
      <VoterShell>
        <ScrollReveal variant="fade-up" duration={800}>
          <section className="max-w-4xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Arsip digital</p>
            <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[44px] md:text-[56px]">Bukti Saya</h1>
          <p className="mt-4 text-[16px] leading-8 text-slate-800 md:text-[18px] md:leading-9">
              Riwayat pemilihan yang sudah Anda ikuti beserta bukti transaksi yang dapat ditinjau secara publik.
            </p>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
        <section className="mt-10 rounded-[32px] border border-slate-100 bg-white p-8 text-center md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-100 text-slate-700">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-[24px] font-semibold text-slate-900 sm:text-[32px]">Belum ada bukti pemilihan</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-8 text-slate-700 sm:text-[16px]">
            Anda belum mengikuti pemilihan apapun. Setelah Anda memberikan suara, bukti transaksi akan tampil di halaman ini.
          </p>
        </section>
      </ScrollReveal>
    </VoterShell>
  )
  }

  return (
    <VoterShell>
      <ScrollReveal variant="fade-up" duration={800}>
        <section className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Arsip digital</p>
          <h1 id="tour-voter-proof-title" className="mt-3 text-[34px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[44px] md:text-[56px]">Bukti Saya</h1>
          <p className="mt-4 text-[16px] leading-8 text-slate-800 md:text-[18px] md:leading-9">
            Riwayat pemilihan yang sudah Anda ikuti beserta bukti transaksi yang dapat ditinjau secara publik.
          </p>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={100} duration={800}>
      <section className="mt-10 grid gap-6 xl:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.3fr)]">
          <article id="tour-voter-participation-total" className="rounded-[32px] bg-[#161f35] p-6 text-white md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Total partisipasi</p>

          <p className="mt-6 text-[64px] font-semibold leading-none tracking-[-0.05em] text-white sm:text-[86px]">{String(votedElections.length).padStart(2, '0')}</p>
          <p className="mt-6 max-w-[18ch] text-[16px] leading-7 text-slate-300 md:text-[18px] md:leading-8">Pemilihan yang telah Anda ikuti sejak bergabung.</p>
        </article>

        <div className="space-y-4">
          {votedElections.map((election) => {
            const tone = getPhaseTone(election.phase)

            return (
              <article key={election.id} className="rounded-[28px] border border-slate-100 bg-white px-5 py-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold text-slate-900 sm:text-[22px]">{election.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="text-[13px] text-slate-500">{formatDateShort(election.deadlineIso)}</span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${phaseToneClassName[tone]}`}>
                          {getPhaseLabel(election.phase)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button id="tour-voter-view-proof-btn" type="button" onClick={() => {
                    actions.selectProofElection(election.id)
                    showToast({ tone: 'success', title: 'Bukti dipilih', description: `Detail bukti "${election.title}" ditampilkan di bawah.` })
                    document.getElementById('tour-voter-proof-detail')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-900 hover:bg-slate-200 md:w-auto">
                    Lihat Bukti
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            )
          })}

          <article id="tour-voter-proof-detail" className="rounded-[32px] border border-slate-100 bg-white p-7 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-700">Siap ditinjau</span>
                </div>
                <h2 className="mt-5 text-[24px] font-semibold text-slate-900 sm:text-[28px] md:text-[40px]">{selectedElection.title}</h2>
                <p className="mt-3 text-[15px] leading-8 text-slate-800">Dilaksanakan pada {formatDateShort(selectedElection.deadlineIso)} · {selectedElection.lastTransactionLabel}</p>
              </div>
              <button id="tour-voter-download-cert-btn" type="button" onClick={() => {
                downloadCertificate(selectedElection, store.profile.wallet)
                showToast({ tone: 'success', title: 'Sertifikat diunduh', description: 'File PNG bukti pemilihan sudah diunduh.' })
              }} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[13px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-slate-900 sm:w-auto">
                <Download className="h-4 w-4" />
                Unduh Sertifikat
              </button>

            </div>

            <div className="mt-8 rounded-[24px] bg-slate-100 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Kode transaksi</p>
              <p className="mt-4 overflow-hidden break-all rounded-2xl bg-white px-4 py-4 font-mono text-[12px] text-slate-700 sm:text-[13px]">
                {selectedElection.revealProof?.txHash ?? selectedElection.commitProof?.txHash ?? 'Belum ada transaksi'}
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Block</p>
                  <p className="mt-2 text-[24px] font-semibold text-slate-900">#{formatNumber(selectedElection.revealProof?.blockNumber ?? selectedElection.commitProof?.blockNumber ?? 0)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Status</p>
                  <p className="mt-2 font-mono text-[20px] font-semibold text-emerald-600">{selectedElection.revealProof?.statusLabel ?? selectedElection.commitProof?.statusLabel ?? 'Pending'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Gas Terpakai</p>
                  <p className="mt-2 text-[18px] font-semibold text-slate-900">
                    {(selectedElection.revealProof?.gasUsed ?? selectedElection.commitProof?.gasUsed) == null
                      ? 'Belum tersedia'
                      : formatNumber(selectedElection.revealProof?.gasUsed ?? selectedElection.commitProof?.gasUsed ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" delay={150} duration={800}>
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.58fr)]">
        <article className="rounded-[32px] bg-slate-100 p-8">
          <h2 className="text-[26px] font-semibold text-slate-900 sm:text-[32px]">Bagaimana cara verifikasi?</h2>
          <p className="mt-4 max-w-3xl text-[16px] leading-8 text-slate-800">
            Setiap bukti suara punya kode transaksi. Kode ini bisa kamu cocokkan sendiri lewat Basescan jika ingin memastikan statusnya.
          </p>
          <ol className="mt-8 space-y-4">
            {[
              'Salin kode transaksi dari kartu bukti di atas.',
              'Buka tautan Basescan, lalu cocokkan kode tersebut.',
              'Pastikan statusnya sukses dan waktu/nomor bloknya sesuai.',
            ].map((item, index) => (
              <li key={item} className="flex gap-4 text-[16px] leading-8 text-slate-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[12px] font-semibold text-white">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-[32px] border border-slate-100 bg-white p-8 text-center">
          {(selectedElection.revealProof ?? selectedElection.commitProof) ? (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(basescanTxUrl(selectedElection.revealProof?.txHash ?? selectedElection.commitProof?.txHash ?? ''))}`}
              alt="QR Code verifikasi transaksi"
              width={150}
              height={150}
              className="mx-auto rounded-xl"
            />
          ) : (
            <div className="mx-auto flex h-[150px] w-[150px] items-center justify-center rounded-[28px] bg-slate-100 text-slate-400">
              <QrCode className="h-12 w-12" />
            </div>
          )}
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Pindai verifikasi cepat</p>
          <p className="mt-3 rounded-full bg-slate-100 px-4 py-2 font-mono text-[13px] text-slate-700">VERIFY-ID: {selectedElection.voterIdentifier}</p>
          {(selectedElection.revealProof ?? selectedElection.commitProof) ? (
            <a
              href={basescanTxUrl(selectedElection.revealProof?.txHash ?? selectedElection.commitProof?.txHash ?? '')}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-slate-900 hover:text-blue-700"
            >
              Verifikasi di Basescan
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </article>
      </section>
      </ScrollReveal>

      <div className="mt-8 flex justify-stretch sm:justify-end">
        <Link href="/pemilih/bantuan" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-900 hover:bg-slate-50 sm:w-auto">
          <HelpCircle className="h-4 w-4" />
          Butuh Bantuan?
        </Link>
      </div>
    </VoterShell>
  )
}
