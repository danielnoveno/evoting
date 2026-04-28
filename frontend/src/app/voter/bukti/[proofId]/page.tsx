import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Download, ExternalLink, FileCheck2 } from 'lucide-react'
import { notFound } from 'next/navigation'

import { VoterFooterMeta } from '@/components/voter/VoterFooterMeta'
import { VoterShell } from '@/components/voter/VoterShell'
import { ProofRows } from '@/components/ui/ProofRows'
import { basescan } from '@/lib/basescan'
import { getVoterProofById } from '@/lib/voter-proof-data'

interface VoterProofDetailPageProps {
  params: Promise<{
    proofId: string
  }>
}

export default async function VoterProofDetailPage({ params }: VoterProofDetailPageProps) {
  const { proofId } = await params
  const proof = getVoterProofById(decodeURIComponent(proofId))

  if (!proof) {
    notFound()
  }

  const downloadPayload = JSON.stringify(
    {
      id: proof.verifierId,
      namaPemilihan: proof.title,
      kandidat: proof.candidate,
      waktuSubmit: proof.submittedAt,
      transactionHash: proof.txHash,
      commitmentHash: proof.commitmentHash,
      blockNumber: proof.blockNumber,
      gasUsed: proof.gasUsed,
      jaringan: 'Base Sepolia',
      status: proof.status,
    },
    null,
    2,
  )

  const downloadHref = `data:application/json;charset=utf-8,${encodeURIComponent(downloadPayload)}`

  return (
    <VoterShell active="bukti">
      <section className="space-y-8">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900" href="/voter/bukti">
          <ArrowLeft className="h-4 w-4" /> Kembali ke daftar bukti
        </Link>

        <div className="rounded-[30px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="font-label inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Terkonfirmasi di Blockchain
          </p>
          <h1 className="mt-3 text-5xl font-semibold leading-tight text-slate-900">{proof.title}</h1>
          <p className="mt-2 text-xl text-slate-600">{proof.date} • {proof.submittedAt}</p>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_340px]">
            <article className="rounded-3xl bg-slate-100 p-6">
              <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Detail Bukti</p>
              <div className="mt-4">
                <ProofRows
                  rows={[
                    { key: 'ID Verifikasi', value: proof.verifierId },
                    { key: 'Kandidat', value: proof.candidate },
                    { key: 'Tx Hash', value: proof.txHash, mono: true },
                    { key: 'Commitment', value: proof.commitmentHash, mono: true },
                    { key: 'Block', value: new Intl.NumberFormat('id-ID').format(proof.blockNumber) },
                    { key: 'Gas Used', value: proof.gasUsed },
                    { key: 'Jaringan', value: 'Base Sepolia' },
                  ]}
                />
              </div>
            </article>

            <article className="rounded-3xl bg-[#111827] p-6 text-white">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <FileCheck2 className="h-6 w-6" />
              </div>

              <p className="mt-5 text-lg font-semibold">Bukti siap diverifikasi publik</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Kamu bisa membuka transaksi ini langsung di Basescan atau mengunduh file bukti untuk arsip pribadi.
              </p>

              <div className="mt-6 space-y-3">
                <a
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                  href={basescan.tx(proof.txHash)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Lihat di Basescan <ExternalLink className="h-4 w-4" />
                </a>

                <a className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 px-4 py-3 text-sm font-semibold text-white" download={`${proof.id}.json`} href={downloadHref}>
                  Unduh Bukti (.json) <Download className="h-4 w-4" />
                </a>
              </div>
            </article>
          </div>
        </div>

        <VoterFooterMeta />
      </section>
    </VoterShell>
  )
}
