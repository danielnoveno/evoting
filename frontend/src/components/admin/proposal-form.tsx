'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAddress } from 'viem'
import { useToast } from '@/components/ui/toast-provider'
import { AlertTriangle, ArrowLeft, Check, ChevronDown, FileImage, FileText, Filter, Loader2, Save, Search, Trash2, Upload, Users, X } from 'lucide-react'
import { ScrollReveal } from '@/components/public/parallax'
import { useCandidateAssetUpload } from '@/hooks/use-candidate-asset-upload'
import { useFormDraft } from '@/hooks/use-form-draft'
import { useMasterVoters, useMasterVoterProdiOptions } from '@/hooks/use-master-voters'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveProposalDraft as saveProposalDraftFn } from '@/lib/repositories/proposalRepository'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import { uploadProposalDocument } from '@/lib/repositories/proposalDocumentRepository'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RequiredAsterisk } from '@/components/ui/required-asterisk'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import type { ProposalCandidateInput, ProposalDraftStatus } from '@/lib/repositories/types'

export interface ProposalFormData {
  title: string
  category: string
  description: string
  bannerImagePath: string
  candidateCount: number
  voterCount: number
  registrationDate: string
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

type ProposalFormErrors = Partial<Record<'title' | 'candidateCount' | 'voterCount' | 'registrationDate' | 'commitDate' | 'revealDate' | 'endedDate' | 'dateRange', string>>
type ValidationIssue = {
  fieldKey: string
  label: string
  message: string
}

const MIN_GAP_MINUTES = 1
const MAX_SUPPORTING_DOCUMENT_SIZE = 10 * 1024 * 1024
const MAX_CANDIDATE_PHOTO_SIZE = 5 * 1024 * 1024
const MAX_BANNER_IMAGE_SIZE = 5 * 1024 * 1024

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
  stepper?: boolean
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
  successMessageDesc = 'Data proposal tersimpan di Supabase and masuk antrean review superadmin.',
  extraActions,
  stepper = false
}: ProposalFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const saveProposalDraft = useMutation({
    mutationFn: saveProposalDraftFn,
    onSuccess: (proposal) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'proposal-drafts'] })
      void queryClient.invalidateQueries({ queryKey: ['superadmin', 'all-proposals'] })
      void queryClient.invalidateQueries({ queryKey: ['proposal-draft', proposal.id] })
      void queryClient.invalidateQueries({ queryKey: ['proposal-candidates', proposal.id] })
      void queryClient.invalidateQueries({ queryKey: ['proposal-whitelist', proposal.id] })
    },
  })
  const uploadCandidateAsset = useCandidateAssetUpload()
  const [supportingDocument, setSupportingDocument] = useState<File | null>(null)
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null)
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false)
  const [candidatePhotoFiles, setCandidatePhotoFiles] = useState<Record<number, File>>({})
  const [candidatePhotoPreviews, setCandidatePhotoPreviews] = useState<Record<number, string>>({})
  const [isUploadingCandidatePhotos, setIsUploadingCandidatePhotos] = useState(false)
  const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number | null>(null)
  const [removalDialogOpen, setRemovalDialogOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedWhitelistVoterIds, setSelectedWhitelistVoterIds] = useState<Set<string>>(new Set())
  const [voterSearch, setVoterSearch] = useState('')
  const [voterFilterProdi, setVoterFilterProdi] = useState('')
  const [showVoterFilters, setShowVoterFilters] = useState(false)

  const masterVotersQuery = useMasterVoters({
    prodi: voterFilterProdi || undefined,
    search: voterSearch || undefined,
  })
  const prodiOptionsQuery = useMasterVoterProdiOptions()
  
  const [formData, setFormData] = useState<ProposalFormData>({
    title: initialData?.title || '',
    category: initialData?.category || 'Internal Organisasi',
    description: initialData?.description || '',
    bannerImagePath: initialData?.bannerImagePath || '',
    candidateCount: initialData?.candidateCount ?? 2,
    voterCount: initialData?.voterCount ?? 0,
    registrationDate: initialData?.registrationDate || '',
    commitDate: initialData?.commitDate || '',
    revealDate: initialData?.revealDate || '',
    endedDate: initialData?.endedDate || '',
    candidateEntries: initialData?.candidateEntries || [EMPTY_CANDIDATE, EMPTY_CANDIDATE],
    whitelistWallets: initialData?.whitelistWallets || '',
  })
  const draftKey = proposalId ? `proposal-edit-${proposalId}` : 'proposal-create'
  const { clearDraft } = useFormDraft(draftKey, formData, setFormData)
  const [errors, setErrors] = useState<ProposalFormErrors>({})
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const isSubmitting = saveProposalDraft.isPending || isUploadingDocument || isUploadingCandidatePhotos || isUploadingBannerImage

  const whitelistLines = formData.whitelistWallets
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const uniqueWhitelistWallets = Array.from(new Set(whitelistLines.map((wallet) => wallet.toLowerCase())))
  const invalidWhitelistCount = whitelistLines.filter((wallet) => !isAddress(wallet)).length

  const allMasterVoters = masterVotersQuery.data ?? []
  const prodiOptions = prodiOptionsQuery.data ?? []
  const selectedWhitelistWallets = useMemo(() => {
    const wallets: string[] = []
    for (const voter of allMasterVoters) {
      if (selectedWhitelistVoterIds.has(voter.id) && voter.walletAddress) {
        wallets.push(voter.walletAddress.toLowerCase())
      }
    }
    return wallets
  }, [allMasterVoters, selectedWhitelistVoterIds])

  const STEP_LABELS = ['Informasi Umum', 'Kandidat', 'Whitelist']

  const canAdvanceStep = (step: number): boolean => {
    if (step === 0) {
      if (!formData.title.trim()) return false
      if (!formData.commitDate || !formData.endedDate) return false
      const commitTime = new Date(formData.commitDate).getTime()
      const endedTime = new Date(formData.endedDate).getTime()
      if (endedTime <= commitTime) return false
      return true
    }
    if (step === 1) {
      const filled = formData.candidateEntries.filter((c) => c.name.trim())
      if (filled.length < 2) return false
      const hasIncomplete = filled.some((c) =>
        !c.studentId?.trim() ||
        !c.vision?.trim() ||
        (Array.isArray(c.mission) ? c.mission.length === 0 : !c.mission?.trim())
      )
      if (hasIncomplete) return false
      // Check for duplicate NPM among filled candidates
      const studentIds = filled.map((c) => c.studentId?.trim()).filter(Boolean)
      const hasDuplicate = studentIds.some((id, idx) => studentIds.indexOf(id) !== idx)
      if (hasDuplicate) return false
      return true
    }
    return true
  }

  useEffect(() => {
    return () => {
      Object.values(candidatePhotoPreviews).forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
    }
  }, [candidatePhotoPreviews])

  useEffect(() => {
    return () => {
      if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview)
    }
  }, [bannerImagePreview])

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        category: initialData.category || 'Internal Organisasi',
        description: initialData.description || '',
        bannerImagePath: initialData.bannerImagePath || '',
        candidateCount: initialData.candidateCount ?? 2,
        voterCount: initialData.voterCount ?? 0,
        registrationDate: initialData.registrationDate || '',
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
    const filledCandidates = data.candidateEntries.filter((candidate) => candidate.name.trim())
    const filledCandidateCount = filledCandidates.length

    if (!data.title.trim()) {
      nextErrors.title = 'Nama pemilihan wajib diisi.'
    }

    if (filledCandidateCount < 2) {
      nextErrors.candidateCount = 'Minimal isi 2 kandidat dengan data lengkap (Nama, NPM, Visi, Misi).'
    }

    // Check if filled candidates have all required fields
    const hasIncompleteCandidate = filledCandidates.some(c => 
      !c.studentId?.trim() || 
      !c.vision?.trim() || 
      (Array.isArray(c.mission) ? c.mission.length === 0 : !c.mission?.trim())
    )

    if (hasIncompleteCandidate && !nextErrors.candidateCount) {
      nextErrors.candidateCount = 'Pastikan NPM, Visi, dan Misi setiap kandidat sudah diisi.'
    }

    // Check for duplicate NPM among filled candidates
    const filledStudentIds = filledCandidates
      .map((c) => c.studentId?.trim())
      .filter(Boolean)
    const duplicateStudentId = filledStudentIds.find((id, idx) => filledStudentIds.indexOf(id) !== idx)
    if (duplicateStudentId && !nextErrors.candidateCount) {
      nextErrors.candidateCount = `NPM/NIM ${duplicateStudentId} sudah digunakan oleh kandidat lain dalam pemilihan yang sama.`
    }

    if (!data.registrationDate) nextErrors.registrationDate = 'Wajib diisi.'
    if (!data.commitDate) nextErrors.commitDate = 'Wajib diisi.'
    if (!data.endedDate) nextErrors.endedDate = 'Wajib diisi.'

    if (data.registrationDate && data.commitDate) {
      const registrationTime = new Date(data.registrationDate).getTime()
      const commitTime = new Date(data.commitDate).getTime()
      if (registrationTime >= commitTime) {
        nextErrors.dateRange = 'Mulai Persiapan harus sebelum Mulai Pencoblosan.'
      }
    }

    if (data.commitDate && data.endedDate) {
      const commitTime = new Date(data.commitDate).getTime()
      const endedTime = new Date(data.endedDate).getTime()

      if (endedTime <= commitTime) {
        nextErrors.dateRange = 'Selesai harus setelah Mulai Pencoblosan.'
      } else {
        const minGap = MIN_GAP_MINUTES * 60 * 1000
        if (endedTime - commitTime < minGap) {
          nextErrors.dateRange = 'Jarak antara mulai dan selesai minimal 1 menit.'
        }
      }
    }

    return nextErrors
  }

  const getCandidateMissingFields = (candidate: ProposalCandidateInput) => {
    const missingFields: string[] = []
    if (!candidate.name.trim()) missingFields.push('Nama lengkap')
    if (!candidate.studentId?.trim()) missingFields.push('NPM/NIM')
    if (!candidate.vision?.trim()) missingFields.push('Visi')
    if (Array.isArray(candidate.mission) ? candidate.mission.length === 0 : !candidate.mission?.trim()) missingFields.push('Misi')
    return missingFields
  }

  const getCandidateFirstMissingFieldKey = (index: number, candidate: ProposalCandidateInput) => {
    if (!candidate.name.trim()) return `candidate-${index}-name`
    if (!candidate.studentId?.trim()) return `candidate-${index}-studentId`
    if (!candidate.vision?.trim()) return `candidate-${index}-vision`
    if (Array.isArray(candidate.mission) ? candidate.mission.length === 0 : !candidate.mission?.trim()) return `candidate-${index}-mission`
    return `candidate-${index}-name`
  }

  const getValidationIssues = (data: ProposalFormData, nextErrors: ProposalFormErrors): ValidationIssue[] => {
    const issues: ValidationIssue[] = []

    if (nextErrors.candidateCount) issues.push({ fieldKey: 'candidates', label: 'Kandidat', message: nextErrors.candidateCount })
    if (nextErrors.title) issues.push({ fieldKey: 'title', label: 'Nama Pemilihan', message: nextErrors.title })
    if (nextErrors.registrationDate) issues.push({ fieldKey: 'registrationDate', label: 'Mulai Persiapan', message: 'Tanggal dan jam mulai persiapan wajib diisi.' })
    if (nextErrors.commitDate) issues.push({ fieldKey: 'commitDate', label: 'Mulai Pencoblosan', message: 'Tanggal dan jam mulai pencoblosan wajib diisi.' })
    if (nextErrors.endedDate) issues.push({ fieldKey: 'endedDate', label: 'Selesai Pemilihan', message: 'Tanggal dan jam selesai pemilihan wajib diisi.' })
    if (nextErrors.dateRange) issues.push({ fieldKey: 'commitDate', label: 'Urutan Waktu', message: nextErrors.dateRange })

    data.candidateEntries.forEach((candidate, index) => {
      const missingFields = getCandidateMissingFields(candidate)
      if (missingFields.length === 0) return

      const hasAnyCandidateValue = Boolean(
        candidate.name.trim()
        || candidate.studentId?.trim()
        || candidate.faculty?.trim()
        || candidate.bio?.trim()
        || candidate.vision?.trim()
        || (Array.isArray(candidate.mission) ? candidate.mission.length > 0 : candidate.mission?.trim())
        || candidate.youtubeUrl?.trim()
        || candidate.avatarPath?.trim()
      )

      const namedCandidatesCount = data.candidateEntries.filter((entry) => entry.name.trim()).length
      if (!hasAnyCandidateValue && namedCandidatesCount >= 2) return

      issues.push({
        fieldKey: getCandidateFirstMissingFieldKey(index, candidate),
        label: `Kandidat ${index + 1}`,
        message: `${missingFields.join(', ')} wajib diisi.`,
      })
    })

    return issues
  }

  const focusFirstValidationIssue = (issues: ValidationIssue[]) => {
    const firstIssue = issues[0]
    if (!firstIssue) return

    window.requestAnimationFrame(() => {
      const target = document.querySelector(`[data-validation-field="${firstIssue.fieldKey}"]`)
      if (!target) return

      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (target instanceof HTMLElement) target.focus({ preventScroll: true })
    })
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
      setValidationIssues([])
      return next
    })
  }

  const handleCandidateChange = (index: number, field: keyof ProposalCandidateInput, value: string) => {
    if (isReadOnly) return
    setFormData((prev) => {
      const nextEntries = prev.candidateEntries.map((c, i) => i === index ? { ...c, [field]: value } : c)
      setValidationIssues([])
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

  const processBannerImageFile = (file: File) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp' || /\.(jpe?g|png|webp)$/i.test(file.name)
    if (!isImage) {
      showToast({
        title: 'Format banner belum didukung',
        description: 'Gunakan gambar banner dalam format JPG, PNG, atau WebP.',
        tone: 'error',
      })
      return
    }

    if (file.size > MAX_BANNER_IMAGE_SIZE) {
      showToast({
        title: 'Ukuran banner terlalu besar',
        description: 'Maksimal ukuran banner adalah 5 MB.',
        tone: 'error',
      })
      return
    }

    setBannerImageFile(file)
    setBannerImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  const handleBannerImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!file) return
    processBannerImageFile(file)
  }

  const handleBannerImageDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    if (isReadOnly) return
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    processBannerImageFile(file)
  }

  const removeBannerImage = () => {
    if (isReadOnly) return
    setBannerImageFile(null)
    setBannerImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setFormData((prev) => ({ ...prev, bannerImagePath: '' }))
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
      const issues = getValidationIssues(formData, nextErrors)
      setErrors(nextErrors)
      setValidationIssues(issues)
      focusFirstValidationIssue(issues)
      showToast({
        title: 'Gagal validasi',
        description: issues.length > 0 ? `Lengkapi: ${issues.slice(0, 3).map((issue) => issue.label).join(', ')}${issues.length > 3 ? ', dan lainnya.' : '.'}` : 'Cek kembali isian formulir.',
        tone: 'error',
      })
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

    let bannerImagePath = formData.bannerImagePath
    if (bannerImageFile) {
      setIsUploadingBannerImage(true)
      try {
        bannerImagePath = await uploadCandidateAsset.mutateAsync({
          file: bannerImageFile,
          candidateId: 'banner',
          electionId: proposalId ?? 'proposal-drafts',
        })
      } catch (error) {
        showToast({
          title: 'Gagal mengunggah banner',
          description: error instanceof Error ? error.message : 'Coba unggah ulang gambar banner.',
          tone: 'error',
        })
        setIsUploadingBannerImage(false)
        return
      } finally {
        setIsUploadingBannerImage(false)
      }
    }

    // Always merge picker selections AND text area entries (not mutually exclusive)
    const textWallets = formData.whitelistWallets
      .split('\n')
      .map((wallet) => wallet.trim())
      .filter((wallet) => wallet && isAddress(wallet))
      .map((wallet) => wallet.toLowerCase())
    const allWhitelistWallets = Array.from(new Set([...selectedWhitelistWallets, ...textWallets]))

    saveProposalDraft.mutate({
      id: proposalId,
      title: formData.title,
      organizationName: formData.category || 'Organisasi',
      description: formData.description,
      bannerImagePath: bannerImagePath || null,
      candidateCount: candidateEntries.length,
      registrationStartAt: formData.registrationDate ? new Date(formData.registrationDate).toISOString() : null,
      commitStartAt: new Date(formData.commitDate).toISOString(),
      revealStartAt: new Date(
        (new Date(formData.commitDate).getTime() + new Date(formData.endedDate).getTime()) / 2
      ).toISOString(),
      endedAt: new Date(formData.endedDate).toISOString(),
      status: submitStatus,
      candidates: candidateEntries,
      whitelistEntries: allWhitelistWallets.length > 0
        ? allWhitelistWallets.map((wallet) => ({ walletAddress: wallet }))
        : undefined,
    }, {
      onSuccess: async (proposal) => {
        clearDraft()
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
        {extraActions ? <div className="flex items-center gap-3">{extraActions}</div> : null}
      </div>

      {/* ── Step Indicator (stepper mode) ── */}
      {stepper && (
        <div className="mb-10">
          <div className="flex items-center justify-center">
            {STEP_LABELS.map((label, index) => (
              <div key={label} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition-colors ${
                    currentStep > index
                      ? 'bg-slate-900 text-white'
                      : currentStep === index
                        ? 'border-2 border-slate-900 bg-white text-slate-900'
                        : 'border border-slate-200 bg-white text-slate-400'
                  }`}>
                    {currentStep > index ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className={`text-[13px] font-medium hidden sm:inline ${currentStep >= index ? 'text-slate-900' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {index < STEP_LABELS.length - 1 && (
                  <div className={`mx-3 h-px w-8 sm:w-16 ${currentStep > index ? 'bg-slate-900' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 0: Informasi Umum ── */}
      {(!stepper || currentStep === 0) && (
        <div className="space-y-10">
          <div>
            {validationIssues.length > 0 ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold">Lengkapi field berikut sebelum mengajukan proposal:</p>
                    <ul className="mt-2 space-y-1 text-[12px] leading-6">
                      {validationIssues.map((issue) => (
                        <li key={`${issue.fieldKey}-${issue.message}`}>• <strong>{issue.label}:</strong> {issue.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            <section className="space-y-4">
              <h2 className="text-[14px] font-bold uppercase tracking-widest">Informasi Dasar</h2>
              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Nama Pemilihan <RequiredAsterisk /></span>
                  <input data-validation-field="title" name="title" value={formData.title} onChange={handleChange} disabled={isReadOnly} placeholder="Masukkan nama pemilihan..." maxLength={100} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                  {errors.title && <p className="mt-1 text-[12px] text-red-500">{errors.title}</p>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Deskripsi</span>
                  <textarea name="description" value={formData.description} onChange={handleChange} disabled={isReadOnly} placeholder="Tuliskan deskripsi pemilihan..." maxLength={2000} className="h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                </label>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="block text-[12px] font-semibold text-slate-600">Banner Pemilihan <span className="font-normal text-slate-400">(opsional)</span></span>
                      <p className="mt-1 text-[12px] leading-5 text-slate-400">Gambar akan tampil sebagai background card dengan linear-gradient overlay.</p>
                    </div>
                    {(bannerImagePreview || formData.bannerImagePath) && !isReadOnly ? (
                      <button type="button" onClick={removeBannerImage} className="inline-flex h-9 items-center justify-center rounded-xl text-[13px] font-medium text-red-600 hover:bg-red-50">
                        Hapus banner
                      </button>
                    ) : null}
                  </div>
                  <label
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleBannerImageDrop}
                    className="group block cursor-pointer rounded-2xl focus-within:outline-none focus-within:ring-4 focus-within:ring-slate-900/5"
                  >
                    <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={handleBannerImageChange} disabled={isReadOnly} />
                    <BannerPreviewCard
                      imageUrl={bannerImagePreview ?? formData.bannerImagePath}
                      title={formData.title || 'Nama Pemilihan'}
                      description={formData.description || 'Deskripsi singkat pemilihan akan tampil di area ini.'}
                      isReadOnly={isReadOnly}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-10">
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
              <div>
                <h2 className="text-[14px] font-bold uppercase tracking-widest">Jadwal Pemilihan</h2>
                <p className="mt-2 text-[14px] leading-6 text-slate-500">
                  Atur kapan persiapan dimulai, kapan pencoblosan dimulai, dan kapan pemilihan selesai. Konfirmasi suara (reveal) akan dimulai otomatis di tengah jangka waktu pencoblosan.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-[13px] leading-6 text-blue-800">
                Tahap persiapan (registration) adalah waktu untuk menyiapkan daftar pemilih sebelum pencoblosan dibuka. Tahap konfirmasi suara (reveal) dihitung otomatis sebagai titik tengah antara mulai pencoblosan dan selesai pemilihan.
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Mulai Persiapan <RequiredAsterisk /></span>
                  <input data-validation-field="registrationDate" type="datetime-local" name="registrationDate" value={formData.registrationDate} onChange={handleChange} disabled={isReadOnly} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                  <p className="mt-1.5 text-[12px] leading-5 text-slate-500">Admin mulai menyiapkan daftar pemilih (whitelist).</p>
                  {errors.registrationDate && <p className="mt-1 text-[12px] text-red-500">{errors.registrationDate}</p>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Mulai Pencoblosan <RequiredAsterisk /></span>
                  <input data-validation-field="commitDate" type="datetime-local" name="commitDate" value={formData.commitDate} onChange={handleChange} disabled={isReadOnly} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                  <p className="mt-1.5 text-[12px] leading-5 text-slate-500">Pemilih mulai bisa memilih dan mengunci suara.</p>
                  {errors.commitDate && <p className="mt-1 text-[12px] text-red-500">{errors.commitDate}</p>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Selesai Pemilihan <RequiredAsterisk /></span>
                  <input data-validation-field="endedDate" type="datetime-local" name="endedDate" value={formData.endedDate} onChange={handleChange} disabled={isReadOnly} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                  <p className="mt-1.5 text-[12px] leading-5 text-slate-500">Hasil akhir ditutup dan siap diaudit.</p>
                  {errors.endedDate && <p className="mt-1 text-[12px] text-red-500">{errors.endedDate}</p>}
                </label>
              </div>
              {formData.commitDate && formData.endedDate && new Date(formData.endedDate).getTime() > new Date(formData.commitDate).getTime() && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] leading-6 text-slate-600">
                  <span className="font-medium text-slate-700">Konfirmasi suara (reveal)</span> otomatis dimulai pada{' '}
                  <span className="font-medium text-slate-900">
                    {new Date(
                      (new Date(formData.commitDate).getTime() + new Date(formData.endedDate).getTime()) / 2
                    ).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {errors.dateRange && <p className="text-red-500 text-[12px]">{errors.dateRange}</p>}
            </section>
          </div>
        </div>
      )}

      {/* ── Step 1: Kandidat ── */}
      {(!stepper || currentStep === 1) && (
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
                    <p className="mt-0.5 text-[12px] text-slate-400">Foto, identitas, bio, visi, misi, dan media kandidat.</p>
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
                    <input data-validation-field={`candidate-${i}-name`} value={c.name} onChange={e => handleCandidateChange(i, 'name', e.target.value)} disabled={isReadOnly} placeholder="Contoh: Daniel Noveno" maxLength={100} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">NPM/NIM <RequiredAsterisk /></span>
                    <input data-validation-field={`candidate-${i}-studentId`} value={c.studentId || ''} onChange={e => handleCandidateChange(i, 'studentId', e.target.value.replace(/[^0-9]/g, ''))} disabled={isReadOnly} placeholder="Contoh: 220711663" inputMode="numeric" pattern="[0-9]*" maxLength={10} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Fakultas <span className="font-normal text-slate-400">(opsional)</span></span>
                    <div className="relative">
                      <select value={c.faculty || ''} onChange={e => handleCandidateChange(i, 'faculty', e.target.value)} disabled={isReadOnly} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400">
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
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Link video YouTube <span className="font-normal text-slate-400">(opsional)</span></span>
                    <input value={c.youtubeUrl || ''} onChange={e => handleCandidateChange(i, 'youtubeUrl', e.target.value)} disabled={isReadOnly} placeholder="https://youtube.com/..." maxLength={255} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 disabled:bg-slate-100 disabled:text-slate-400" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Bio singkat <span className="font-normal text-slate-400">(opsional)</span></span>
                    <RichTextEditor value={c.bio || ''} onChange={(value) => handleCandidateChange(i, 'bio', value)} disabled={isReadOnly} placeholder="Tuliskan latar belakang atau pengalaman organisasi kandidat secara singkat." minHeightClassName="min-h-[96px]" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Visi kandidat <RequiredAsterisk /></span>
                    <RichTextEditor dataValidationField={`candidate-${i}-vision`} value={c.vision || ''} onChange={(value) => handleCandidateChange(i, 'vision', value)} disabled={isReadOnly} placeholder="Tuliskan visi utama kandidat secara ringkas." minHeightClassName="min-h-[96px]" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Misi kandidat <RequiredAsterisk /></span>
                    <RichTextEditor dataValidationField={`candidate-${i}-mission`} value={Array.isArray(c.mission) ? c.mission.join('\n') : c.mission || ''} onChange={(value) => handleCandidateChange(i, 'mission', value)} disabled={isReadOnly} placeholder="Tulis satu poin misi per baris. Gunakan toolbar untuk membuat numbering atau bullet." minHeightClassName="min-h-[120px]" />
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
      )}

      {/* ── Step 2: Whitelist (Master Voter Selection) ── */}
      {(!stepper || currentStep === 2) && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Whitelist Pemilih</h2>
              <p className="mt-1 text-[14px] leading-6 text-slate-600">
                Pilih pemilih dari daftar data master yang sudah terdaftar. Wallet address akan otomatis diambil dari data pemilih.
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {selectedWhitelistVoterIds.size} dipilih
            </span>
          </div>

          {/* Search & Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={voterSearch}
                onChange={(e) => setVoterSearch(e.target.value)}
                placeholder="Cari berdasarkan NPM, nama, atau email..."
                maxLength={100}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-[14px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowVoterFilters(!showVoterFilters)}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-200"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter Prodi
                {voterFilterProdi && (
                  <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                    {voterFilterProdi}
                  </span>
                )}
              </button>
              <span className="text-[12px] text-slate-500">
                {allMasterVoters.length} data ditemukan
              </span>
            </div>
            {showVoterFilters && (
              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <button
                  type="button"
                  onClick={() => setVoterFilterProdi('')}
                  className={`inline-flex h-8 items-center rounded-xl px-3 text-[12px] font-medium transition ${
                    !voterFilterProdi ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semua
                </button>
                {prodiOptions.map((prodi) => (
                  <button
                    key={prodi}
                    type="button"
                    onClick={() => setVoterFilterProdi(prodi === voterFilterProdi ? '' : prodi)}
                    className={`inline-flex h-8 items-center rounded-xl px-3 text-[12px] font-medium transition ${
                      voterFilterProdi === prodi ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {prodi}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected summary */}
          {selectedWhitelistVoterIds.size > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
              <span className="text-[13px] font-medium text-blue-800">
                {selectedWhitelistVoterIds.size} pemilih dipilih untuk whitelist
              </span>
              <button
                type="button"
                onClick={() => setSelectedWhitelistVoterIds(new Set())}
                className="text-[12px] font-medium text-blue-600 hover:text-blue-800"
              >
                Batalkan Semua
              </button>
            </div>
          )}

          {/* Voter list */}
          <div className="max-h-[480px] overflow-y-auto rounded-2xl border border-slate-100">
            {masterVotersQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                <span className="ml-2 text-[13px] text-slate-500">Memuat data pemilih...</span>
              </div>
            ) : allMasterVoters.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-[14px] text-slate-500">Tidak ada data pemilih ditemukan.</p>
                <p className="mt-1 text-[12px] text-slate-400">Tambahkan data master voter terlebih dahulu di halaman superadmin.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allMasterVoters.map((voter) => {
                  const isSelected = selectedWhitelistVoterIds.has(voter.id)
                  const hasWallet = Boolean(voter.walletAddress)
                  const initials = voter.fullName.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'VT'
                  return (
                    <label
                      key={voter.id}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                        isSelected ? 'bg-blue-50/50' : ''
                      } ${!hasWallet ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!hasWallet}
                        onChange={() => {
                          if (!hasWallet) return
                          setSelectedWhitelistVoterIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(voter.id)) next.delete(voter.id)
                            else next.add(voter.id)
                            return next
                          })
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-slate-900">{voter.fullName}</span>
                          {voter.prodi && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              {voter.prodi}
                            </span>
                          )}
                          {voter.angkatan && (
                            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-400">
                              {voter.angkatan}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-500">
                          <span className="font-mono">{voter.nim}</span>
                          <span>·</span>
                          <span className="truncate">{voter.email}</span>
                          {voter.walletAddress && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-[11px]">{voter.walletAddress.slice(0, 6)}...{voter.walletAddress.slice(-4)}</span>
                            </>
                          )}
                        </div>
                        {!hasWallet && (
                          <p className="mt-0.5 text-[11px] text-amber-600">Belum memiliki wallet address</p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Navigation Buttons (stepper mode) ── */}
      {stepper && (
        <div className={`flex items-center pt-4 ${currentStep < STEP_LABELS.length - 1 ? 'justify-between' : 'justify-center'}`}>
          {currentStep < STEP_LABELS.length - 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sebelumnya
            </button>
          )}
          {currentStep < STEP_LABELS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (canAdvanceStep(currentStep)) {
                  setCurrentStep((s) => s + 1)
                  setValidationIssues([])
                } else {
                  const nextErrors = validateForm(formData)
                  const issues = getValidationIssues(formData, nextErrors)
                  setErrors(nextErrors)
                  setValidationIssues(issues)
                  showToast({
                    title: 'Lengkapi field pada langkah ini',
                    description: issues.length > 0 ? `${issues[0].label}: ${issues[0].message}` : 'Isi field yang wajib diisi terlebih dahulu.',
                    tone: 'error',
                  })
                }
              }}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-6 text-[14px] font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selanjutnya
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-8 text-[14px] font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {isUploadingBannerImage ? 'Mengunggah banner...' : isUploadingCandidatePhotos ? 'Mengunggah foto...' : isUploadingDocument ? 'Mengunggah dokumen...' : saveProposalDraft.isPending ? 'Menyimpan...' : submitLabel}
            </button>
          )}
        </div>
      )}
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

function BannerPreviewCard({ imageUrl, title, description, isReadOnly }: { imageUrl?: string | null; title: string; description: string; isReadOnly: boolean }) {
  return (
    <div
      className="relative min-h-[190px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 bg-cover bg-center transition-colors duration-150 group-hover:border-slate-300"
      style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.96)_0%,rgba(15,23,42,0.84)_42%,rgba(15,23,42,0.62)_70%,rgba(15,23,42,0.48)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(110,231,183,0.16),transparent_30%)]" />
      <div className="relative flex min-h-[190px] flex-col justify-between p-6 text-white sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-100">Preview Banner</span>
          {!isReadOnly ? <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-100">Klik untuk ganti gambar</span> : null}
        </div>
        <div className="max-w-[520px] pt-10">
          <h3 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[30px]">{title}</h3>
          <p className="mt-3 line-clamp-2 text-[14px] leading-6 text-slate-200">{description}</p>
          <div className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-[13px] font-medium text-white">
            <FileImage className="h-4 w-4" />
            {imageUrl ? 'Gradient overlay aktif' : 'Unggah gambar banner'}
          </div>
        </div>
      </div>
    </div>
  )
}
