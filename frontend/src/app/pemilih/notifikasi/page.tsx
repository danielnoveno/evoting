'use client'

import { NotificationPage } from '@/components/notification-page'

export default function VoterNotifikasiPage() {
  return (
    <NotificationPage
      backHref="/pemilih"
      backLabel="Kembali ke Dashboard Pemilih"
      emptyTitle="Belum ada notifikasi"
      emptyDescription="Notifikasi akan muncul di sini saat ada informasi terkait pemilihan yang Anda ikuti."
    />
  )
}
