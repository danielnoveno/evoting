'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { Save, Users, UserCheck, Shield, CheckCircle2, Network, Clock, ShieldCheck, ArrowLeft } from 'lucide-react'
import { ScrollReveal } from '@/components/public/parallax'
import { useSaveProposalDraft } from '@/hooks/use-save-proposal-draft'
import { getRepositoryErrorMessage } from '@/lib/repositories/errors'
import type { ProposalCandidateInput } from '@/lib/repositories/types'

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
  avatarPath: '',
}

type ProposalFormErrors = Partial<Record<'title' | 'candidateCount' | 'voterCount' | 'commitDate' | 'revealDate' | 'endedDate' | 'dateRange', string>>

const MIN_GAP_MINUTES = 60

interface ProposalFormProps {
  proposalId?: string
  initialData?: Partial<ProposalFormData>
  isReadOnly?: boolean
  pageTitle: string
  pageDescription: string
  submitLabel?: string
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
  submitLabel = 'Simpan Proposal',
  successMessageTitle = 'Proposal Berhasil Disimpan',
  successMessageDesc = 'Data proposal telah tersimpan dan siap ditinjau.',
  extraActions
}: ProposalFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const saveProposalDraft = useSaveProposalDraft()
  
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

    if (!data.title.trim()) {
      nextErrors.title = 'Nama pemilihan wajib diisi.'
    }

    if (Number(data.candidateCount) < 2) {
      nextErrors.candidateCount = 'Minimal harus ada 2 kandidat.'
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

  const handleSubmit = () => {
    if (isReadOnly) return
    const nextErrors = validateForm(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      showToast({ title: 'Gagal validasi', description: 'Cek kembali isian formulir.', tone: 'error' })
      return
    }

    saveProposalDraft.mutate({
      id: proposalId,
      title: formData.title,
      organizationName: formData.category,
      description: formData.description,
      candidateCount: formData.candidateCount,
      commitStartAt: new Date(formData.commitDate).toISOString(),
      revealStartAt: new Date(formData.revealDate).toISOString(),
      endedAt: new Date(formData.endedDate).toISOString(),
      status: 'draft',
      candidates: formData.candidateEntries.filter(c => c.name.trim()),
      whitelistEntries: formData.whitelistWallets.split('\n').filter(Boolean).map(w => ({ walletAddress: w.trim() }))
    }, {
      onSuccess: () => {
        showToast({ title: successMessageTitle, description: successMessageDesc, tone: 'success' })
        router.push('/admin/daftar-proposal')
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
            <button onClick={handleSubmit} disabled={saveProposalDraft.isPending} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-black px-6 text-white">
              <Save className="h-4 w-4" /> {saveProposalDraft.isPending ? 'Saving...' : submitLabel}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-[14px] font-bold uppercase tracking-widest">Informasi Dasar</h2>
            <div className="grid gap-4">
              <input name="title" value={formData.title} onChange={handleChange} disabled={isReadOnly} placeholder="Nama Pemilihan" className="h-12 w-full rounded-xl bg-slate-100 px-4" />
              <textarea name="description" value={formData.description} onChange={handleChange} disabled={isReadOnly} placeholder="Deskripsi" className="h-32 w-full rounded-xl bg-slate-100 p-4" />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-[14px] font-bold uppercase tracking-widest">Parameter Waktu On-Chain</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Mulai Commit</label>
                <input type="datetime-local" name="commitDate" value={formData.commitDate} onChange={handleChange} disabled={isReadOnly} className="h-12 w-full rounded-xl bg-slate-100 px-4" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Mulai Reveal</label>
                <input type="datetime-local" name="revealDate" value={formData.revealDate} onChange={handleChange} disabled={isReadOnly} className="h-12 w-full rounded-xl bg-slate-100 px-4" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500">Selesai (Off-Chain)</label>
                <input type="datetime-local" name="endedDate" value={formData.endedDate} onChange={handleChange} disabled={isReadOnly} className="h-12 w-full rounded-xl bg-slate-100 px-4" />
              </div>
            </div>
            {errors.dateRange && <p className="text-red-500 text-[12px]">{errors.dateRange}</p>}
          </section>

          <section className="space-y-4">
            <h2 className="text-[14px] font-bold uppercase tracking-widest">Kandidat</h2>
            {formData.candidateEntries.map((c, i) => (
              <div key={i} className="rounded-xl border p-4 grid gap-3">
                <input value={c.name} onChange={e => handleCandidateChange(i, 'name', e.target.value)} disabled={isReadOnly} placeholder="Nama Lengkap" className="h-10 w-full rounded-lg bg-slate-50 px-3" />
                <input value={c.vision || ''} onChange={e => handleCandidateChange(i, 'vision', e.target.value)} disabled={isReadOnly} placeholder="Visi Singkat" className="h-10 w-full rounded-lg bg-slate-50 px-3" />
              </div>
            ))}
            {!isReadOnly && <button onClick={() => setFormData(p => ({...p, candidateEntries: [...p.candidateEntries, EMPTY_CANDIDATE]}))} className="text-blue-600">+ Tambah</button>}
          </section>
        </div>
        
        <aside className="space-y-6">
           <div className="rounded-3xl bg-slate-900 p-8 text-white">
              <ShieldCheck className="h-10 w-10 text-emerald-400 mb-6" />
              <h3 className="text-[20px] font-bold">Hardened Logic</h3>
              <p className="mt-4 text-slate-400 leading-7">Parameter waktu akan dikunci di blockchain untuk menjamin pemilihan tidak dapat dimanipulasi setelah dimulai.</p>
           </div>
        </aside>
      </div>
    </ScrollReveal>
  )
}
