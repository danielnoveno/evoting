'use client'

import { Save, Settings, Info } from 'lucide-react'
import { SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { superadminPlatformSettingsContent } from '@/lib/dummy-superadmin-content'

export default function PengaturanPlatformPage() {
  return (
    <SuperadminShell>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-700">
            <Settings className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-slate-900">
              Pengaturan Platform
            </h1>
            <p className="mt-2 text-[16px] text-slate-500">
              Konfigurasi parameter global dan interaksi smart contract
            </p>
          </div>
        </div>
        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-black px-6 text-[15px] font-medium text-white hover:bg-slate-900">
          <Save className="h-5 w-5" /> Simpan Perubahan
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-semibold text-slate-900">Parameter Blockchain</h2>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 cursor-help" title="Konfigurasi interaksi blockchain Base Sepolia">
              <Info className="h-4 w-4" />
            </div>
          </div>
          
          <form className="mt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-slate-900">Smart Contract Base Address</label>
              <input 
                type="text" 
                defaultValue={superadminPlatformSettingsContent.settings.smartContractAddress}
                className="w-full font-mono rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none transition-colors focus:border-black focus:bg-white"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-slate-900">RPC Node URL</label>
              <input 
                type="url" 
                defaultValue={superadminPlatformSettingsContent.settings.rpcUrl}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none transition-colors focus:border-black focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-slate-900">Base Gas Fee Margin (Multiplier)</label>
              <input 
                type="text" 
                defaultValue={superadminPlatformSettingsContent.settings.baseGasFeeMargin}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none transition-colors focus:border-black focus:bg-white"
              />
              <p className="text-[13px] text-slate-500">Margin digunakan saat simulasi gas fee untuk memastikan transaksi sukses.</p>
            </div>
          </form>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-8">
          <h2 className="text-[20px] font-semibold text-slate-900">Regulasi Pemilihan</h2>
          
          <form className="mt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[14px] font-semibold text-slate-900">Maksimal Pemilih per Ruang Voting</label>
              <input 
                type="number" 
                defaultValue={superadminPlatformSettingsContent.settings.maxVotersPerElection}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none transition-colors focus:border-black focus:bg-white"
              />
            </div>
            
            <div className="pt-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  defaultChecked={superadminPlatformSettingsContent.settings.requireKycForAdmins}
                  className="h-5 w-5 rounded border-slate-300 text-black focus:ring-black"
                />
                <span className="text-[15px] font-medium text-slate-900">Wajibkan Verifikasi Lanjutan (KYC) untuk Admin Baru</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  defaultChecked={superadminPlatformSettingsContent.settings.platformMaintenanceMode}
                  className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-600"
                />
                <span className="text-[15px] font-medium text-slate-900">Aktifkan Maintenance Mode (Menghentikan pembuatan pemilihan baru)</span>
              </label>
            </div>
          </form>
        </section>
      </div>
    </SuperadminShell>
  )
}
