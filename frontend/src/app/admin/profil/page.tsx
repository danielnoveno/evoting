'use client'

import { useState, useRef } from 'react'
import { AdminShell } from '@/components/admin/admin-shell'
import { Camera, ShieldCheck, Copy, Lock, Pencil } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { ScrollReveal } from '@/components/public/parallax'

export default function AdminProfilePage() {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [displayName, setDisplayName] = useState('Budi Santoso')
  const [bio, setBio] = useState('Warga negara yang aktif dalam partisipasi demokrasi digital.')
  const [photoUrl, setPhotoUrl] = useState('https://i.pravatar.cc/300?img=11')
  
  const walletAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
  const email = 'budi.santoso@email.com'

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress)
      showToast({
        title: 'Alamat Berhasil Disalin',
        description: 'Wallet address telah disalin ke clipboard.',
        tone: 'success'
      })
    } catch (err) {
      showToast({
        title: 'Gagal Menyalin',
        description: 'Terjadi kesalahan saat menyalin wallet address.',
        tone: 'error'
      })
    }
  }

  const handleChangePhoto = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast({
        title: 'Format tidak didukung',
        description: 'Silakan pilih file gambar (JPG, PNG).',
        tone: 'error'
      })
      return
    }

    const newPhotoUrl = URL.createObjectURL(file)
    setPhotoUrl(newPhotoUrl)

    showToast({
      title: 'Foto Berhasil Dipilih',
      description: 'Pratinjau foto profil Anda telah diperbarui.',
      tone: 'success'
    })
  }

  const handleSaveChanges = () => {
    showToast({
      title: 'Perubahan Disimpan',
      description: 'Profil Anda berhasil diperbarui di sistem frontend.',
      tone: 'success'
    })
  }

  return (
    <AdminShell>
      <ScrollReveal variant="fade-up" duration={700}>
        {/* Breadcrumb & Header */}
        <section className="mb-10">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-6">
            <span>ADMIN</span>
            <span>›</span>
            <span>KEAMANAN</span>
            <span>›</span>
            <span className="text-slate-900">PENGATURAN PROFIL</span>
          </div>
          
          <h1 className="text-[36px] font-semibold tracking-[-0.03em] text-slate-900 md:text-[44px]">
            Sunting Profil
          </h1>
          <p className="mt-3 text-[16px] leading-8 text-slate-800 max-w-2xl">
            Kelola identitas digital Anda dalam ekosistem blockchain. Pastikan data Anda tetap terenkripsi dan aman.
          </p>
        </section>
      </ScrollReveal>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Foto Profil Card */}
          <ScrollReveal variant="fade-right" delay={150} duration={800}>
            <article className="rounded-[32px] bg-white border border-slate-100 p-8 flex flex-col items-center text-center shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="relative mb-6">
                <div className="h-[120px] w-[120px] rounded-full overflow-hidden bg-slate-200 ring-4 ring-white shadow-lg">
                  <img 
                    src={photoUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleChangePhoto}
                  className="absolute bottom-0 right-0 h-10 w-10 flex items-center justify-center rounded-full bg-black text-white border-2 border-white hover:bg-slate-800 transition-colors"
                  aria-label="Ganti Foto"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              
              <h2 className="text-[20px] font-bold text-slate-900 mb-2">Foto Profil</h2>
              <p className="text-[14px] leading-6 text-slate-500 mb-8">
                Gunakan foto wajah yang jelas untuk mempermudah verifikasi biometrik jika diperlukan.
              </p>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button 
                type="button"
                onClick={handleChangePhoto}
                className="w-full h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-[14px] font-semibold text-slate-900 hover:bg-slate-200 transition-colors"
              >
                Ganti Foto
              </button>
            </article>
          </ScrollReveal>

          {/* Identitas Terverifikasi Card */}
          <ScrollReveal variant="fade-right" delay={250} duration={800}>
            <article className="rounded-[32px] bg-[#161b33] p-8 text-white relative overflow-hidden shadow-xl">
              {/* Subtle shield background decoration */}
              <ShieldCheck className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5" />
              
              <div className="relative z-10">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white mb-6">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-[20px] font-bold text-white mb-3">Identitas Terverifikasi</h2>
                <p className="text-[14px] leading-6 text-slate-300">
                  Profil Anda terhubung dengan identitas nasional dan dijamin oleh sistem blockchain.
                </p>
              </div>
            </article>
          </ScrollReveal>

        </div>

        {/* Right Column (Form) */}
        <div className="lg:col-span-8">
          <ScrollReveal variant="fade-left" delay={200} duration={800}>
            <article className="rounded-[32px] bg-white border border-slate-100 p-8 md:p-10 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-900 mb-8">INFORMASI PERSONAL</h2>
            
            <div className="space-y-8">
              {/* Display Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">
                  NAMA TAMPILAN (DISPLAY NAME)
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-14 pl-5 pr-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-300 focus:ring-0 text-[16px] text-slate-900 font-medium transition-all outline-none"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Pencil className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">
                  ALAMAT EMAIL TERDAFTAR
                </label>
                <input 
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-transparent text-[16px] text-slate-500 cursor-not-allowed outline-none"
                />
                <p className="mt-3 text-[12px] text-slate-400">
                  Email dikunci untuk keamanan akun. Hubungi administrator untuk perubahan data vital.
                </p>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">
                  HASH IDENTITAS (WALLET ADDRESS)
                </label>
                <div className="relative flex items-center h-14 rounded-2xl bg-slate-50 overflow-hidden group">
                  <div className="w-1.5 h-full bg-slate-800" />
                  <div className="flex-1 px-4 font-mono text-[14px] text-slate-800 truncate">
                    {walletAddress}
                  </div>
                  <button 
                    type="button"
                    onClick={handleCopyWallet}
                    className="h-full px-5 text-slate-400 hover:text-slate-900 transition-colors focus:ring-2 focus:ring-[#0B1120] focus:outline-none"
                    title="Salin Address"
                    aria-label="Salin alamat wallet admin Budi Santoso"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">
                  BIO SINGKAT
                </label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full p-5 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-300 focus:ring-0 text-[15px] text-slate-900 leading-7 transition-all outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-4">
              <button 
                type="button"
                onClick={handleSaveChanges}
                className="h-12 px-8 rounded-2xl bg-black text-[14px] font-semibold text-white hover:bg-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] hover:-translate-y-px"
              >
                Simpan Perubahan
              </button>
            </div>
          </article>
          </ScrollReveal>
        </div>
      </div>

      {/* Bottom Privacy Note */}
      <ScrollReveal variant="fade-up" delay={350} duration={700}>
        <section className="mt-8 mb-8 rounded-[28px] bg-slate-50 border border-slate-100 p-6 flex items-start gap-4 max-w-[800px]">
          <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Kebijakan Privasi & Enkripsi</h3>
            <p className="text-[13px] leading-6 text-slate-500">
              Data Anda dilindungi dengan enkripsi end-to-end. Hanya nama tampilan yang akan muncul secara publik pada dashboard partisipasi pemilih. Identitas nasional Anda tetap anonim dalam blockchain.
            </p>
          </div>
        </section>
      </ScrollReveal>

    </AdminShell>
  )
}
