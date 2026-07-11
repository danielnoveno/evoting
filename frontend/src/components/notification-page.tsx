'use client'

import {
  Bell,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ArrowLeft,
  CheckCheck,
  EyeOff,
  Trash2,
  Square,
  CheckSquare,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ScrollReveal, StaggerContainer } from '@/components/public/parallax'
import { AppSectionCard } from '@/components/ui/app-section-card'
import {
  isNotificationRead,
  markNotificationRead,
  markNotificationsRead,
  markNotificationsUnread,
} from '@/lib/notification-store'
import { useToast } from '@/components/ui/toast-provider'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { timeAgo } from '@/lib/repositories/helpers'

interface NotificationItem {
  id: string
  title: string
  description: string
  type: 'info' | 'success' | 'warning'
  link?: string | null
  actorLabel?: string | null
  createdAt: string
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
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [readVersion, setReadVersion] = useState(0) // force re-render when read state changes

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-notifications-page'],
    queryFn: async () => {
      const client = getSupabaseBrowserClient()
      const token = client ? (await client.auth.getSession()).data.session?.access_token : null
      // ponytail: jangan kirim request tanpa token — API akan return 401
      if (!token) return []
      const res = await fetch('/api/notifications/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Gagal memuat notifikasi')
      const payload = await res.json()
      return payload.notifications as NotificationItem[]
    },
    retry: false,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  })

  const notifications = data ?? []
  const allIds = notifications.map((n) => n.id)
  const allSelected = allIds.length > 0 && selected.size === allIds.length

  // Refresh read state when notifications change
  useEffect(() => {
    setReadVersion((v) => v + 1)
  }, [notifications])

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === allIds.length) return new Set()
      return new Set(allIds)
    })
  }, [allIds])

  const handleBulkMarkRead = useCallback(() => {
    markNotificationsRead([...selected])
    setReadVersion((v) => v + 1)
    setSelected(new Set())
    showToast({ tone: 'success', title: `${selected.size} notifikasi ditandai sudah dibaca` })
  }, [selected, showToast])

  const handleBulkMarkUnread = useCallback(() => {
    markNotificationsUnread([...selected])
    setReadVersion((v) => v + 1)
    setSelected(new Set())
    showToast({ tone: 'success', title: `${selected.size} notifikasi ditandai belum dibaca` })
  }, [selected, showToast])

  const handleBulkDelete = useCallback(async () => {
    try {
      const client = getSupabaseBrowserClient()
      const token = client ? (await client.auth.getSession()).data.session?.access_token : null
      const res = await fetch('/api/notifications/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids: [...selected] }),
      })
      if (!res.ok) throw new Error('Gagal menghapus notifikasi')
      queryClient.invalidateQueries({ queryKey: ['user-notifications-page'] })
      setSelected(new Set())
      showToast({ tone: 'success', title: `${selected.size} notifikasi dihapus` })
    } catch {
      showToast({ tone: 'error', title: 'Gagal menghapus notifikasi' })
    }
  }, [selected, queryClient, showToast])

  const handleNotificationClick = useCallback(
    (item: NotificationItem) => {
      markNotificationRead(item.id)
      setReadVersion((v) => v + 1)
      if (item.link) {
        router.push(item.link)
      }
    },
    [router],
  )

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
          <>
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {allSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                {allSelected ? 'Batal Pilih' : 'Pilih Semua'}
              </button>

              {selected.size > 0 && (
                <>
                  <span className="text-[12px] text-slate-400">{selected.size} dipilih</span>

                  <button
                    type="button"
                    onClick={handleBulkMarkRead}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tandai Dibaca
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkMarkUnread}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    Tandai Belum Dibaca
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </>
              )}
            </div>

            {/* Notification list */}
            <div className="space-y-3">
              {notifications.map((item) => {
                const isRead = isNotificationRead(item.id)
                return (
                  <div
                    key={item.id}
                    className={`group relative flex gap-4 rounded-2xl border p-5 transition-all ${
                      isRead
                        ? 'border-slate-100 bg-slate-50/50'
                        : 'border-slate-200 bg-white shadow-sm'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                    >
                      {selected.has(item.id) ? (
                        <CheckSquare className="h-4 w-4 text-slate-900" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
                      )}
                    </button>

                    {/* Icon */}
                    <div
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        item.type === 'info'
                          ? 'bg-blue-50 text-blue-600'
                          : item.type === 'success'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {item.type === 'info' ? (
                        <Info className="h-5 w-5" />
                      ) : item.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3
                          className={`text-[15px] font-semibold ${
                            isRead ? 'text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {!isRead && (
                            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                          )}
                          {item.title}
                        </h3>
                        <span className="flex shrink-0 items-center gap-1 text-[12px] text-slate-400 whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      <p className={`mt-1 text-[13px] leading-6 ${isRead ? 'text-slate-400' : 'text-slate-600'}`}>
                        {item.description}
                      </p>
                      {item.actorLabel && (
                        <p className="mt-1 text-[12px] text-slate-400">Oleh: {item.actorLabel}</p>
                      )}
                      {item.link && (
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Lihat detail
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </StaggerContainer>
    </div>
  )
}
