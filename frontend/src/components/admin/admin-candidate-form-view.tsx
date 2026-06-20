'use client'

import { ArrowLeft, Camera, ChevronDown, Copy, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast-provider'
import { upsertStoredCandidate } from '@/lib/admin-candidate-store'
import { AdminElectionRecord } from '@/lib/admin-election-data'
import { ScrollReveal } from '@/components/public/parallax'
import { useCandidateAssetUpload } from '@/hooks/use-candidate-asset-upload'
import { RequiredAsterisk } from '@/components/ui/required-asterisk'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

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
  const [faculty, setFaculty] = useState(prefill?.faculty ?? '')
  const [bio, setBio] = useState(prefill?.bio ?? '')
  const [vision, setVision] = useState(prefill?.vision ?? '')
  const [mission, setMission] = useState(prefill?.mission ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const uploadAssetMutation = useCandidateAssetUpload()

  type CandidateFormErrors = Partial<Record<'fullName' | 'identityNumber' | 'vision' | 'mission', string>>
  const [errors, setErrors] = useState<CandidateFormErrors>({})

  const validateForm = (nameVal: string, idVal: string, visVal: string, misVal: string) => {
    const nextErrors: CandidateFormErrors = {}

    if (!nameVal.trim()) {
      nextErrors.fullName = 'Nama kandidat wajib diisi.'
    } else if (nameVal.trim().length < 3 || nameVal.trim().length > 50) {
      nextErrors.fullName = 'Nama kandidat harus memiliki panjang 3 hingga 50 karakter.'
    } else if (!/^[a-zA-Z\s]+$/.test(nameVal.trim())) {
      nextErrors.fullName = 'Nama kandidat hanya boleh mengandung huruf alfabet dan spasi.'
    }

    if (!idVal.trim()) {
      nextErrors.identityNumber = 'Nomor identitas wajib diisi.'
    } else if (!/^\d{9,10}$/.test(idVal.trim())) {
      nextErrors.identityNumber = 'Nomor identitas harus berupa angka numerik 9 atau 10 digit.'
    }

    if (!visVal.trim()) {
      nextErrors.vision = 'Visi wajib diisi.'
    }

    if (!misVal.trim()) {
      nextErrors.mission = 'Misi wajib diisi.'
    }

    return nextErrors
  }

  const confirmTitle = useMemo(() => `${primaryActionLabel}?`, [primaryActionLabel])
  const isDirty = useMemo(() => {
    return fullName !== (prefill?.fullName ?? '')
      || identityNumber !== (prefill?.identityNumber ?? '')
      || faculty !== (prefill?.faculty ?? '')
      || bio !== (prefill?.bio ?? '')
      || vision !== (prefill?.vision ?? '')
      || mission !== (prefill?.mission ?? '')
  }, [bio, faculty, fullName, identityNumber, mission, prefill, vision])

  const handleSaveClick = () => {
    const nextErrors = validateForm(fullName, identityNumber, vision, mission)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      showToast({
        tone: 'error',
        title: 'Form tidak valid',
        description: nextErrors.fullName || nextErrors.identityNumber || nextErrors.vision || nextErrors.mission || 'Pastikan semua kolom diisi dengan benar.',
      })
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    setConfirmOpen(false)
    let imageUrl = null

    if (imageFile) {
      try {
        imageUrl = await uploadAssetMutation.mutateAsync({
          file: imageFile,
          candidateId: candidateId ?? `cand-local-${Date.now()}`,
          electionId: election.id,
        })
      } catch (error) {
        showToast({
          tone: 'error',
          title: 'Gagal mengunggah foto',
          description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengunggah foto kandidat.',
        })
        return
      }
    }

    const normalizedName = fullName.trim()
    const generatedSummary = bio.trim() || normalizedName
    upsertStoredCandidate(election.id, {
      id: candidateId ?? `cand-local-${Date.now()}`,
      number: candidateId ? prefill?.identityNumber?.slice(-2) || '99' : String(election.detail.candidates.length + 1).padStart(2, '0'),
      name: normalizedName,
      faculty: faculty.trim() || 'Profil kandidat',
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
      description: 'Data kandidat berhasil diperbarui.',
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
      <ScrollReveal variant="fade-up" duration={700}>
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
          <p className="mt-5 text-[18px] leading-9 text-slate-800">{description}</p>
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
            <div className="mt-6">
              <label className="relative block w-full cursor-pointer overflow-hidden rounded-[28px] border border-dashed border-slate-300 bg-slate-200/60 text-center transition-colors hover:border-slate-400">
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setImageFile(file)
                      setImagePreview(URL.createObjectURL(file))
                    }
                  }}
                />
                {imagePreview ? (
                  <div className="relative h-[300px] w-full">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                      <p className="text-[14px] font-semibold text-white">Ganti Foto Kandidat</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[300px] flex-col items-center justify-center p-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                      <Camera className="h-8 w-8" />
                    </div>
                    <p className="mt-6 max-w-[260px] text-[18px] font-semibold leading-8 text-slate-700">{form.uploadHint}</p>
                    <p className="mt-4 text-[13px] text-slate-500">{form.uploadSupport}</p>
                  </div>
                )}
              </label>
            </div>
          </article>

          <article className="rounded-[30px] bg-slate-100 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Informasi Identitas</p>
            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="cand-identity-number" className="mb-3 block text-[13px] font-semibold text-slate-700">{form.identityLabel} <RequiredAsterisk /></label>
                <input
                  id="cand-identity-number"
                  type="text"
                  placeholder={form.identityPlaceholder}
                  value={identityNumber}
                  onChange={(event) => {
                    const val = event.target.value
                    setIdentityNumber(val)
                    setErrors((prev) => ({ ...prev, identityNumber: validateForm(fullName, val, vision, mission).identityNumber }))
                  }}
                  className={`h-12 w-full rounded-2xl border bg-white px-4 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-black focus:outline-none transition-all ${errors.identityNumber ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                />
                {errors.identityNumber && <p className="mt-2 text-[12px] text-red-600 font-medium">{errors.identityNumber}</p>}
              </div>
              <div>
                <label htmlFor="cand-hash-preview" className="mb-3 block text-[13px] font-semibold text-slate-700">{form.hashPreviewLabel}</label>
                <div id="cand-hash-preview" className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4 border border-slate-200">
                  <p className="font-mono text-[12px] break-all text-slate-800">{election.detail.blockchainAnchor.slice(0, 42)}...</p>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(election.detail.blockchainAnchor).then(() => showToast({ tone: 'success', title: 'Hash disalin', description: 'Hash pratinjau berhasil disalin.' })).catch(() => showToast({ tone: 'error', title: 'Gagal menyalin', description: 'Terjadi kesalahan saat menyalin hash.' })) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 focus:ring-2 focus:ring-black focus:outline-none" aria-label="Salin hash pratinjau blockchain">
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
                <label htmlFor="cand-full-name" className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{form.fullNameLabel} <RequiredAsterisk /></label>
                <input
                  id="cand-full-name"
                  type="text"
                  placeholder={form.fullNamePlaceholder}
                  value={fullName}
                  onChange={(event) => {
                    const val = event.target.value
                    setFullName(val)
                    setErrors((prev) => ({ ...prev, fullName: validateForm(val, identityNumber, vision, mission).fullName }))
                  }}
                  className={`h-14 w-full rounded-2xl border bg-white px-5 text-[16px] text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-black focus:outline-none transition-all ${errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                />
                {errors.fullName && <p className="mt-2 text-[12px] text-red-600 font-medium">{errors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="cand-faculty" className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Fakultas</label>
                <div className="relative">
                  <select
                    id="cand-faculty"
                    value={faculty}
                    onChange={(event) => setFaculty(event.target.value)}
                    className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-5 pr-10 text-[16px] text-slate-900 outline-none focus:ring-2 focus:ring-black focus:outline-none transition-all"
                  >
                    <option value="">Pilih fakultas...</option>
                    <option value="FTI">Fakultas Teknologi dan Industri</option>
                    <option value="FEB">Fakultas Ekonomi dan Bisnis</option>
                    <option value="FH">Fakultas Hukum</option>
                    <option value="FISIPOL">Fakultas Ilmu Sosial dan Ilmu Politik</option>
                    <option value="FKIK">Fakultas Kedokteran dan Ilmu Kesehatan</option>
                    <option value="FB">Fakultas Biologi</option>
                    <option value="FPsi">Fakultas Psikologi</option>
                    <option value="SPs">Sekolah Pascasarjana</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div>
                <label htmlFor="cand-bio" className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{form.bioLabel}</label>
                <RichTextEditor value={bio} onChange={setBio} placeholder={form.bioPlaceholder} minHeightClassName="min-h-[112px]" />
              </div>
            </div>
          </article>

          <article className="rounded-[30px] bg-slate-100 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Visi & Misi Strategis</p>
            <div className="mt-8 grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cand-vision" className="mb-3 block text-[14px] font-semibold text-slate-700">{form.visionLabel} <RequiredAsterisk /></label>
                <RichTextEditor
                  value={vision}
                  onChange={(val) => {
                    setVision(val)
                    setErrors((prev) => ({ ...prev, vision: validateForm(fullName, identityNumber, val, mission).vision }))
                  }}
                  placeholder={form.visionPlaceholder}
                  minHeightClassName="min-h-[120px]"
                />
                {errors.vision && <p className="mt-2 text-[12px] text-red-600 font-medium">{errors.vision}</p>}
              </div>
              <div>
                <label htmlFor="cand-mission" className="mb-3 block text-[14px] font-semibold text-slate-700">{form.missionLabel} <RequiredAsterisk /></label>
                <RichTextEditor
                  value={mission}
                  onChange={(val) => {
                    setMission(val)
                    setErrors((prev) => ({ ...prev, mission: validateForm(fullName, identityNumber, vision, val).mission }))
                  }}
                  placeholder={form.missionPlaceholder}
                  minHeightClassName="min-h-[150px]"
                />
                {errors.mission && <p className="mt-2 text-[12px] text-red-600 font-medium">{errors.mission}</p>}
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
      </ScrollReveal>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description="Pastikan seluruh informasi kandidat sudah benar sebelum disimpan. Perubahan akan digunakan pada tampilan admin dan proses voting."
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
