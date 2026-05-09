'use client'

import { ArrowLeft, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SuperadminShell } from '@/components/superadmin/superadmin-shell'

export default function TambahAdminPage() {
  const router = useRouter()

  return (
    <SuperadminShell>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[24px] font-semibold text-slate-900">Tambah Admin Institusi</h1>
          <p className="mt-1 text-[14px] text-slate-500">Daftarkan akun administrator baru ke dalam platform</p>
        </div>
      </div>

      <div className="mt-8 max-w-3xl rounded-[32px] border border-slate-200 bg-white p-8">
        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault()
          router.push('/superadmin/manajemen-admin')
        }}>
          <div className="space-y-2">
            <label htmlFor="namaInstitusi" className="text-[14px] font-semibold text-slate-900">Nama Institusi / Organisasi</label>
            <input 
              id="namaInstitusi"
              type="text" 
              placeholder="Contoh: BEM Fakultas Teknik"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none transition-colors focus:border-black focus:bg-white"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="walletAddress" className="text-[14px] font-semibold text-slate-900">Wallet Address Admin</label>
            <input 
              id="walletAddress"
              type="text" 
              placeholder="0x..."
              className="w-full font-mono rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none transition-colors focus:border-black focus:bg-white"
              required
            />
            <p className="text-[13px] text-slate-500">Alamat wallet ini akan digunakan oleh admin untuk login dan deploy contract.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[14px] font-semibold text-slate-900">Email Kontak (Opsional)</label>
              <input 
                id="email"
                type="email" 
                placeholder="admin@instansi.ac.id"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none transition-colors focus:border-black focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="website" className="text-[14px] font-semibold text-slate-900">Website Institusi (Opsional)</label>
              <input 
                id="website"
                type="url" 
                placeholder="https://instansi.ac.id"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none transition-colors focus:border-black focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-[15px] font-medium text-slate-700 hover:bg-slate-50 border border-slate-200"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900"
            >
              <Save className="h-5 w-5" /> Simpan Admin
            </button>
          </div>
        </form>
      </div>
    </SuperadminShell>
  )
}
