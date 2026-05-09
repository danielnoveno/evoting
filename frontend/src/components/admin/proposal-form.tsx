'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-provider'
import { Save, Users, UserCheck, Shield, CheckCircle2, Network, Clock, ShieldCheck, ArrowLeft } from 'lucide-react'

export interface ProposalFormData {
  title: string
  category: string
  description: string
  candidateCount: number
  voterCount: number
  commitDate: string
  revealDate: string
}

interface ProposalFormProps {
  initialData?: Partial<ProposalFormData>
  isReadOnly?: boolean
  pageTitle: string
  pageDescription: string
  submitLabel?: string
  successMessageTitle?: string
  successMessageDesc?: string
}

export function ProposalForm({
  initialData,
  isReadOnly = false,
  pageTitle,
  pageDescription,
  submitLabel = 'Simpan Proposal',
  successMessageTitle = 'Proposal Berhasil Disimpan',
  successMessageDesc = 'Data proposal telah tersimpan dan menunggu review untuk integrasi smart contract.'
}: ProposalFormProps) {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState<ProposalFormData>({
    title: initialData?.title || '',
    category: initialData?.category || 'Internal Organisasi',
    description: initialData?.description || '',
    candidateCount: initialData?.candidateCount ?? 2,
    voterCount: initialData?.voterCount ?? 0,
    commitDate: initialData?.commitDate || '',
    revealDate: initialData?.revealDate || ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isReadOnly) return
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (isReadOnly) return

    if (!formData.title || !formData.commitDate || !formData.revealDate) {
      showToast({
        title: 'Gagal menyimpan proposal',
        description: 'Pastikan Nama Pemilihan, Jadwal Commit, dan Jadwal Reveal telah terisi.',
        tone: 'error'
      })
      return
    }

    showToast({
      title: successMessageTitle,
      description: successMessageDesc,
      tone: 'success'
    })
    
    // Redirect back after short delay to simulate process
    setTimeout(() => {
      router.push('/admin/daftar-proposal')
    }, 1500)
  }

  const handleCancel = () => {
    router.push('/admin/daftar-proposal')
  }

  return (
    <div>
      {/* Header */}
      <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between mb-10">
        <div className="max-w-[760px]">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[48px]">{pageTitle}</h1>
          </div>
          <p className="mt-4 text-[16px] leading-8 text-slate-600">
            {pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-6 text-[15px] font-medium text-white shadow-lg hover:bg-slate-800 transition-colors"
            >
              <Save className="h-5 w-5" />
              {submitLabel}
            </button>
          )}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px]">
        
        {/* Left Column - Form Fields */}
        <div className="space-y-10">
          {/* Section: INFORMASI DASAR */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-6 w-1.5 bg-black rounded-full" />
              <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] text-slate-900">INFORMASI DASAR</h2>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">NAMA PEMILIHAN</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={isReadOnly}
                placeholder="Contoh: Pemilihan Ketua Umum 2024" 
                className="w-full h-12 px-4 rounded-xl bg-slate-100/80 border-transparent focus:bg-white focus:border-slate-300 focus:ring-0 text-[15px] text-slate-900 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">KATEGORI</label>
              <div className="relative">
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className="w-full h-12 px-4 rounded-xl bg-slate-100/80 border-transparent focus:bg-white focus:border-slate-300 focus:ring-0 text-[15px] text-slate-900 transition-all appearance-none outline-none disabled:opacity-70 disabled:cursor-not-allowed"
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
                className="w-full h-32 p-4 rounded-xl bg-slate-100/80 border-transparent focus:bg-white focus:border-slate-300 focus:ring-0 text-[15px] text-slate-900 transition-all resize-none outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          </section>

          {/* Section: ESTIMASI & KAPASITAS */}
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
                    className="w-full h-14 pl-4 pr-12 rounded-xl bg-slate-100/80 border-transparent focus:bg-white focus:border-slate-300 focus:ring-0 text-[20px] font-semibold text-slate-900 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[12px] italic text-slate-500 mt-2">Minimal 2 kandidat untuk pemilihan valid.</p>
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
                    className="w-full h-14 pl-4 pr-12 rounded-xl bg-slate-100/80 border-transparent focus:bg-white focus:border-slate-300 focus:ring-0 text-[20px] font-semibold text-slate-900 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-[12px] italic text-slate-500 mt-2">Estimasi total wallet address yang terdaftar.</p>
              </div>
            </div>
          </section>

          {/* Section: KONFIGURASI TEKNIS BLOCKCHAIN */}
          <section className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 bg-black rounded-full" />
                <h2 className="text-[14px] font-bold uppercase tracking-[0.1em] text-slate-900">KONFIGURASI TEKNIS BLOCKCHAIN</h2>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
                ERC-20 COMPLIANT
              </span>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">JADWAL COMMIT</label>
                <input 
                  type="datetime-local" 
                  name="commitDate"
                  value={formData.commitDate}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className="w-full h-14 px-4 rounded-xl bg-slate-100/80 border-transparent focus:bg-white focus:border-slate-300 focus:ring-0 text-[15px] font-medium text-slate-900 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[12px] text-slate-500 mt-2">Fase dimana pemilih mengirimkan suara terenkripsi.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">JADWAL REVEAL</label>
                <input 
                  type="datetime-local" 
                  name="revealDate"
                  value={formData.revealDate}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className="w-full h-14 px-4 rounded-xl bg-slate-100/80 border-transparent focus:bg-white focus:border-slate-300 focus:ring-0 text-[15px] font-medium text-slate-900 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                />
                <p className="text-[12px] text-slate-500 mt-2">Fase pembukaan kunci enkripsi untuk perhitungan suara.</p>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column - Info Panels */}
        <div className="space-y-6">
          {/* Panel 1: Validasi On-Chain */}
          <div className="rounded-[24px] bg-[#1a202c] p-8 text-white relative overflow-hidden shadow-xl">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-300">
                SECURE NODE
              </span>
            </div>

            <h3 className="text-[20px] font-semibold mb-4 relative z-10">Validasi On-Chain</h3>
            <p className="text-[14px] leading-6 text-slate-300 mb-8 relative z-10">
              Sistem menggunakan mekanisme <strong className="text-white">Commit-Reveal</strong> untuk mencegah manipulasi data sebelum perhitungan dimulai.
            </p>

            <div className="space-y-5 relative z-10">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-white mb-1">Immutability Guaranteed</p>
                  <p className="text-[12px] text-slate-400 leading-5">Data tidak dapat diubah setelah dikomit ke ledger.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-white mb-1">Anonymity Layers</p>
                  <p className="text-[12px] text-slate-400 leading-5">Privasi pemilih dilindungi dengan Zero-Knowledge Proofs.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">NETWORK HASH RATE</p>
              <div className="flex items-center gap-3">
                <span className="text-[24px] font-mono font-medium">42.8 TH/s</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Stable
                </span>
              </div>
            </div>
          </div>

          {/* Panel 2: Keamanan & Audit */}
          <div className="rounded-[24px] bg-slate-50 border border-slate-100 p-8">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-900 mb-6">KEAMANAN & AUDIT</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <ShieldCheck className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-900 mb-1">Smart Contract Audit</p>
                  <p className="text-[12px] text-slate-500 leading-5">Laporan audit terbaru tersedia untuk node validator. Status: 100% Pass.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <Clock className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-900 mb-1">Real-time Monitoring</p>
                  <p className="text-[12px] text-slate-500 leading-5">Setiap transaksi proposal akan dicatat di explorer publik secara real-time.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Arsitektur Illustration */}
          <div className="rounded-[24px] bg-slate-900 overflow-hidden relative h-[180px] flex flex-col items-center justify-center border border-slate-800">
            {/* Dummy graphic representation of nodes */}
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
  )
}
