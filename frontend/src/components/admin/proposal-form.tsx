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

type ProposalFormErrors = Partial<Record<'title' | 'candidateCount' | 'voterCount' | 'commitDate' | 'revealDate' | 'dateRange', string>>

const MIN_REVEAL_GAP_MINUTES = 60

interface ProposalFormProps {
  proposalId?: string
  initialData?: Partial<ProposalFormData>
  isReadOnly?: boolean
  pageTitle: string
  pageDescription: string
  submitLabel?: string
  successMessageTitle?: string
  successMessageDesc?: string
}

export function ProposalForm({
  proposalId,
  initialData,
  isReadOnly = false,
  pageTitle,
  pageDescription,
  submitLabel = 'Simpan Proposal',
  successMessageTitle = 'Proposal Berhasil Disimpan',
  successMessageDesc = 'Data proposal telah tersimpan dan siap ditinjau.'
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
    candidateEntries: initialData?.candidateEntries || [EMPTY_CANDIDATE, EMPTY_CANDIDATE],
    whitelistWallets: initialData?.whitelistWallets || '',
  })
  const [errors, setErrors] = useState<ProposalFormErrors>({})

  useEffect(() => {
    setFormData({
      title: initialData?.title || '',
      category: initialData?.category || 'Internal Organisasi',
      description: initialData?.description || '',
      candidateCount: initialData?.candidateCount ?? 2,
      voterCount: initialData?.voterCount ?? 0,
      commitDate: initialData?.commitDate || '',
      revealDate: initialData?.revealDate || '',
      candidateEntries: initialData?.candidateEntries || [EMPTY_CANDIDATE, EMPTY_CANDIDATE],
      whitelistWallets: initialData?.whitelistWallets || '',
    })
  }, [initialData])

  const validateForm = (data: ProposalFormData) => {
    const nextErrors: ProposalFormErrors = {}

    if (!data.title.trim()) {
      nextErrors.title = 'Nama pemilihan wajib diisi.'
    } else if (data.title.trim().length > 80) {
      nextErrors.title = 'Nama pemilihan maksimal 80 karakter.'
    }

    if (Number(data.candidateCount) < 2) {
      nextErrors.candidateCount = 'Minimal harus ada 2 kandidat.'
    }

    if (Number(data.voterCount) < 0) {
      nextErrors.voterCount = 'Jumlah pemilih tidak boleh kurang dari 0.'
    }

    if (!data.commitDate) {
      nextErrors.commitDate = 'Jadwal commit wajib diisi.'
    }

    if (!data.revealDate) {
      nextErrors.revealDate = 'Jadwal reveal wajib diisi.'
    }

    if (data.commitDate && data.revealDate) {
      const commitTime = new Date(data.commitDate).getTime()
      const revealTime = new Date(data.revealDate).getTime()

      if (Number.isFinite(commitTime) && Number.isFinite(revealTime) && revealTime <= commitTime) {
        nextErrors.dateRange = 'Jadwal reveal harus setelah jadwal commit.'
      } else if (Number.isFinite(commitTime) && Number.isFinite(revealTime)) {
        const minGap = MIN_REVEAL_GAP_MINUTES * 60 * 1000
        if (revealTime - commitTime < minGap) {
          nextErrors.dateRange = 'Jadwal reveal minimal 1 jam setelah jadwal commit.'
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
      const nextEntries = prev.candidateEntries.map((candidate, candidateIndex) => (
        candidateIndex === index ? { ...candidate, [field]: value } : candidate
      ))

      const next = {
        ...prev,
        candidateEntries: nextEntries,
        candidateCount: nextEntries.filter((candidate) => candidate.name.trim()).length,
      }

      setErrors(validateForm(next))
      return next
    })
  }

  const handleAddCandidateRow = () => {
    if (isReadOnly) return

    setFormData((prev) => ({
      ...prev,
      candidateEntries: [...prev.candidateEntries, { ...EMPTY_CANDIDATE }],
    }))
  }

  const handleRemoveCandidateRow = (index: number) => {
    if (isReadOnly) return

    setFormData((prev) => {
      const nextEntries = prev.candidateEntries.filter((_, candidateIndex) => candidateIndex !== index)
      const safeEntries = nextEntries.length > 0 ? nextEntries : [{ ...EMPTY_CANDIDATE }]
      const next = {
        ...prev,
        candidateEntries: safeEntries,
        candidateCount: safeEntries.filter((candidate) => candidate.name.trim()).length,
      }
      setErrors(validateForm(next))
      return next
    })
  }

  const handleSubmit = () => {
    if (isReadOnly) return

    const nextErrors = validateForm(formData)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      showToast({
        title: 'Gagal menyimpan proposal',
        description: nextErrors.dateRange ?? 'Pastikan nama pemilihan, jadwal commit, dan jadwal reveal sudah benar.',
        tone: 'error'
      })
      return
    }

    saveProposalDraft.mutate(
      {
        id: proposalId,
        title: formData.title,
        organizationName: formData.category,
        description: formData.description,
        candidateCount: formData.candidateCount,
        commitStartAt: formData.commitDate ? new Date(formData.commitDate).toISOString() : null,
        revealStartAt: formData.revealDate ? new Date(formData.revealDate).toISOString() : null,
        status: 'draft',
        candidates: formData.candidateEntries
          .map((candidate) => ({
            name: candidate.name.trim(),
            studentId: candidate.studentId?.trim() || null,
            faculty: candidate.faculty?.trim() || null,
            bio: candidate.bio?.trim() || null,
            vision: candidate.vision?.trim() || null,
            avatarPath: candidate.avatarPath?.trim() || null,
          }))
          .filter((candidate) => candidate.name.length > 0),
        whitelistEntries: formData.whitelistWallets
          .split('\n')
          .map((walletAddress) => walletAddress.trim())
          .filter(Boolean)
          .map((walletAddress) => ({ walletAddress })),
      },
      {
        onSuccess: () => {
          showToast({
            title: successMessageTitle,
            description: successMessageDesc,
            tone: 'success'
          })

          setTimeout(() => {
            router.push('/admin/daftar-proposal')
          }, 900)
        },
        onError: (error) => {
          showToast({
            title: 'Gagal menyimpan proposal',
            description: getRepositoryErrorMessage(error, 'Simpan proposal live belum tersedia untuk sesi ini.'),
            tone: 'error'
          })
        },
      },
    )
  }

  const handleCancel = () => {
    router.push('/admin/daftar-proposal')
  }

  return (
    <ScrollReveal variant="fade-up" duration={700}>
    <div>
      <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between mb-10">
        <div className="max-w-[760px]">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[48px]">{pageTitle}</h1>
          </div>
          <p className="mt-4 text-[16px] leading-8 text-slate-800">
            {pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saveProposalDraft.isPending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-6 text-[15px] font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              <Save className="h-5 w-5" />
              {saveProposalDraft.isPending ? 'Menyimpan...' : submitLabel}
            </button>
          )}
        </div>
      </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px]">

         <div className="space-y-10">
            <section className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1.5 bg-black rounded-full" />
              <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] text-slate-900">INFORMASI DASAR</h2>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="proposal-title" className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">NAMA PEMILIHAN</label>
              <input 
                id="proposal-title"
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={isReadOnly}
                placeholder="Contoh: Pemilihan Ketua Umum 2024" 
                 className={`w-full h-12 rounded-xl border px-4 text-[15px] text-slate-900 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-70 ${errors.title ? 'border-red-500 bg-red-50/40 focus:border-red-500' : 'border-transparent bg-slate-100/80 focus:border-slate-300 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-slate-900/10`}
               />
               {errors.title ? <p className="text-[12px] text-red-600">{errors.title}</p> : null}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">KATEGORI</label>
              <div className="relative">
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isReadOnly}
                   className="w-full h-12 appearance-none rounded-xl border border-transparent bg-slate-100/80 px-4 text-[15px] text-slate-900 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-70 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                 >
                  <option value="Internal Organisasi">Internal Organisasi</option>
                  <option value="Pemilihan Umum">Pemilihan Umum</option>
                  <option value="Pendidikan">Pendidikan</option>
                  <option value="Survei Terbuka">Survei Terbuka</option>
                  <option value="Universitas">Universitas</option>
                  <option value="Keuangan">Keuangan</option>
                </select>
                {!isReadOnly && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">DESKRIPSI</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={isReadOnly}
                placeholder="Jelaskan tujuan dan mekanisme pemilihan ini secara detail..." 
                 className="h-32 w-full resize-none rounded-xl border border-transparent bg-slate-100/80 p-4 text-[15px] text-slate-900 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-70 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
               />
             </div>
           </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1.5 bg-black rounded-full" />
              <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] text-slate-900">ESTIMASI & KAPASITAS</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">JUMLAH KANDIDAT</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="candidateCount"
                    min="2"
                    value={formData.candidateCount}
                    onChange={handleChange}
                    disabled={isReadOnly}
                     className={`h-14 w-full rounded-xl border bg-slate-100/80 pl-4 pr-12 text-[20px] font-semibold text-slate-900 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-70 ${errors.candidateCount ? 'border-red-500 bg-red-50/40 focus:border-red-500' : 'border-transparent focus:border-slate-300 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-slate-900/10`}
                   />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[12px] italic text-slate-500 mt-2">Minimal 2 kandidat untuk pemilihan valid.</p>
                {errors.candidateCount ? <p className="text-[12px] text-red-600">{errors.candidateCount}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">JUMLAH PEMILIH</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="voterCount"
                    min="0"
                    value={formData.voterCount}
                    onChange={handleChange}
                    disabled={isReadOnly}
                     className={`h-14 w-full rounded-xl border bg-slate-100/80 pl-4 pr-12 text-[20px] font-semibold text-slate-900 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-70 ${errors.voterCount ? 'border-red-500 bg-red-50/40 focus:border-red-500' : 'border-transparent focus:border-slate-300 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-slate-900/10`}
                   />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[12px] italic text-slate-500 mt-2">Estimasi total wallet address yang terdaftar.</p>
                {errors.voterCount ? <p className="text-[12px] text-red-600">{errors.voterCount}</p> : null}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 bg-black rounded-full" />
                <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] text-slate-900">KONFIGURASI TEKNIS BLOCKCHAIN</h2>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-800">
                 Base Sepolia
              </span>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="proposal-commit-date" className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">JADWAL COMMIT</label>
                <input 
                  id="proposal-commit-date"
                  type="datetime-local" 
                  name="commitDate"
                  value={formData.commitDate}
                  onChange={handleChange}
                  disabled={isReadOnly}
                 className={`h-14 w-full rounded-xl border bg-slate-100/80 px-4 text-[15px] font-medium text-slate-900 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-70 ${errors.commitDate ? 'border-red-500 bg-red-50/40 focus:border-red-500' : 'border-transparent focus:border-slate-300 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-slate-900/10`}
                />
                <p className="text-[12px] text-slate-500 mt-2">Fase saat pemilih mengirim commit pilihannya.</p>
                {errors.commitDate ? <p className="text-[12px] text-red-600">{errors.commitDate}</p> : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="proposal-reveal-date" className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">JADWAL REVEAL</label>
                <input 
                  id="proposal-reveal-date"
                  type="datetime-local" 
                  name="revealDate"
                  value={formData.revealDate}
                  onChange={handleChange}
                  disabled={isReadOnly}
                 className={`h-14 w-full rounded-xl border bg-slate-100/80 px-4 text-[15px] font-medium text-slate-900 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-70 ${errors.revealDate || errors.dateRange ? 'border-red-500 bg-red-50/40 focus:border-red-500' : 'border-transparent focus:border-slate-300 focus:bg-white'} focus:outline-none focus:ring-2 focus:ring-slate-900/10`}
                />
                <p className="text-[12px] text-slate-500 mt-2">Fase saat pemilih membuka commit dengan kandidat dan salt yang sama.</p>
                {errors.revealDate ? <p className="text-[12px] text-red-600">{errors.revealDate}</p> : null}
                {errors.dateRange ? <p className="text-[12px] text-red-600 font-semibold">{errors.dateRange}</p> : null}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1.5 bg-black rounded-full" />
              <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] text-slate-900">RELASI PROPOSAL</h2>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">DAFTAR KANDIDAT</label>
              <div className="space-y-3">
                {formData.candidateEntries.map((candidate, index) => (
                  <div key={`candidate-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                      <input
                        type="text"
                        value={candidate.name}
                        onChange={(event) => handleCandidateChange(index, 'name', event.target.value)}
                        disabled={isReadOnly}
                        placeholder={`Nama kandidat ${index + 1}`}
                        className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-900 outline-none focus:border-slate-300"
                      />
                      <input
                        type="text"
                        value={candidate.studentId ?? ''}
                        onChange={(event) => handleCandidateChange(index, 'studentId', event.target.value)}
                        disabled={isReadOnly}
                        placeholder="NIM / ID"
                        className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-900 outline-none focus:border-slate-300"
                      />
                      {!isReadOnly ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveCandidateRow(index)}
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-[13px] font-medium text-slate-700 hover:bg-slate-200"
                        >
                          Hapus
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        value={candidate.faculty ?? ''}
                        onChange={(event) => handleCandidateChange(index, 'faculty', event.target.value)}
                        disabled={isReadOnly}
                        placeholder="Fakultas / Program Studi"
                        className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-900 outline-none focus:border-slate-300"
                      />
                      <input
                        type="text"
                        value={candidate.vision ?? ''}
                        onChange={(event) => handleCandidateChange(index, 'vision', event.target.value)}
                        disabled={isReadOnly}
                        placeholder="Ringkasan visi"
                        className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-900 outline-none focus:border-slate-300"
                      />
                      <input
                        type="text"
                        value={candidate.avatarPath ?? ''}
                        onChange={(event) => handleCandidateChange(index, 'avatarPath', event.target.value)}
                        disabled={isReadOnly}
                        placeholder="Path avatar kandidat"
                        className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-900 outline-none focus:border-slate-300 md:col-span-2"
                      />
                    </div>
                    <textarea
                      value={candidate.bio ?? ''}
                      onChange={(event) => handleCandidateChange(index, 'bio', event.target.value)}
                      disabled={isReadOnly}
                      placeholder="Bio singkat kandidat"
                      className="mt-3 h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-[14px] text-slate-900 outline-none focus:border-slate-300"
                    />
                  </div>
                ))}
              </div>
              {!isReadOnly ? (
                <button
                  type="button"
                  onClick={handleAddCandidateRow}
                  className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 px-4 text-[13px] font-medium text-slate-800 hover:bg-slate-200"
                >
                  + Tambah Kandidat
                </button>
              ) : null}
              <p className="text-[12px] text-slate-500 mt-2">Simpan kandidat sebagai data terstruktur agar relasi proposal lebih mudah ditinjau dan diperbarui.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">DAFTAR PEMILIH (WALLET)</label>
              <textarea
                name="whitelistWallets"
                value={formData.whitelistWallets}
                onChange={handleChange}
                disabled={isReadOnly}
                placeholder="Satu alamat wallet per baris"
                className="h-32 w-full resize-none rounded-xl border border-transparent bg-slate-100/80 p-4 font-mono text-[14px] text-slate-900 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-70 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <p className="text-[12px] text-slate-500 mt-2">Wallet tidak valid akan diabaikan saat sinkronisasi draft whitelist.</p>
            </div>
          </section>

        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[24px] bg-[#1a202c] p-8 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-300">
                 SIAP DITINJAU
              </span>
            </div>

            <h3 className="text-[20px] font-semibold mb-4 relative z-10">Validasi Alur</h3>
            <p className="text-[14px] leading-6 text-slate-300 mb-8 relative z-10">
              Pastikan urutan fase, kapasitas peserta, dan bukti transaksi sudah sesuai sebelum proposal dilanjutkan ke tahap berikutnya.
            </p>

            <div className="space-y-5 relative z-10">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-white mb-1">Urutan fase terjaga</p>
                  <p className="text-[12px] text-slate-400 leading-5">Registrasi, commit, reveal, dan selesai ditampilkan secara terpisah.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-white mb-1">Bukti mudah ditinjau</p>
                  <p className="text-[12px] text-slate-400 leading-5">Hash, waktu, dan tautan audit dapat disiapkan untuk dokumentasi hasil.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">STATUS TINJAUAN</p>
              <div className="flex items-center gap-3">
                <span className="text-[24px] font-mono font-medium">Siap Ditinjau</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Aktif
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-50 border border-slate-100 p-8">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-900 mb-6">KEAMANAN & AUDIT</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <ShieldCheck className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-900 mb-1">Checklist keamanan</p>
                  <p className="text-[12px] text-slate-500 leading-5">Gunakan panel ini untuk meninjau urutan fase, whitelist, dan kebutuhan bukti transaksi.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <Clock className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-900 mb-1">Audit implementasi</p>
                   <p className="text-[12px] text-slate-500 leading-5">Simpan konfigurasi ini sebagai dasar bukti implementasi dan evaluasi.</p>
                 </div>
               </div>
             </div>
           </div>

          <div className="rounded-[24px] bg-slate-900 overflow-hidden relative h-[180px] flex flex-col items-center justify-center border border-slate-800">
            <div className="absolute inset-0 opacity-30 flex items-center justify-center">
               <Network className="w-48 h-48 text-blue-500/50 absolute" />
               <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
            </div>
            
            <div className="relative z-10 w-full mt-auto px-6 py-4 bg-gradient-to-t from-black/80 to-transparent">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-white">ARSITEKTUR DESENTRALISASI AMANAH</h3>
            </div>
          </div>
        </div>

      </div>
    </div>
    </ScrollReveal>
  )
}
