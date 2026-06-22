'use client'

import { NotificationPage } from '@/components/notification-page'

export default function AdminNotifikasiPage() {
  return (
    <NotificationPage
      backHref="/admin"
      backLabel="Kembali ke Dashboard Admin"
      emptyTitle="Belum ada notifikasi"
      emptyDescription="Notifikasi akan muncul di sini saat ada aktivitas terkait proposal atau pemilihan Anda."
    />
  )
}
