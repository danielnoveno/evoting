'use client'

import { Bell, Clock, Info, CheckCircle2, AlertTriangle, ExternalLink, ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { AppSectionCard } from '@/components/ui/app-section-card'

interface NotificationItem {
  id: string
  title: string
  description: string
  type: 'info' | 'success' | 'warning'
  link?: string | null
  actorLabel?: string | null
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

export function NotificationPage({
  backHref,
  backLabel,
  emptyTitle = 'Belum ada notifikasi',
  emptyDescription = 'Notifikasi akan muncul di sini saat ada aktivitas terkait akun Anda.',
}: {
  backHref: string
  backLabel?: string
  emptyTitle?: string
  emptyDescription?: string
}) {
  const router = useRouter()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-notifications-page'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/list')
      if (!res.ok) throw new Error('Gagal memuat notifikasi')
      const payload = await res.json()
      return payload.notifications as NotificationItem[]
    },
    retry: false,
  })

  const notifications = data ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <ScrollReveal variant="fade-up" duration={600}>
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="mb-6 inline-flex items-center gap-2 text-[14px] font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel ?? 'Kembali'}
        </button>

        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-slate-700" />
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-slate-900 sm:text-[36px]">
            Notifikasi
          </h1>
        </div>
        <p className="mt-2 text-[15px] text-slate-600">
          Update aktivitas, hasil voting, dan pengumuman untuk akun Anda.
        </p>
      </ScrollReveal>

      <StaggerContainer stagger={80} variant="fade-up" duration={500} className="mt-8">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
            <p className="mt-4 text-[14px] text-slate-500">Memuat notifikasi...</p>
          </div>
        ) : isError ? (
          <AppSectionCard className="py-16 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-200" />
            <p className="mt-4 text-[14px] text-slate-500">Gagal memuat notifikasi. Coba muat ulang halaman.</p>
          </AppSectionCard>
        ) : notifications.length === 0 ? (
          <AppSectionCard className="py-16 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-200" />
            <p className="mt-4 text-[15px] font-medium text-slate-700">{emptyTitle}</p>
            <p className="mt-1 text-[13px] text-slate-500">{emptyDescription}</p>
          </AppSectionCard>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className="group relative flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-slate-200"
              >
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  item.type === 'info' ? 'bg-blue-50 text-blue-600' :
                  item.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {item.type === 'info' ? <Info className="h-5 w-5" /> :
                   item.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                   <AlertTriangle className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold text-slate-900">{item.title}</h3>
                    <span className="flex shrink-0 items-center gap-1 text-[12px] text-slate-400 whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-6 text-slate-600">{item.description}</p>
                  {item.actorLabel && (
                    <p className="mt-1 text-[12px] text-slate-400">Oleh: {item.actorLabel}</p>
                  )}
                  {item.link && (
                    <a
                      href={item.link}
                      className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Lihat detail
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </StaggerContainer>
    </div>
  )
}
