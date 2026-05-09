'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Ban, ShieldCheck, Mail, MapPin, Globe } from 'lucide-react'
import { SuperadminShell } from '@/components/superadmin/superadmin-shell'
import { superadminManajemenAdminContent } from '@/lib/dummy-superadmin-content'

export default function DetailAdminPage() {
  const params = useParams()
  const router = useRouter()
  
  const adminId = params.id as string
  const admin = superadminManajemenAdminContent.admins.find(a => a.id === adminId) || superadminManajemenAdminContent.admins[0]

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
          <h1 className="text-[24px] font-semibold text-slate-900">Detail Admin: {admin.name}</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="rounded-[32px] border border-slate-200 bg-white p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-slate-100 text-slate-400">
                  <ShieldCheck className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-[28px] font-semibold text-slate-900">{admin.name}</h2>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-mono text-[14px] bg-slate-100 px-3 py-1 rounded-md text-slate-600">
                      {admin.wallet}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] ${
                      admin.status === 'Aktif' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {admin.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-medium text-slate-700 hover:bg-slate-50">
                  <Edit className="h-4 w-4" /> Edit
                </button>
                <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-[14px] font-medium text-red-700 hover:bg-red-100">
                  <Ban className="h-4 w-4" /> Suspend
                </button>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email Institusi
                </p>
                <p className="mt-2 text-[15px] text-slate-900">contact@instansi.ac.id</p>
              </div>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Website
                </p>
                <p className="mt-2 text-[15px] text-slate-900">www.instansi.ac.id</p>
              </div>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Lokasi
                </p>
                <p className="mt-2 text-[15px] text-slate-900">Daerah Istimewa Yogyakarta</p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-8">
            <h3 className="text-[20px] font-semibold text-slate-900">Riwayat Pemilihan</h3>
            <p className="mt-2 text-[15px] text-slate-500">Daftar pemilihan yang pernah dibuat oleh admin ini.</p>
            
            <div className="mt-6 space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 hover:bg-slate-50">
                  <div>
                    <h4 className="font-medium text-slate-900">Pemilihan Internal {item}</h4>
                    <p className="text-[13px] text-slate-500">Selesai pada 12 Okt 2025</p>
                  </div>
                  <span className="inline-flex h-8 items-center justify-center rounded-lg bg-blue-50 px-3 text-[12px] font-medium text-blue-700">
                    Selesai
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] bg-slate-900 p-6 text-white">
            <h3 className="text-[16px] font-semibold">Statistik Akun</h3>
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-[12px] text-slate-400">Total Pemilihan</p>
                <p className="mt-1 text-[32px] font-semibold">{admin.totalElections}</p>
              </div>
              <div>
                <p className="text-[12px] text-slate-400">Total Partisipan Kumulatif</p>
                <p className="mt-1 text-[32px] font-semibold">1,248</p>
              </div>
              <div>
                <p className="text-[12px] text-slate-400">Bergabung Sejak</p>
                <p className="mt-1 text-[16px]">{admin.joinedAt}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </SuperadminShell>
  )
}
