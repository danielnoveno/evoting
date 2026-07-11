'use client'

import { Bell } from 'lucide-react'
import { NotificationPage } from '@/components/notification-page'
import { PublicNotificationPage } from '@/components/public-notification-page'
import { useCurrentProfile } from '@/hooks/use-profile'

export default function NotifikasiPage() {
  const { data: profile, isLoading } = useCurrentProfile()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Bell className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-4 text-[14px] text-slate-500">Memuat notifikasi...</p>
      </div>
    )
  }

  if (profile) {
    const backHref = profile.role === 'super_admin'
      ? '/superadmin'
      : profile.role === 'admin'
        ? '/admin'
        : '/pemilih'

    return <NotificationPage backHref={backHref} backLabel="Kembali ke dashboard" />
  }

  return <PublicNotificationPage />
}
