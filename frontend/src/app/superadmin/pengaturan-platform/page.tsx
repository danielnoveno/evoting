'use client'

import { AlertTriangle, Check, Database, FileText, Search, Upload, Users, X } from 'lucide-react'
import { type ChangeEvent, type DragEvent, useRef, useState } from 'react'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { SuperadminSectionCard, SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { useToast } from '@/components/ui/toast-provider'
import { type SuperadminMasterVoter, useSuperadminMasterVotersStore } from '@/lib/superadmin-store'

export default function SuperadminPlatformSettingsPage() {
  const { showToast } = useToast()
  const { voters, setVoters } = useSuperadminMasterVotersStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [parsedVoters, setParsedVoters] = useState<SuperadminMasterVoter[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredVoters = voters.filter((voter) => {
    const term = searchTerm.toLowerCase().trim()
    return (
      voter.nim.includes(term) ||
      voter.name.toLowerCase().includes(term) ||
      voter.email.toLowerCase().includes(term) ||
      voter.faculty.toLowerCase().includes(term)
    )
  })

  const handleSyncToContract = () => {
    const unsyncedCount = voters.filter((voter) => voter.syncStatus === 'Belum Sinkron').length

    if (unsyncedCount === 0) {
      showToast({
        tone: 'info',
        title: 'Semua data sinkron',
        description: 'Seluruh data master voter sudah tersinkronisasi ke smart contract.',
      })
      return
    }

    setIsSyncing(true)
    setTimeout(() => {
      setVoters(voters.map((voter) => ({ ...voter, syncStatus: 'Tersinkronisasi' })))
      setIsSyncing(false)
      showToast({
        tone: 'success',
        title: 'Sinkronisasi berhasil',
        description: `Merkle root baru di-anchor pada Base Sepolia Testnet untuk ${unsyncedCount} data voter baru.`,
      })
    }, 1500)
  }

  const handleCSVParsing = (text: string) => {
    const lines = text.split(/\r?\n/)
    const tempVoters: SuperadminMasterVoter[] = []
    const tempErrors: string[] = []

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim()
      if (!line) continue

      const cols = line.split(',').map((col) => col.trim().replace(/^["']|["']$/g, ''))

      if (cols.length < 4) {
        if (i === 0 && (cols[0].toLowerCase().includes('nim') || cols[0].toLowerCase().includes('nama'))) {
          continue
        }

        tempErrors.push(`Baris ${i + 1}: Data kolom tidak lengkap (harus NIM, Nama, Email, Fakultas).`)
        continue
      }

      const [nim, name, email, faculty] = cols

      if (i === 0 && (nim.toLowerCase() === 'nim' || name.toLowerCase() === 'nama' || email.toLowerCase() === 'email')) {
        continue
      }

      if (!/^\d{10}$/.test(nim)) {
        tempErrors.push(`Baris ${i + 1}: NIM "${nim}" tidak valid (harus tepat 10 digit angka numerik).`)
        continue
      }

      if (!/^[a-zA-Z\s]+$/.test(name)) {
        tempErrors.push(`Baris ${i + 1}: Nama "${name}" tidak valid (hanya boleh berisi huruf alfabet dan spasi).`)
        continue
      }

      if (!/^[a-zA-Z0-9._%+-]+@(students\.uajy\.ac\.id|uajy\.ac\.id)$/.test(email)) {
        tempErrors.push(`Baris ${i + 1}: Email "${email}" tidak valid (harus email resmi kampus @students.uajy.ac.id atau @uajy.ac.id).`)
        continue
      }

      if (!faculty) {
        tempErrors.push(`Baris ${i + 1}: Fakultas wajib diisi.`)
        continue
      }

      const isNimDuplicate = voters.some((voter) => voter.nim === nim) || tempVoters.some((voter) => voter.nim === nim)
      if (isNimDuplicate) {
        tempErrors.push(`Baris ${i + 1}: NIM "${nim}" sudah terdaftar dalam sistem.`)
        continue
      }

      tempVoters.push({
        nim,
        name,
        email,
        faculty,
        syncStatus: 'Belum Sinkron',
      })
    }

    setCsvErrors(tempErrors)
    setParsedVoters(tempVoters)
  }

  const processFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext !== 'csv') {
      setCsvErrors(['Format file tidak didukung. Harap unggah berkas berekstensi .csv'])
      setCsvFile(null)
      setParsedVoters([])
      return
    }

    setCsvFile(file)
    setCsvErrors([])

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      handleCSVParsing(text)
    }
    reader.onerror = () => {
      setCsvErrors(['Gagal membaca file. Silakan coba lagi.'])
    }
    reader.readAsText(file)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    processFile(files[0])
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const closeModal = () => {
    setShowCsvModal(false)
    setCsvFile(null)
    setCsvErrors([])
    setParsedVoters([])
  }

  const handleImportSubmit = () => {
    if (parsedVoters.length === 0) return

    setVoters((current) => [...parsedVoters, ...current])
    showToast({
      tone: 'success',
      title: 'Data berhasil diimpor',
      description: `${parsedVoters.length} mahasiswa berhasil ditambahkan ke Data Master Voter Platform.`,
    })
    closeModal()
  }

  return (
    <SuperadminShell>
      <SuperadminOnboardingTour />
      <ScrollReveal variant="fade-up" duration={800}>
        <section>
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[44px]">
            Data Master Voter Platform
          </h1>
          <p className="mt-3 max-w-3xl text-[16px] leading-8 text-slate-800">
            Kelola daftar induk voter platform, impor data kampus melalui CSV, dan sinkronisasikan pembaruan ke smart contract.
          </p>
        </section>
      </ScrollReveal>

      <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-8 space-y-6">
        <div className="flex flex-col gap-4 rounded-[24px] bg-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan NIM, nama, email, atau fakultas..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-12 w-full rounded-[20px] border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-900 outline-none focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowCsvModal(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-slate-900 px-6 text-[15px] font-semibold text-white transition hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" />
              Impor Data Master via CSV
            </button>
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSyncToContract}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-emerald-600 px-6 text-[15px] font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-300"
            >
              <Database className="h-4 w-4" />
              {isSyncing ? 'Sinkronisasi...' : 'Sinkronisasikan ke Smart Contract'}
            </button>
          </div>
        </div>

        <SuperadminSectionCard>
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-[18px] font-semibold text-slate-900">Registrasi Mahasiswa & Dosen (DPT Platform)</h2>
              <p className="mt-1 text-[14px] text-slate-500">Total terdaftar: {filteredVoters.length} dari {voters.length} data master.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <th className="pb-3 pl-4">NIM / Identitas</th>
                  <th className="pb-3">Nama Lengkap</th>
                  <th className="pb-3">Email Institusi</th>
                  <th className="pb-3">Fakultas / Program</th>
                  <th className="pb-3 pr-4">Status Sinkronisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVoters.length > 0 ? (
                  filteredVoters.map((voter) => (
                    <tr key={voter.nim} className="group transition hover:bg-slate-50/50">
                      <td className="py-4 pl-4 font-mono text-[14px] font-medium text-slate-900">{voter.nim}</td>
                      <td className="py-4 text-[15px] font-semibold text-slate-900">{voter.name}</td>
                      <td className="py-4 font-mono text-[13px] text-slate-500">{voter.email}</td>
                      <td className="py-4 text-[15px] text-slate-700">{voter.faculty}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            voter.syncStatus === 'Tersinkronisasi'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {voter.syncStatus === 'Tersinkronisasi' ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Tersinkronisasi
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Belum Sinkron
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Users className="h-12 w-12 stroke-[1.5]" />
                        <p className="mt-4 text-[16px] font-semibold text-slate-700">Data Master Voter kosong</p>
                        <p className="mt-1 max-w-sm text-[14px] text-slate-500">
                          {searchTerm ? 'Tidak ada hasil pencarian yang cocok.' : 'Silakan gunakan tombol Impor Data Master via CSV di atas untuk memuat data.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SuperadminSectionCard>
      </StaggerContainer>

      {showCsvModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <ScrollReveal variant="zoom-in" duration={400} className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-y-auto rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="flex items-center gap-2 text-[20px] font-semibold text-slate-900">
                <FileText className="h-5 w-5 text-indigo-600" />
                Impor Data Master Voter Platform
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-[24px] border-2 border-dashed p-8 text-center transition-all ${
                isDragging ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Upload className="h-6 w-6" />
                </div>
                {csvFile ? (
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">{csvFile.name}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{(csvFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">Seret berkas CSV ke sini, atau klik untuk memilih</p>
                    <p className="mt-2 text-[13px] text-slate-500">Hanya berkas .csv yang didukung</p>
                  </div>
                )}
              </div>
            </div>

            {!csvFile ? (
              <div className="mt-6 rounded-[20px] border border-slate-100 bg-slate-50 p-4 text-[13px] leading-6 text-slate-600">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-800">Format Kolom CSV:</span>
                <p>Kolom 1: <strong>NIM</strong> (10 digit numerik, cth: 220711663)</p>
                <p>Kolom 2: <strong>Nama Lengkap</strong> (hanya huruf alfabet & spasi)</p>
                <p>Kolom 3: <strong>Email Resmi</strong> (cth: name@students.uajy.ac.id)</p>
                <p>Kolom 4: <strong>Fakultas / Prodi</strong> (cth: Informatika)</p>
              </div>
            ) : null}

            {csvErrors.length > 0 ? (
              <div className="mt-6 max-h-[160px] overflow-y-auto rounded-[20px] border border-red-100 bg-red-50 p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  Ditemukan beberapa kesalahan format:
                </h4>
                <ul className="list-disc space-y-1 pl-5 text-[12px] text-red-700">
                  {csvErrors.map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {parsedVoters.length > 0 && csvErrors.length === 0 ? (
              <div className="mt-6">
                <h4 className="mb-3 flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Pratinjau Data ({parsedVoters.length} baris tervalidasi):
                </h4>
                <div className="max-h-[160px] overflow-y-auto rounded-2xl border border-slate-100">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead className="bg-slate-50 text-[10px] font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">NIM</th>
                        <th className="px-3 py-2">Nama</th>
                        <th className="px-3 py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedVoters.slice(0, 5).map((voter, index) => (
                        <tr key={`${voter.nim}-${index}`} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-mono">{voter.nim}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{voter.name}</td>
                          <td className="px-3 py-2 font-mono text-slate-500">{voter.email}</td>
                        </tr>
                      ))}
                      {parsedVoters.length > 5 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-center italic text-slate-400">
                            ...dan {parsedVoters.length - 5} baris data lainnya
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-6 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={parsedVoters.length === 0 || csvErrors.length > 0}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-semibold text-white transition hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Check className="h-4 w-4" />
                Impor Sekarang
              </button>
            </div>
          </ScrollReveal>
        </div>
      ) : null}
    </SuperadminShell>
  )
}
