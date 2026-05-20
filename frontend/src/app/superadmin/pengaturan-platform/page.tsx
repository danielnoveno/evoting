'use client'

import { Building2, KeyRound, Laptop, Smartphone, Upload, Users, Settings, Search, Check, X, AlertTriangle, ShieldCheck, Database, FileText } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import { SuperadminSectionCard, SuperadminShell, SuperadminToolbarButton } from '@/components/superadmin/superadmin-shell'
import { superadminPlatformData } from '@/lib/superadmin-dummy-data'
import { useSuperadminPlatformStore, useSuperadminMasterVotersStore, type SuperadminMasterVoter } from '@/lib/superadmin-mock-store'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'

export default function SuperadminPlatformSettingsPage() {
  const { showToast } = useToast()
  const { platform, setPlatform } = useSuperadminPlatformStore()
  const { voters, setVoters } = useSuperadminMasterVotersStore()

  // Tabs state
  const [activeTab, setActiveTab] = useState<'voter' | 'system'>('voter')

  // Platform setting states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(platform.twoFactorEnabled)
  const [platformName, setPlatformName] = useState(platform.platformName)
  const [language, setLanguage] = useState(platform.defaultLanguage)

  // Master Voter Tab states
  const [searchTerm, setSearchTerm] = useState('')
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [parsedVoters, setParsedVoters] = useState<SuperadminMasterVoter[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTwoFactorEnabled(platform.twoFactorEnabled)
    setPlatformName(platform.platformName)
    setLanguage(platform.defaultLanguage)
  }, [platform])

  // Filtered voters list
  const filteredVoters = voters.filter((voter) => {
    const term = searchTerm.toLowerCase().trim()
    return (
      voter.nim.includes(term) ||
      voter.name.toLowerCase().includes(term) ||
      voter.email.toLowerCase().includes(term) ||
      voter.faculty.toLowerCase().includes(term)
    )
  })

  // Synchronise mock smart contract
  const handleSyncToContract = () => {
    const unsyncedCount = voters.filter(v => v.syncStatus === 'Belum Sinkron').length
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
      setVoters(voters.map(v => ({ ...v, syncStatus: 'Tersinkronisasi' })))
      setIsSyncing(false)
      showToast({
        tone: 'success',
        title: 'Sinkronisasi Berhasil',
        description: `Merkle Root baru di-anchor pada Base Sepolia Testnet untuk ${unsyncedCount} data voter baru.`,
      })
    }, 1500)
  }

  // Parse CSV function
  const handleCSVParsing = (text: string) => {
    const lines = text.split(/\r?\n/)
    const tempVoters: SuperadminMasterVoter[] = []
    const tempErrors: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // skip empty lines

      const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
      
      // Check column length (must be at least 4: NIM, Name, Email, Faculty)
      if (cols.length < 4) {
        if (i === 0 && (cols[0].toLowerCase().includes('nim') || cols[0].toLowerCase().includes('nama'))) {
          continue // skip header candidate
        }
        tempErrors.push(`Baris ${i + 1}: Data kolom tidak lengkap (harus NIM, Nama, Email, Fakultas).`)
        continue
      }

      const [nim, name, email, faculty] = cols

      // Skip header row if it contains names
      if (i === 0 && (nim.toLowerCase() === 'nim' || name.toLowerCase() === 'nama' || email.toLowerCase() === 'email')) {
        continue
      }

      // Validasi NIM: 10 digit numerik
      if (!/^\d{10}$/.test(nim)) {
        tempErrors.push(`Baris ${i + 1}: NIM "${nim}" tidak valid (harus tepat 10 digit angka numerik).`)
        continue
      }

      // Validasi Nama: alfabet dan spasi saja
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        tempErrors.push(`Baris ${i + 1}: Nama "${name}" tidak valid (hanya boleh berisi huruf alfabet dan spasi).`)
        continue
      }

      // Validasi Email: students.uajy.ac.id atau uajy.ac.id
      if (!/^[a-zA-Z0-9._%+-]+@(students\.uajy\.ac\.id|uajy\.ac\.id)$/.test(email)) {
        tempErrors.push(`Baris ${i + 1}: Email "${email}" tidak valid (harus email resmi kampus @students.uajy.ac.id atau @uajy.ac.id).`)
        continue
      }

      // Validasi Fakultas: tidak boleh kosong
      if (!faculty) {
        tempErrors.push(`Baris ${i + 1}: Fakultas wajib diisi.`)
        continue
      }

      // Check for duplicate NIM in existing voters or current parse batch
      const isNimDuplicate = voters.some(v => v.nim === nim) || tempVoters.some(v => v.nim === nim)
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

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    processFile(files[0])
  }

  // Process File safely
  const processFile = (file: File) => {
    // Validate file extension
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

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  // Save imported voters to store
  const handleImportSubmit = () => {
    if (parsedVoters.length === 0) return
    setVoters((current) => [...parsedVoters, ...current])
    showToast({
      tone: 'success',
      title: 'Data Berhasil Diimpor',
      description: `${parsedVoters.length} mahasiswa berhasil ditambahkan ke Data Master Voter Platform.`,
    })
    closeModal()
  }

  const closeModal = () => {
    setShowCsvModal(false)
    setCsvFile(null)
    setCsvErrors([])
    setParsedVoters([])
  }

  return (
    <SuperadminShell>
      {/* Header Section */}
      <ScrollReveal variant="fade-up" duration={800}>
        <section>
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[44px]">
            {superadminPlatformData.title}
          </h1>
          <p className="mt-3 text-[16px] text-slate-800">
            Kelola konfigurasi platform, sistem keamanan, dan Data Master Voter UAJY.
          </p>
        </section>
      </ScrollReveal>

      {/* Tabs Menu Navigation */}
      <ScrollReveal variant="fade-up" duration={700} delay={100}>
        <div className="flex border-b border-slate-200 mt-8 mb-6">
          <button
            type="button"
            id="tab-master-voter"
            onClick={() => setActiveTab('voter')}
            className={`pb-4 px-6 text-[16px] font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 outline-none focus:outline-none ${
              activeTab === 'voter'
                ? 'border-black text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="h-5 w-5" />
            Data Master Voter Platform
          </button>
          <button
            type="button"
            id="tab-system-settings"
            onClick={() => setActiveTab('system')}
            className={`pb-4 px-6 text-[16px] font-semibold transition-all border-b-2 -mb-[2px] flex items-center gap-2 outline-none focus:outline-none ${
              activeTab === 'system'
                ? 'border-black text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="h-5 w-5" />
            Sistem & Keamanan
          </button>
        </div>
      </ScrollReveal>

      {/* TAB 1: DATA MASTER VOTER PLATFORM */}
      {activeTab === 'voter' && (
        <StaggerContainer stagger={100} variant="fade-up" duration={600} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-100 p-4 rounded-[24px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan NIM, Nama, atau Fakultas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-[20px] border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-900 outline-none focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>
            
            {/* Actions Button */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowCsvModal(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-slate-900 px-6 text-[15px] font-semibold text-white hover:bg-slate-800 transition"
              >
                <Upload className="h-4 w-4" />
                Impor Data Master via CSV
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncToContract}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-emerald-600 px-6 text-[15px] font-semibold text-white hover:bg-emerald-700 transition disabled:bg-emerald-300"
              >
                <Database className="h-4 w-4" />
                {isSyncing ? 'Sinkronisasi...' : 'Sinkronisasikan Ke Smart Contract'}
              </button>
            </div>
          </div>

          {/* Voter Master Data Table Card */}
          <SuperadminSectionCard>
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-[18px] font-semibold text-slate-900">Registrasi Mahasiswa & Dosen (DPT Platform)</h2>
                <p className="mt-1 text-[14px] text-slate-500">Total terdaftar: {filteredVoters.length} dari {voters.length} data master.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
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
                      <tr key={voter.nim} className="group hover:bg-slate-50/50 transition">
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
                          <p className="mt-4 text-[16px] font-semibold text-slate-700">Data Master Voter Kosong</p>
                          <p className="mt-1 text-[14px] text-slate-500 max-w-sm">
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
      )}

      {/* TAB 2: SISTEM & KEAMANAN */}
      {activeTab === 'system' && (
        <StaggerContainer stagger={100} variant="fade-up" duration={600} className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* Left Column: Profile & Security */}
          <div className="space-y-6">
            {/* Profil Saya */}
            <SuperadminSectionCard>
              <h2 className="text-[18px] font-semibold text-slate-900">Profil Saya</h2>
              <div className="mt-10 flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white bg-[#0f172a] text-[30px] font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                  SA
                </div>
                <h3 className="mt-6 text-[22px] font-semibold text-slate-900">{superadminPlatformData.profile.name}</h3>
                <p className="mt-2 font-mono text-[15px] text-slate-500">{superadminPlatformData.profile.email}</p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-[20px] bg-slate-200 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Nama Lengkap</p>
                  <p className="mt-2 text-[18px] text-slate-900">{superadminPlatformData.profile.fullName}</p>
                </div>
                <div className="rounded-[20px] bg-slate-200 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Email</p>
                  <p className="mt-2 text-[18px] text-slate-900">{superadminPlatformData.profile.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast({ tone: 'success', title: 'Reset password diproses', description: 'Permintaan reset password dummy berhasil dibuat.' })}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-slate-200 text-[15px] font-medium text-slate-900 hover:bg-slate-300 transition"
                >
                  <KeyRound className="h-4 w-4" />
                  Ganti Kata Sandi
                </button>
              </div>
            </SuperadminSectionCard>

            {/* Keamanan */}
            <SuperadminSectionCard>
              <h2 className="text-[18px] font-semibold text-slate-900">Keamanan</h2>
              <div className="mt-8 rounded-[24px] bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[18px] font-semibold text-slate-900">Autentikasi Dua Faktor (2FA)</p>
                    <p className="mt-2 text-[15px] leading-7 text-slate-800">Gunakan aplikasi authenticator untuk keamanan ekstra.</p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={twoFactorEnabled}
                    onClick={() => {
                      const nextValue = !twoFactorEnabled
                      setTwoFactorEnabled(nextValue)
                      setPlatform((current) => ({ ...current, twoFactorEnabled: nextValue }))
                      showToast({
                        tone: 'success',
                        title: twoFactorEnabled ? '2FA dinonaktifkan' : '2FA diaktifkan',
                        description: 'Perubahan hanya berlaku pada mode dummy.',
                      })
                    }}
                    className={`relative h-8 w-14 rounded-full transition outline-none focus:outline-none focus:ring-2 focus:ring-black ${
                      twoFactorEnabled ? 'bg-black' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${twoFactorEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[12px] uppercase tracking-[0.08em] text-slate-500">Sesi Aktif</p>
                <div className="mt-4 space-y-4">
                  {platform.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="text-slate-800">
                          {session.device.toLowerCase().includes('iphone') ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-[18px] font-medium text-slate-900">{session.device}</p>
                          <p className="mt-1 text-[14px] text-slate-500">{session.meta}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (session.status !== 'Aktif') {
                            setPlatform((current) => ({
                              ...current,
                              sessions: current.sessions.map((entry) => (entry.id === session.id ? { ...entry, status: 'Dicabut' } : entry)),
                            }))
                          }
                          showToast({
                            tone: session.status === 'Aktif' ? 'info' : 'success',
                            title: session.status === 'Aktif' ? 'Sesi utama dipertahankan' : 'Sesi berhasil dicabut',
                            description: 'Perubahan dummy berhasil diproses.',
                          })
                        }}
                        className={`rounded-xl px-3 py-1 text-[14px] font-semibold transition ${
                          session.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        {session.status}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </SuperadminSectionCard>
          </div>

          {/* Right Column: Blockchain & System Config */}
          <div className="space-y-6">
            {/* Konfigurasi Blockchain */}
            <SuperadminSectionCard>
              <h2 className="flex items-center gap-3 text-[18px] font-semibold text-slate-900">
                <Building2 className="h-5 w-5" />
                Konfigurasi Blockchain
              </h2>
              <div className="mt-8 space-y-5">
                <div className="rounded-[24px] bg-white p-5">
                  <div className="flex items-center justify-between gap-4 border-l-4 border-blue-500 pl-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Status Jaringan</p>
                      <p className="mt-2 text-[18px] font-semibold text-slate-900">{superadminPlatformData.blockchain.network}</p>
                    </div>
                    <span className="rounded-xl bg-blue-50 px-3 py-1 text-[13px] font-semibold text-blue-600">
                      {superadminPlatformData.blockchain.networkStatus}
                    </span>
                  </div>
                </div>

                <div className="rounded-[24px] bg-white p-5">
                  <div className="border-l-4 border-black pl-4">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Contract Owner Address</p>
                    <div className="mt-4 rounded-[16px] bg-slate-100 px-4 py-3 font-mono text-[15px] break-all text-slate-700">
                      {superadminPlatformData.blockchain.ownerAddress}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-slate-200 px-4 py-5">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Gas Price Limit (GWEI)</p>
                  <div className="mt-4 flex items-center justify-between gap-4 text-[16px] text-slate-900">
                    <span className="text-[34px] font-semibold tracking-[-0.04em]">{superadminPlatformData.blockchain.gasLimit}</span>
                    <span className="text-slate-800 font-semibold">GWEI</span>
                  </div>
                </div>
              </div>
            </SuperadminSectionCard>

            {/* Konfigurasi Sistem */}
            <SuperadminSectionCard>
              <h2 className="text-[18px] font-semibold text-slate-900">Konfigurasi Sistem</h2>
              <div className="mt-8 space-y-6">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Nama Platform</span>
                  <input
                    value={platformName}
                    onChange={(event) => setPlatformName(event.target.value)}
                    className="mt-3 h-14 w-full rounded-[20px] bg-slate-200 px-4 text-[18px] text-slate-900 outline-none focus:ring-2 focus:ring-black focus:outline-none transition"
                  />
                </label>

                <div>
                  <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Logo Institusi</span>
                  <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-white border border-slate-200 text-slate-900 shadow-sm">
                        <Building2 className="h-8 w-8" />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          showToast({
                            tone: 'success',
                            title: 'Upload logo disimulasikan',
                            description: 'Belum ada penyimpanan file nyata pada mode demo.',
                          })
                        }
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-200 px-5 text-[15px] font-medium text-slate-900 hover:bg-slate-300 transition"
                      >
                        <Upload className="h-4 w-4" />
                        Unggah Logo Baru
                      </button>
                    </div>
                    <p className="text-[14px] text-slate-500">{superadminPlatformData.system.uploadNote}</p>
                  </div>
                </div>

                <label className="block">
                  <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Bahasa Default</span>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="mt-3 h-14 w-full rounded-[20px] bg-slate-200 px-4 text-[18px] text-slate-900 outline-none focus:ring-2 focus:ring-black focus:outline-none transition"
                  >
                    <option>Bahasa Indonesia</option>
                    <option>English</option>
                  </select>
                </label>
              </div>
            </SuperadminSectionCard>
          </div>
        </StaggerContainer>
      )}

      {/* Bottom Save Toolbar (Only for Tab 2) */}
      {activeTab === 'system' && (
        <ScrollReveal variant="fade-up" delay={200} duration={800}>
          <section className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => {
                setTwoFactorEnabled(platform.twoFactorEnabled)
                setPlatformName(platform.platformName)
                setLanguage(platform.defaultLanguage)
                showToast({
                  tone: 'info',
                  title: 'Perubahan dibatalkan',
                  description: 'Form dikembalikan ke nilai tersimpan saat ini.',
                })
              }}
              className="inline-flex h-12 items-center justify-center rounded-2xl px-6 text-[15px] font-medium text-slate-900 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <SuperadminToolbarButton
              variant="primary"
              onClick={() => {
                setPlatform((current) => ({ ...current, platformName, defaultLanguage: language }))
                showToast({
                  tone: 'success',
                  title: 'Perubahan disimpan',
                  description: 'Pengaturan platform dummy berhasil diperbarui.',
                })
              }}
            >
              Simpan Perubahan
            </SuperadminToolbarButton>
          </section>
        </ScrollReveal>
      )}

      {/* CSV MODAL COMPONENT */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <ScrollReveal variant="zoom-in" duration={400} className="bg-white rounded-[32px] max-w-[620px] w-full p-8 shadow-[0_32px_80px_rgba(15,23,42,0.18)] max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-[20px] font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Impor Data Master Voter Platform
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[24px] p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/20'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
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
                <div className="h-14 w-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6" />
                </div>
                {csvFile ? (
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">{csvFile.name}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{(csvFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-[16px] font-semibold text-slate-900">
                      Seret berkas CSV ke sini, atau klik untuk memilih
                    </p>
                    <p className="mt-2 text-[13px] text-slate-500">Hanya berkas .csv yang didukung</p>
                  </div>
                )}
              </div>
            </div>

            {/* Template Instructions */}
            {!csvFile && (
              <div className="mt-6 p-4 rounded-[20px] bg-slate-50 border border-slate-100 text-[13px] leading-6 text-slate-600">
                <span className="font-semibold text-slate-800 uppercase tracking-wider block mb-2 text-[11px]">Format Kolom CSV:</span>
                <p>Kolom 1: <strong>NIM</strong> (10 digit numerik, cth: 220711663)</p>
                <p>Kolom 2: <strong>Nama Lengkap</strong> (Hanya huruf alfabet & spasi)</p>
                <p>Kolom 3: <strong>Email Resmi</strong> (cth: name@students.uajy.ac.id)</p>
                <p>Kolom 4: <strong>Fakultas / Prodi</strong> (cth: Informatika)</p>
              </div>
            )}

            {/* Errors List */}
            {csvErrors.length > 0 && (
              <div className="mt-6 p-4 rounded-[20px] bg-red-50 border border-red-100 max-h-[160px] overflow-y-auto">
                <h4 className="text-[13px] font-semibold text-red-800 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Ditemukan beberapa kesalahan format:
                </h4>
                <ul className="list-disc pl-5 text-[12px] text-red-700 space-y-1">
                  {csvErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview of parsed data */}
            {parsedVoters.length > 0 && csvErrors.length === 0 && (
              <div className="mt-6">
                <h4 className="text-[14px] font-semibold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Pratinjau Data ({parsedVoters.length} baris tervalidasi):
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[160px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="py-2 px-3">NIM</th>
                        <th className="py-2 px-3">Nama</th>
                        <th className="py-2 px-3">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedVoters.slice(0, 5).map((v, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono">{v.nim}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{v.name}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{v.email}</td>
                        </tr>
                      ))}
                      {parsedVoters.length > 5 && (
                        <tr>
                          <td colSpan={3} className="py-2 px-3 text-center text-slate-400 italic">
                            ...dan {parsedVoters.length - 5} baris data lainnya
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-100 px-6 text-[15px] font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={parsedVoters.length === 0 || csvErrors.length > 0}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-semibold text-white hover:bg-slate-900 transition disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Check className="h-4 w-4" />
                Impor Sekarang
              </button>
            </div>
          </ScrollReveal>
        </div>
      )}
    </SuperadminShell>
  )
}
