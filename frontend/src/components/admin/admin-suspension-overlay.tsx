'use client'

import { ShieldAlert, LogOut, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCurrentAdminRegistryStatus, useCurrentProfile } from '@/hooks/use-profile'
import { useLogoutSession } from '@/hooks/use-auth-session'
import { Loader2 } from 'lucide-react'

export function AdminSuspensionOverlay() {
  const router = useRouter()
  const { data: currentProfile } = useCurrentProfile()
  const registryStatusQuery = useCurrentAdminRegistryStatus()
  const logoutSession = useLogoutSession()

  // Hanya tampilkan overlay untuk admin (bukan super_admin) yang status registry-nya inactive
  const isSuspended = currentProfile?.role === 'admin'
    && registryStatusQuery.data?.status === 'inactive'

  if (!isSuspended) return null

  const contactEmail = registryStatusQuery.data?.updatedByEmail
  const contactName = registryStatusQuery.data?.updatedByName

  const handleLogout = () => {
    logoutSession.mutate(undefined, {
      onSettled: () => {
        router.replace('/hubungkan-dompet')
      },
    })
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[480px] overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-2xl md:p-12">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[24px] bg-red-50 text-red-500">
          <ShieldAlert className="h-10 w-10" strokeWidth={1.5} />
        </div>

        <h2 className="text-[26px] font-bold tracking-tight text-slate-900 md:text-[30px]">
          Akun Admin Dinonaktifkan
        </h2>
        <p className="mx-auto mt-4 max-w-[380px] text-[15px] leading-7 text-slate-500">
          Akses panel admin Anda telah dinonaktifkan oleh super admin. Anda tidak dapat
 melakukan
          tindakan apapun di dashboard hingga akun diaktifkan kembali.
        </p>

        {contactEmail && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Hubungi Admin yang Menonaktifkan
            </p>
            <div className="mt-2 flex items-center gap-2 text-[14px] text-slate-900">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{contactName ?? 'Super Admin'}</span>
            </div>
            <p className="mt-1 break-all pl-6 font-mono text-[13px] text-slate-600">{contactEmail}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutSession.isPending}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0B1120] px-8 text-[15px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60"
          >
            {logoutSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Keluar dari Akun
          </button>
        </div>
      </div>
    </div>
  )
}
