'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { ArrowLeft, FileText, Save, ShieldCheck, Trash2, Upload, X } from 'lucide-react'
import { ScrollReveal } from '@/components/public/parallax'
import { useCandidateAssetUpload } from '@/hooks/use-candidate-asset-upload'
import { useSaveProposalDraft } from '@/hooks/use-save-proposal-draft'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { uploadProposalDocument } from '@/lib/repositories/proposalDocumentRepository'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RequiredAsterisk } from '@/components/ui/required-asterisk'
import type { ProposalCandidateInput, ProposalDraftStatus } from '@/lib/repositories/types'

export interface ProposalFormData {
  title: string
  category: string
  description: string
  candidateCount: number
  voterCount: number
  commitDate: string
  revealDate: string
  endedDate: string
  candidateEntries: ProposalCandidateInput[]
  whitelistWallets: string
}

const EMPTY_CANDIDATE: ProposalCandidateInput = {
  name: '',
  studentId: '',
  faculty: '',
  bio: '',
  vision: '',
  mission: '',
  youtubeUrl: '',
  avatarPath: '',
}

type ProposalFormErrors = Partial<Record<'title' | 'candidateCount' | 'voterCount' | 'commitDate' | 'revealDate' | 'endedDate' | 'dateRange', string>>

const MIN_GAP_MINUTES = 60
const MAX_SUPPORTING_DOCUMENT_SIZE = 10 * 1024 * 1024
const MAX_CANDIDATE_PHOTO_SIZE = 5 * 1024 * 1024

interface ProposalFormProps {
  proposalId?: string
  initialData?: Partial<ProposalFormData>
  isReadOnly?: boolean
  pageTitle: string
  pageDescription: string
  submitLabel?: string
  submitStatus?: ProposalDraftStatus
  successMessageTitle?: string
  successMessageDesc?: string
  extraActions?: React.ReactNode
}

export function ProposalForm({
  proposalId,
  initialData,
  isReadOnly = false,
  pageTitle,
  pageDescription,
  submitLabel = 'Ajukan Proposal',
  submitStatus = 'submitted',
  successMessageTitle = 'Proposal Berhasil Diajukan',
  successMessageDesc = 'Data proposal tersimpan di Supabase dan masuk antrean review superadmin.',
  extraActions
}: ProposalFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const saveProposalDraft = useSaveProposalDraft()
  const uploadCandidateAsset = useCandidateAssetUpload()
  const [supportingDocument, setSupportingDocument] = useState<File | null>(null)
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [candidatePhotoFiles, setCandidatePhotoFiles] = useState<Record<number, File>>({})
  const [candidatePhotoPreviews, setCandidatePhotoPreviews] = useState<Record<number, string>>({})
  const [isUploadingCandidatePhotos, setIsUploadingCandidatePhotos] = useState(false)
  const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number | null>(null)
  const [removalDialogOpen, setRemovalDialogOpen] = useState(false)
  
  const [formData, setFormData] = useState<ProposalFormData>({
    title: initialData?.title || '',
    category: initialData?.category || 'Internal Organisasi',
    description: initialData?.description || '',
    candidateCount: initialData?.candidateCount ?? 2,
    voterCount: initialData?.voterCount ?? 0,
    commitDate: initialData?.commitDate || '',
    revealDate: initialData?.revealDate || '',
    endedDate: initialData?.endedDate || '',
    candidateEntries: initialData?.candidateEntries || [EMPTY_CANDIDATE, EMPTY_CANDIDATE],
    whitelistWallets: initialData?.whitelistWallets || '',
  })
  const [errors, setErrors] = useState<ProposalFormErrors>({})
  const isSubmitting = saveProposalDraft.isPending || isUploadingDocument || isUploadingCandidatePhotos

  useEffect(() => {
    return () => {
      Object.values(candidatePhotoPreviews).forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
    }
  }, [candidatePhotoPreviews])

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || 'Internal Organisasi',
        description: initialData.description || '',
        candidateCount: initialData.candidateCount ?? 2,
        voterCount: initialData.voterCount ?? 0,
        commitDate: initialData.commitDate || '',
        revealDate: initialData.revealDate || '',
        endedDate: initialData.endedDate || '',
        candidateEntries: initialData.candidateEntries || [EMPTY_CANDIDATE, EMPTY_CANDIDATE],
        whitelistWallets: initialData.whitelistWallets || '',
      })
    }
  }, [initialData])

  const validateForm = (data: ProposalFormData) => {
    const nextErrors: ProposalFormErrors = {}
    const filledCandidateCount = data.candidateEntries.filter((candidate) => candidate.name.trim()).length

    if (!data.title.trim()) {
      nextErrors.title = 'Nama pemilihan wajib diisi.'
    }

    if (filledCandidateCount < 2) {
      nextErrors.candidateCount = 'Minimal isi 2 kandidat dengan nama lengkap.'
    }

    if (!data.commitDate) nextErrors.commitDate = 'Wajib diisi.'
    if (!data.revealDate) nextErrors.revealDate = 'Wajib diisi.'
    if (!data.endedDate) nextErrors.endedDate = 'Wajib diisi.'

    if (data.commitDate && data.revealDate && data.endedDate) {
      const commitTime = new Date(data.commitDate).getTime()
      const revealTime = new Date(data.revealDate).getTime()
      const endedTime = new Date(data.endedDate).getTime()

      if (revealTime <= commitTime) {
        nextErrors.dateRange = 'Reveal harus setelah Commit.'
      } else if (endedTime <= revealTime) {
        nextErrors.dateRange = 'Selesai harus setelah Reveal.'
      } else {
        const minGap = MIN_GAP_MINUTES * 60 * 1000
        if (revealTime - commitTime < minGap) {
          nextErrors.dateRange = 'Jarak antar fase minimal 1 jam.'
        }
      }
    }

    return nextErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isReadOnly) return
    const { name, value } = e.target

    const parsedValue = name === 'candidateCount' || name === 'voterCount'
      ? Number(value)
      : value

    setFormData((prev) => {
      const next = { ...prev, [name]: parsedValue } as ProposalFormData
      setErrors(validateForm(next))
      return next
    })
  }

  const handleCandidateChange = (index: number, field: keyof ProposalCandidateInput, value: string) => {
    if (isReadOnly) return
    setFormData((prev) => {
      const nextEntries = prev.candidateEntries.map((c, i) => i === index ? { ...c, [field]: value } : c)
      return { ...prev, candidateEntries: nextEntries }
    })
  }

  const addCandidateEntry = () => {
    if (isReadOnly) return
    setFormData((prev) => ({
      ...prev,
      candidateEntries: [...prev.candidateEntries, { ...EMPTY_CANDIDATE }],
    }))
  }

  const handleSupportingDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return
    const file = event.target.files?.[0] ?? null
    event.target.value = ''

    if (!file) return

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      showToast({
        title: 'Format dokumen belum didukung',
        description: 'Gunakan file PDF untuk surat rekomendasi atau dokumen pendukung.',
        tone: 'error',
      })
      return
    }

    if (file.size > MAX_SUPPORTING_DOCUMENT_SIZE) {
      showToast({
        title: 'Ukuran dokumen terlalu besar',
        description: 'Maksimal ukuran dokumen pendukung adalah 10 MB.',
        tone: 'error',
      })
      return
    }

    setSupportingDocument(file)
  }

  const processCandidatePhotoFile = (index: number, file: File) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || /\.(jpe?g|png)$/i.test(file.name)
    if (!isImage) {
      showToast({
        title: 'Format foto belum didukung',
        description: 'Gunakan foto kandidat dalam format JPG atau PNG.',
        tone: 'error',
      })
      return
    }

    if (file.size > MAX_CANDIDATE_PHOTO_SIZE) {
      showToast({
        title: 'Ukuran foto terlalu besar',
        description: 'Maksimal ukuran foto kandidat adalah 5 MB.',
        tone: 'error',
      })
      return
    }

    setCandidatePhotoFiles((prev) => ({ ...prev, [index]: file }))
    setCandidatePhotoPreviews((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index])
      return { ...prev, [index]: URL.createObjectURL(file) }
    })
  }

  const handleCandidatePhotoChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!file) return
    processCandidatePhotoFile(index, file)
  }

  const handleCandidatePhotoDrop = (index: number, event: React.DragEvent<HTMLLabelElement>) => {
    if (isReadOnly) return
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    processCandidatePhotoFile(index, file)
  }

  const removeCandidatePhoto = (index: number) => {
    if (isReadOnly) return
    setCandidatePhotoFiles((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    setCandidatePhotoPreviews((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index])
      const next = { ...prev }
      delete next[index]
      return next
    })
    handleCandidateChange(index, 'avatarPath', '')
  }

  const isCandidateEntryEmpty = (
    entry: ProposalCandidateInput,
    photoFile: File | undefined,
    photoPreview: string | undefined,
  ) => {
    const hasPhoto = Boolean(photoFile) || Boolean(photoPreview) || Boolean(entry.avatarPath)
    const stringValue = (value: string | string[] | null | undefined) => {
      if (Array.isArray(value)) return value.some((item) => item.trim().length > 0)
      return Boolean(value && value.trim().length > 0)
    }
    return (
      !hasPhoto
      && !stringValue(entry.name)
      && !stringValue(entry.studentId)
      && !stringValue(entry.faculty)
      && !stringValue(entry.bio)
      && !stringValue(entry.vision)
      && !stringValue(entry.mission)
      && !stringValue(entry.youtubeUrl)
    )
  }

  const performRemoveCandidateAt = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      candidateEntries: prev.candidateEntries.filter((_, i) => i !== index),
    }))
    setCandidatePhotoFiles((prev) => {
      const next: Record<number, File> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const numericKey = Number(key)
        if (numericKey < index) next[numericKey] = value
        else if (numericKey > index) next[numericKey - 1] = value
      })
      return next
    })
    setCandidatePhotoPreviews((prev) => {
      const next: Record<number, string> = {}
      Object.entries(prev).forEach(([key, value]) => {
        const numericKey = Number(key)
        if (numericKey < index) next[numericKey] = value
        else if (numericKey > index) {
          next[numericKey - 1] = value
        } else {
          URL.revokeObjectURL(value)
        }
      })
      return next
    })
  }

  const requestRemoveCandidate = (index: number) => {
    if (isReadOnly) return
    if (formData.candidateEntries.length <= 1) return
    const entry = formData.candidateEntries[index]
    if (!entry) return
    const photoFile = candidatePhotoFiles[index]
    const photoPreview = candidatePhotoPreviews[index]
    if (isCandidateEntryEmpty(entry, photoFile, photoPreview)) {
      performRemoveCandidateAt(index)
      return
    }
    setPendingRemovalIndex(index)
    setRemovalDialogOpen(true)
  }

  const confirmRemoveCandidate = () => {
    if (pendingRemovalIndex === null) {
      setRemovalDialogOpen(false)
      return
    }
    performRemoveCandidateAt(pendingRemovalIndex)
    setPendingRemovalIndex(null)
    setRemovalDialogOpen(false)
  }

  const handleSubmit = async () => {
    if (isReadOnly) return
    const nextErrors = validateForm(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      showToast({ title: 'Gagal validasi', description: 'Cek kembali isian formulir.', tone: 'error' })
      return
    }

    let candidateEntries = formData.candidateEntries.filter(c => c.name.trim())

    if (Object.keys(candidatePhotoFiles).length > 0) {
      setIsUploadingCandidatePhotos(true)
      try {
        candidateEntries = await Promise.all(candidateEntries.map(async (candidate, index) => {
          const photoFile = candidatePhotoFiles[index]
          if (!photoFile) return candidate

          const avatarPath = await uploadCandidateAsset.mutateAsync({
            file: photoFile,
            candidateId: `candidate-${index + 1}`,
            electionId: proposalId ?? 'proposal-drafts',
          })

          return { ...candidate, avatarPath }
        }))
      } catch (error) {
        showToast({
          title: 'Gagal mengunggah foto kandidat',
          description: error instanceof Error ? error.message : 'Coba unggah ulang foto kandidat.',
          tone: 'error',
        })
        setIsUploadingCandidatePhotos(false)
        return
      } finally {
        setIsUploadingCandidatePhotos(false)
      }
    }

    saveProposalDraft.mutate({
      id: proposalId,
      title: formData.title,
      organizationName: formData.category,
      description: formData.description,
      candidateCount: candidateEntries.length,
      commitStartAt: new Date(formData.commitDate).toISOString(),
      revealStartAt: new Date(formData.revealDate).toISOString(),
      endedAt: new Date(formData.endedDate).toISOString(),
      status: submitStatus,
      candidates: candidateEntries,
      whitelistEntries: formData.whitelistWallets.split('\n').filter(Boolean).map(w => ({ walletAddress: w.trim() }))
    }, {
      onSuccess: async (proposal) => {
        if (supportingDocument) {
          setIsUploadingDocument(true)
          try {
            await uploadProposalDocument({
              proposalDraftId: proposal.id,
              file: supportingDocument,
            })
            showToast({
              title: successMessageTitle,
              description: `${successMessageDesc} Dokumen pendukung juga berhasil diunggah.`,
              tone: 'success',
            })
          } catch (error) {
            showToast({
              title: 'Proposal tersimpan, dokumen gagal diunggah',
              description: getRepositoryErrorMessage(error, 'Coba unggah ulang dokumen dari halaman edit proposal.'),
              tone: 'error',
            })
          } finally {
            setIsUploadingDocument(false)
          }
        } else {
          showToast({ title: successMessageTitle, description: successMessageDesc, tone: 'success' })
        }
        router.push('/admin/daftar-proposal')
      },
      onError: (error) => {
        showToast({
          title: 'Gagal menyimpan proposal',
          description: getRepositoryErrorMessage(error, 'Proposal belum tersimpan ke Supabase. Cek sesi admin dan koneksi backend.'),
          tone: 'error',
        })
      }
    })
  }

  return (
    <ScrollReveal variant="fade-up" duration={700}>
      <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => router.push('/admin/daftar-proposal')} className="h-11 w-11 flex items-center justify-center rounded-full bg-slate-100"><ArrowLeft className="h-5 w-5"/></button>
            <h1 className="text-[36px] font-semibold text-slate-900">{pageTitle}</h1>
          </div>
          <p className="mt-4 text-slate-800">{pageDescription}</p>
        </div>
        <div className="flex items-center gap-3">
          {extraActions}
          {!isReadOnly && (
            <button onClick={handleSubmit} disabled={isSubmitting} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-6 text-white disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" /> {isUploadingCandidatePhotos ? 'Mengunggah foto...' : isUploadingDocument ? 'Mengunggah dokumen...' : saveProposalDraft.isPending ? 'Menyimpan...' : submitLabel}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <section className="space-y-4">
            <h2 className="text-[14px] font-bold uppercase tracking-widest">Informasi Dasar</h2>
            <div className="grid gap-4">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold text-slate-600">Nama Pemilihan <RequiredAsterisk /></span>
                <input name="title" value={formData.title} onChange={handleChange} disabled={isReadOnly} placeholder="Masukkan nama pemilihan..." className="h-12 w-full rounded-xl bg-slate-100 px-4" />
              </label>
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold text-slate-600">Deskripsi</span>
                <textarea name="description" value={formData.description} onChange={handleChange} disabled={isReadOnly} placeholder="Tuliskan deskripsi pemilihan..." className="h-32 w-full rounded-xl bg-slate-100 p-4" />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
           <div className="rounded-3xl bg-slate-900 p-8 text-white">
              <ShieldCheck className="h-10 w-10 text-emerald-400 mb-6" />
              <h3 className="text-[20px] font-bold">Hardened Logic</h3>
              <p className="mt-4 text-slate-400 leading-7">Parameter waktu akan dikunci di blockchain untuk menjamin pemilihan tidak dapat dimanipulasi setelah dimulai.</p>
           </div>
        </aside>

        <div className="space-y-10 lg:col-span-2">

          {!isReadOnly ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-bold uppercase tracking-widest">Dokumen Pendukung</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Opsional</span>
              </div>
              <label className="block cursor-pointer rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-slate-400 hover:bg-white">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleSupportingDocumentChange}
                />
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-700">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-4 text-[17px] font-semibold text-slate-900">Unggah surat rekomendasi</p>
                <p className="mx-auto mt-2 max-w-[520px] text-[14px] leading-7 text-slate-500">
                  Lampirkan surat rekomendasi atau dokumen pendukung lain untuk review superadmin. Format PDF maksimal 10 MB.
                </p>
              </label>
              {supportingDocument ? (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-slate-900">{supportingDocument.name}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{(supportingDocument.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSupportingDocument(null)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                    aria-label="Hapus dokumen pendukung"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="space-y-4">
            <h2 className="text-[14px] font-bold uppercase tracking-widest">Parameter Waktu On-Chain</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Mulai Commit <RequiredAsterisk /></label>
                <input type="datetime-local" name="commitDate" value={formData.commitDate} onChange={handleChange} disabled={isReadOnly} className="h-12 w-full rounded-xl bg-slate-100 px-4" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Mulai Reveal <RequiredAsterisk /></label>
                <input type="datetime-local" name="revealDate" value={formData.revealDate} onChange={handleChange} disabled={isReadOnly} className="h-12 w-full rounded-xl bg-slate-100 px-4" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Selesai (Off-Chain) <RequiredAsterisk /></label>
                <input type="datetime-local" name="endedDate" value={formData.endedDate} onChange={handleChange} disabled={isReadOnly} className="h-12 w-full rounded-xl bg-slate-100 px-4" />
              </div>
            </div>
            {errors.dateRange && <p className="text-red-500 text-[12px]">{errors.dateRange}</p>}
          </section>

          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Kandidat</h2>
                <p className="mt-1 text-[14px] leading-6 text-slate-600">Isi profil kandidat yang akan tampil kepada pemilih saat pemilihan berjalan.</p>
              </div>
              {!isReadOnly ? (
                <button
                  type="button"
                  onClick={addCandidateEntry}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  + Tambah Kandidat
                </button>
              ) : null}
            </div>
            {formData.candidateEntries.map((c, i) => (
              <div key={i} className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 transition-colors duration-150 hover:border-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[13px] font-semibold text-slate-700">{i + 1}</span>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-900">Profil Kandidat {i + 1}</p>
                      <p className="mt-0.5 text-[12px] text-slate-400">Nama, media, visi, dan misi kandidat.</p>
                    </div>
                  </div>
                  {!isReadOnly ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Foto opsional</span>
                      {formData.candidateEntries.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => requestRemoveCandidate(i)}
                          aria-label={`Hapus kandidat ${i + 1}`}
                          title="Hapus kandidat"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-stretch">
                  <div className="flex h-full flex-col gap-2">
                    {!isReadOnly ? (
                      <div className="flex h-full flex-col gap-2">
                        <label
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleCandidatePhotoDrop(i, event)}
                          className="relative flex min-h-[240px] w-full flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-slate-300 bg-white text-center transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/5 lg:min-h-[384px]"
                        >
                          <input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => handleCandidatePhotoChange(i, event)} />
                          {candidatePhotoPreviews[i] || c.avatarPath ? (
                            <div className="absolute inset-0 h-full w-full">
                              <img
                                src={candidatePhotoPreviews[i] ?? c.avatarPath ?? ''}
                                alt={`Foto kandidat ${c.name || i + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                                <p className="text-[13px] font-semibold text-white">Ganti Foto</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center px-4 py-6">
                              <Upload className="mb-2.5 h-5 w-5 text-slate-400" />
                              <p className="text-[13px] font-semibold leading-5 text-slate-900">Pilih file atau tarik ke sini.</p>
                              <p className="mt-1 text-[12px] leading-5 text-slate-400">JPG atau PNG, maksimal 5 MB.</p>
                              <span className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50">
                                Pilih File
                              </span>
                            </div>
                          )}
                        </label>
                        {(candidatePhotoPreviews[i] || c.avatarPath) ? (
                          <button type="button" onClick={() => removeCandidatePhoto(i)} className="inline-flex h-9 items-center justify-center rounded-xl text-[13px] font-medium text-red-600 hover:bg-red-50">
                            Hapus foto
                          </button>
                        ) : null}
                      </div>
                    ) : candidatePhotoPreviews[i] || c.avatarPath ? (
                      <div className="min-h-[240px] flex-1 overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50 lg:min-h-[384px]">
                        <img src={candidatePhotoPreviews[i] ?? c.avatarPath ?? ''} alt={`Foto kandidat ${c.name || i + 1}`} className="h-full min-h-[240px] w-full object-cover lg:min-h-[384px]" />
                      </div>
                    ) : (
                      <div className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center rounded-[14px] border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-slate-400 lg:min-h-[384px]">
                        <Upload className="mb-2.5 h-5 w-5" />
                        <p className="text-[13px] font-semibold text-slate-500">Foto belum tersedia</p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Nama lengkap <RequiredAsterisk /></span>
                      <input value={c.name} onChange={e => handleCandidateChange(i, 'name', e.target.value)} disabled={isReadOnly} placeholder="Contoh: Daniel Noveno" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Link video YouTube <span className="font-normal text-slate-400">(opsional)</span></span>
                      <input value={c.youtubeUrl || ''} onChange={e => handleCandidateChange(i, 'youtubeUrl', e.target.value)} disabled={isReadOnly} placeholder="https://youtube.com/..." className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Visi kandidat</span>
                      <textarea value={c.vision || ''} onChange={e => handleCandidateChange(i, 'vision', e.target.value)} disabled={isReadOnly} placeholder="Tuliskan visi utama kandidat secara ringkas." className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Misi kandidat</span>
                      <textarea value={Array.isArray(c.mission) ? c.mission.join('\n') : c.mission || ''} onChange={e => handleCandidateChange(i, 'mission', e.target.value)} disabled={isReadOnly} placeholder="Tulis satu poin misi per baris." className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                      <span className="mt-1.5 block text-[12px] text-slate-400">Setiap baris akan disimpan sebagai satu poin misi.</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
            {errors.candidateCount ? <p className="text-[12px] text-red-500">{errors.candidateCount}</p> : null}
            {!isReadOnly ? (
              <button
                type="button"
                onClick={addCandidateEntry}
                className="flex min-h-[76px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-[13px] font-semibold text-slate-900 transition-colors hover:border-slate-400 hover:bg-white"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[16px] text-slate-700">+</span>
                Tambah Kandidat Lagi
              </button>
            ) : null}
          </section>
        </div>
      </div>
      <ConfirmDialog
        open={removalDialogOpen}
        title="Hapus kandidat ini?"
        description={
          pendingRemovalIndex !== null
            ? `Kandidat ${pendingRemovalIndex + 1} sudah memiliki data yang terisi. Menghapus kandidat ini akan membuang foto, visi, misi, dan link YouTube yang sudah diisi. Tindakan ini tidak dapat dibatalkan.`
            : 'Kandidat sudah terisi. Tindakan ini tidak dapat dibatalkan.'
        }
        confirmLabel="Ya, hapus kandidat"
        cancelLabel="Batal"
        tone="danger"
        onConfirm={confirmRemoveCandidate}
        onCancel={() => {
          setRemovalDialogOpen(false)
          setPendingRemovalIndex(null)
        }}
      />
    </ScrollReveal>
  )
}
