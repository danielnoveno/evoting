'use client'

import { ArrowLeft, Camera, Copy, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { upsertStoredCandidate } from '@/lib/admin-candidate-mock-store'
import { AdminElectionRecord } from '@/lib/admin-election-dummy-data'

type CandidatePrefill = {
  fullName: string
  identityNumber: string
  faculty?: string
  bio: string
  vision: string
  mission: string
}

export function AdminCandidateFormView({
  election,
  title,
  description,
  primaryActionLabel,
  prefill,
  candidateId,
}: {
  election: AdminElectionRecord
  title: string
  description: string
  primaryActionLabel: string
  prefill?: CandidatePrefill
  candidateId?: string
}) {
  const form = election.detail.candidateForm
  const router = useRouter()
  const { showToast } = useToast()
  const [fullName, setFullName] = useState(prefill?.fullName ?? '')
  const [identityNumber, setIdentityNumber] = useState(prefill?.identityNumber ?? '')
  const [bio, setBio] = useState(prefill?.bio ?? '')
  const [vision, setVision] = useState(prefill?.vision ?? '')
  const [mission, setMission] = useState(prefill?.mission ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)

  const confirmTitle = useMemo(() => `${primaryActionLabel}?`, [primaryActionLabel])
  const isDirty = useMemo(() => {
    return fullName !== (prefill?.fullName ?? '')
      || identityNumber !== (prefill?.identityNumber ?? '')
      || bio !== (prefill?.bio ?? '')
      || vision !== (prefill?.vision ?? '')
      || mission !== (prefill?.mission ?? '')
  }, [bio, fullName, identityNumber, mission, prefill, vision])

  const handleSaveClick = () => {
    if (!fullName.trim() || !identityNumber.trim() || !vision.trim() || !mission.trim()) {
      showToast({
        tone: 'error',
        title: 'Form belum lengkap',
        description: 'Lengkapi nama, identitas, visi, dan misi sebelum menyimpan.',
      })
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmSave = () => {
    setConfirmOpen(false)
    const normalizedName = fullName.trim()
    const generatedSummary = bio.trim() || normalizedName
    upsertStoredCandidate(election.id, {
      id: candidateId ?? `cand-local-${Date.now()}`,
      number: candidateId ? prefill?.identityNumber?.slice(-2) || '99' : String(election.detail.candidates.length + 1).padStart(2, '0'),
      name: normalizedName,
      faculty: prefill?.faculty ?? 'Profil kandidat',
      summary: generatedSummary,
      imageTone: 'neutral',
      identityNumber: identityNumber.trim(),
      bio: bio.trim(),
      vision: vision.trim(),
      mission: mission.trim(),
    })
    showToast({
      tone: 'success',
      title: 'Perubahan disimpan',
      description: 'Data kandidat berhasil diperbarui di simulasi frontend.',
    })
    window.setTimeout(() => {
      router.push(`/admin/manajemen-pemilihan/${election.id}?tab=kandidat`)
    }, 500)
  }

  const handleCancelClick = () => {
    if (!isDirty) {
      router.push(`/admin/manajemen-pemilihan/${election.id}?tab=kandidat`)
      return
    }
    setCancelConfirmOpen(true)
  }

  const handleConfirmCancel = () => {
    setCancelConfirmOpen(false)
    showToast({
      tone: 'info',
      title: 'Perubahan dibatalkan',
      description: 'Data yang belum disimpan tidak jadi diterapkan.',
    })
    window.setTimeout(() => {
      router.push(`/admin/manajemen-pemilihan/${election.id}?tab=kandidat`)
    }, 400)
  }

  return (
    <AdminShell>
      <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-[760px]">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/manajemen-pemilihan/${election.id}?tab=kandidat`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
              aria-label="Kembali ke detail pemilihan"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[44px] font-semibold tracking-[-0.04em] text-slate-900 md:text-[56px]">{title}</h1>
          </div>
          <p className="mt-5 text-[18px] leading-9 text-slate-600">{description}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={handleCancelClick} className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-6 text-[15px] font-medium text-slate-700 hover:bg-slate-200">
            Batal
          </button>
          <button type="button" onClick={handleSaveClick} className="inline-flex h-12 items-center justify-center rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900">
            {primaryActionLabel}
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[460px_minmax(0,1fr)]">
        <div className="space-y-6">
          <article className="rounded-[30px] bg-slate-100 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{form.uploadLabel}</p>
            <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-200/60 p-8 text-center">
              <div className="flex min-h-[260px] flex-col items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-500">
                  <Camera className="h-8 w-8" />
                </div>
                <p className="mt-6 max-w-[260px] text-[18px] font-semibold leading-8 text-slate-700">{form.uploadHint}</p>
                <p className="mt-4 text-[13px] text-slate-500">{form.uploadSupport}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[30px] bg-slate-100 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Informasi Identitas</p>
            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-3 block text-[13px] font-semibold text-slate-700">{form.identityLabel}</label>
                <input
                  type="text"
                  placeholder={form.identityPlaceholder}
                  value={identityNumber}
                  onChange={(event) => setIdentityNumber(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="mb-3 block text-[13px] font-semibold text-slate-700">{form.hashPreviewLabel}</label>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4">
                  <p className="font-mono text-[12px] break-all text-slate-600">{election.detail.blockchainAnchor.slice(0, 42)}...</p>
                  <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-[30px] bg-slate-100 p-6">
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{form.fullNameLabel}</label>
                <input
                  type="text"
                  placeholder={form.fullNamePlaceholder}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{form.bioLabel}</label>
                <input
                  type="text"
                  placeholder={form.bioPlaceholder}
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </article>

          <article className="rounded-[30px] bg-slate-100 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Visi & Misi Strategis</p>
            <div className="mt-8 space-y-6">
              <div>
                <label className="mb-3 block text-[14px] font-semibold text-slate-700">{form.visionLabel}</label>
                <textarea
                  placeholder={form.visionPlaceholder}
                  value={vision}
                  onChange={(event) => setVision(event.target.value)}
                  className="min-h-[120px] w-full rounded-[22px] border border-slate-200 bg-slate-200/80 px-5 py-4 text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="mb-3 block text-[14px] font-semibold text-slate-700">{form.missionLabel}</label>
                <textarea
                  placeholder={form.missionPlaceholder}
                  value={mission}
                  onChange={(event) => setMission(event.target.value)}
                  className="min-h-[150px] w-full rounded-[22px] border border-slate-200 bg-slate-200/80 px-5 py-4 text-[16px] text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </article>

          <article className="rounded-[30px] bg-slate-100 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[20px] font-semibold text-slate-900">{form.validationTitle}</h2>
                  <p className="mt-2 text-[15px] leading-7 text-slate-500">{form.validationDescription}</p>
                </div>
              </div>
              <span className="inline-flex self-start rounded-full bg-blue-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600 md:self-auto">
                {form.validationStatus}
              </span>
            </div>
          </article>
        </div>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description="Pastikan seluruh informasi kandidat sudah benar sebelum disimpan. Perubahan akan digunakan pada tampilan admin dan simulasi proses voting."
        confirmLabel={primaryActionLabel}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSave}
      />

      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Batalkan perubahan?"
        description="Ada perubahan yang belum disimpan. Jika Anda lanjut, data yang sudah diisi akan hilang."
        confirmLabel="Ya, Batalkan"
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
      />
    </AdminShell>
  )
}
