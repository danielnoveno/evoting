'use client'

import { NotificationPage } from '@/components/notification-page'

export default function SuperadminNotifikasiPage() {
  return (
    <NotificationPage
      backHref="/superadmin"
      backLabel="Kembali ke Dashboard Superadmin"
      emptyTitle="Belum ada notifikasi"
      emptyDescription="Notifikasi akan muncul di sini saat ada proposal baru, aktivasi akun, atau aktivitas sistem."
    />
  )
}
