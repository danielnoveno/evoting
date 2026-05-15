'use client'

import { BadgeCheck, CalendarDays, Check, CircleAlert, Download, ExternalLink, FileText, Landmark, ListChecks, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react'
import { notFound, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  SuperadminDetailIntro,
  SuperadminInteractiveCard,
  SuperadminSectionCard,
  SuperadminShell,
  SuperadminStatusBadge,
} from '@/components/superadmin/superadmin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { superadminProposalDetails } from '@/lib/superadmin-dummy-data'
import { useSuperadminProposalsStore } from '@/lib/superadmin-mock-store'

type DecisionType = 'approve' | 'revise' | 'reject' | null

export default function SuperadminProposalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { proposals, setProposals } = useSuperadminProposalsStore()
  const proposal = useMemo(() => {
    const detailed = superadminProposalDetails[params.id]
    if (detailed) return detailed

    const row = proposals.find((item) => item.id === params.id)
    if (!row) return null

    return {
      id: row.id,
      badge: row.status,
      proposalCode: `AUTO-${row.id.toUpperCase()}`,
      title: `${row.proposalType} ${row.organizationName}`,
      organizationName: row.organizationName,
      submittedAt: row.submittedAt,
      summary: [
        `Proposal ${row.proposalType.toLowerCase()} dari ${row.organizationName} belum memiliki detail lengkap pada mode dummy lama.`,
        'Halaman ini sekarang otomatis membuat detail fallback agar seluruh proposal tetap bisa direview tanpa 404.',
      ],
      networkConfig: {
        contractAddress: '0xAUTO...DUMMY',
        consensus: 'Commit-Reveal + Whitelist',
      },
      objectives: [
        { id: 'fallback-1', title: 'Data proposal dasar tersedia', description: 'Nama organisasi, tipe proposal, dan tanggal pengajuan sudah tercatat.', tone: 'success' as const },
        { id: 'fallback-2', title: 'Butuh lampiran tambahan', description: 'Dokumen pendukung detail belum dilampirkan dalam seed awal dummy.', tone: 'danger' as const },
      ],
      riskProfile: {
        level: 'Medium',
        note: 'Fallback detail otomatis — perlu penyempurnaan manual jika dipakai untuk presentasi spesifik.',
        items: [
          { label: 'Lampiran Proposal', status: 'Elevated' },
          { label: 'Whitelist', status: 'Mitigated' },
        ],
      },
      timeline: [
        { id: 'fallback-t1', title: 'Proposal Diajukan', actor: `Oleh: ${row.organizationName}`, time: row.submittedAt },
      ],
      documents: [
        { id: 'fallback-d1', name: 'Detail proposal masih disusun', meta: 'Dummy fallback' },
      ],
    }
  }, [params.id, proposals])
  const [decisionType, setDecisionType] = useState<DecisionType>(null)
  const [note, setNote] = useState('')

  if (!proposal) notFound()

  const decisionMeta = decisionType === 'approve'
    ? { title: 'Setujui proposal ini?', confirmLabel: 'Setujui Proposal' }
    : decisionType === 'revise'
      ? { title: 'Minta revisi proposal ini?', confirmLabel: 'Kirim Permintaan Revisi' }
      : { title: 'Tolak permanen proposal ini?', confirmLabel: 'Tolak Proposal' }

  const readinessScore = proposal.objectives.filter((item) => item.tone === 'success').length
  const totalChecks = proposal.objectives.length

  return (
    <SuperadminShell>
      <SuperadminDetailIntro
        backHref="/superadmin/manajemen-proposal"
        backLabel="Kembali ke Daftar"
        chips={(
          <>
            <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[14px] font-medium text-blue-700">
              <BadgeCheck className="h-4 w-4" />
              Review Proposal Superadmin
            </span>
            <span className="rounded-xl bg-slate-100 px-3 py-2 font-mono text-[13px] text-slate-500"># {proposal.proposalCode}</span>
          </>
        )}
        title={proposal.title}
        meta={(
          <>
            <SuperadminStatusBadge status={proposal.badge} />
            <span className="inline-flex items-center gap-2"><Landmark className="h-4 w-4" /> {proposal.organizationName}</span>
            <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Diajukan {proposal.submittedAt}</span>
          </>
        )}
        actions={(
          <>
            <button
              type="button"
              onClick={() => showToast({ tone: 'info', title: 'Unduhan ZIP belum tersedia', description: 'Pada versi demo, file belum benar-benar diunduh.' })}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Unduh Dokumen
            </button>
            <button
              type="button"
              onClick={() => setDecisionType('approve')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-5 text-[15px] font-medium text-white hover:bg-slate-800"
            >
              <ThumbsUp className="h-4 w-4" />
              Setujui Cepat
            </button>
          </>
        )}
      />

      <section className="mt-8 grid gap-6 lg:grid-cols-4">
        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Organisasi</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{proposal.organizationName}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-600">Pemilik proposal yang sedang mengajukan ruang pemilihan baru.</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Readiness Score</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{readinessScore}/{totalChecks}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-600">Checklist teknis yang sudah memenuhi syarat review awal.</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Risk Level</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{proposal.riskProfile.level}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-600">{proposal.riskProfile.note}</p>
        </article>

        <article className="rounded-[24px] border border-slate-200 bg-white p-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Dokumen</p>
          <p className="mt-5 text-[24px] font-semibold tracking-[-0.04em] text-slate-900">{proposal.documents.length}</p>
          <p className="mt-3 text-[15px] leading-7 text-slate-600">Berkas pendukung yang tersedia untuk diverifikasi.</p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_420px]">
        <div className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Ringkasan Proposal</h2>
            </div>
            <div className="mt-7 space-y-6 text-[16px] leading-9 text-slate-700">
              {proposal.summary.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] bg-slate-100 p-5">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Smart Contract Draft</p>
                  <p className="mt-2 inline-flex rounded-xl bg-white px-3 py-1.5 font-mono text-[14px] text-slate-700">{proposal.networkConfig.contractAddress}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Konsensus</p>
                  <p className="mt-2 text-[16px] font-medium text-slate-900">{proposal.networkConfig.consensus}</p>
                </div>
              </div>
            </div>
          </section>

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Checklist Strategis & Teknis</h2>
            </div>
            <div className="mt-7 space-y-4">
              {proposal.objectives.map((objective) => (
                <article key={objective.id} className={`rounded-[24px] border px-5 py-5 ${objective.tone === 'danger' ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex gap-4">
                    <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full ${objective.tone === 'danger' ? 'bg-red-600 text-white' : 'bg-emerald-500 text-white'}`}>
                      {objective.tone === 'danger' ? <CircleAlert className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className={`text-[18px] font-semibold ${objective.tone === 'danger' ? 'text-red-700' : 'text-slate-900'}`}>{objective.title}</h3>
                      <p className={`mt-2 text-[15px] leading-7 ${objective.tone === 'danger' ? 'text-red-700' : 'text-slate-600'}`}>{objective.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </SuperadminSectionCard>

          <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-700" />
                <h2 className="text-[20px] font-semibold text-slate-900">Dokumen Pendukung</h2>
              </div>
              <button type="button" onClick={() => showToast({ tone: 'info', title: 'Unduhan ZIP belum tersedia', description: 'Pada versi demo, file belum benar-benar diunduh.' })} className="text-[14px] font-semibold text-slate-700 hover:text-slate-900">
                Unduh semua (ZIP)
              </button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {proposal.documents.map((document) => (
                <SuperadminInteractiveCard key={document.id} onClick={() => showToast({ tone: 'success', title: 'Dokumen dibuka', description: `${document.name} tersedia pada mode dummy.` })} className="bg-slate-100 px-5 py-5 shadow-none">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-white p-3 text-slate-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[17px] font-semibold text-slate-900">{document.name}</p>
                        <p className="mt-1 text-[14px] text-slate-500">{document.meta}</p>
                      </div>
                    </div>
                    <button type="button" onClick={(event) => {
                      event.stopPropagation()
                      showToast({ tone: 'success', title: 'Dokumen siap diunduh', description: `${document.name} dibuka pada mode dummy.` })
                    }} className="rounded-2xl bg-white p-3 text-slate-700 hover:bg-slate-50">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </SuperadminInteractiveCard>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Aksi Review</p>
            <div className="mt-6 space-y-3">
              <button type="button" onClick={() => setDecisionType('approve')} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-6 text-[15px] font-medium text-white hover:bg-slate-800">
                <ThumbsUp className="h-4 w-4" />
                Setujui Proposal
              </button>
              <button type="button" onClick={() => setDecisionType('revise')} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-200">
                <ListChecks className="h-4 w-4" />
                Minta Revisi
              </button>
              <button type="button" onClick={() => setDecisionType('reject')} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-6 text-[15px] font-medium text-red-600 hover:bg-red-100">
                <ThumbsDown className="h-4 w-4" />
                Tolak Permanen
              </button>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Catatan Internal (Opsional)</label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Tambahkan catatan untuk log audit..."
                className="mt-3 h-32 w-full rounded-[20px] bg-slate-100 px-4 py-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </section>

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">Profil Risiko</p>
            <div className="mt-6 flex items-start gap-4 rounded-[24px] bg-slate-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <CircleAlert className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-slate-900">Tingkat Risiko: {proposal.riskProfile.level}</h2>
                <p className="mt-2 text-[15px] text-slate-600">{proposal.riskProfile.note}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {proposal.riskProfile.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[18px] bg-slate-50 px-4 py-3 text-[15px] text-slate-700">
                  <span>{item.label}</span>
                  <span className={item.status === 'Elevated' ? 'text-amber-600' : 'text-emerald-600'}>{item.status}</span>
                </div>
              ))}
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Riwayat Aktivitas</h2>
            </div>
            <div className="mt-6 space-y-5">
              {proposal.timeline.map((event) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex w-6 flex-col items-center">
                    <span className="mt-1 h-4 w-4 rounded-full border-2 border-black bg-white" />
                    <span className="mt-1 min-h-[56px] w-px bg-slate-200" />
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">{event.title}</p>
                    <p className="mt-1 text-[14px] text-slate-500">{event.actor}</p>
                    <p className="mt-1 text-[13px] text-slate-400">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </SuperadminSectionCard>

          <SuperadminSectionCard className="border border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-slate-700" />
              <h2 className="text-[20px] font-semibold text-slate-900">Tautan Draft Kontrak</h2>
            </div>
            <div className="mt-5 rounded-[20px] bg-slate-50 px-4 py-4 font-mono text-[14px] text-slate-700">
              {proposal.networkConfig.contractAddress}
            </div>
            <button type="button" onClick={() => showToast({ tone: 'info', title: 'Explorer draft dibuka', description: 'Pada mode demo, tautan draft kontrak belum terhubung ke backend nyata.' })} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-[14px] font-medium text-slate-900 hover:bg-slate-200">
              Lihat Draft Explorer
            </button>
          </SuperadminSectionCard>
        </div>
      </section>

      <ConfirmDialog
        open={decisionType !== null}
        title={decisionMeta.title}
        description={note.trim() ? `Catatan audit: ${note}` : 'Perubahan ini hanya diterapkan pada mode demo dan belum menyimpan ke backend nyata.'}
        confirmLabel={decisionMeta.confirmLabel}
        tone={decisionType === 'reject' ? 'danger' : 'default'}
        onCancel={() => setDecisionType(null)}
        onConfirm={() => {
          const title = decisionType === 'approve' ? 'Proposal disetujui' : decisionType === 'revise' ? 'Permintaan revisi dikirim' : 'Proposal ditolak'
          setProposals((current) => current.map((row) => row.id === proposal.id
            ? {
                ...row,
                status: decisionType === 'approve'
                  ? 'Disetujui'
                  : decisionType === 'revise'
                    ? 'Perlu Revisi'
                    : row.status,
              }
            : row))
          showToast({ tone: decisionType === 'reject' ? 'error' : 'success', title, description: 'Aksi dummy berhasil dijalankan.' })
          setDecisionType(null)
          window.setTimeout(() => router.push('/superadmin/manajemen-proposal'), 500)
        }}
      />
    </SuperadminShell>
  )
}
