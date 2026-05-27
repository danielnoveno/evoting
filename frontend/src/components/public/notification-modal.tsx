'use client'

import { useEffect } from 'react'
import { Bell, Clock, Info, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ModalShell } from '@/components/ui/modal-shell'
import { listPublicNotifications, listUserNotifications } from '@/lib/repositories/electionRepository'
import { useNotificationBadge } from '@/hooks/use-notification-badge'

export interface NotificationItem {
  id: string
  title: string
  description: string
  timeLabel: string
  type: 'info' | 'success' | 'warning'
  link?: string
}

export function NotificationModal({
  open,
  onClose,
  profileId,
  walletAddress,
}: {
  open: boolean
  onClose: () => void
  profileId?: string
  walletAddress?: string
}) {
  const { markAsRead } = useNotificationBadge()
  const isPersonal = !!(profileId || walletAddress)
  const notificationQuery = useQuery({
    queryKey: isPersonal ? ['user', 'notifications', profileId, walletAddress] : ['public', 'notifications'],
    queryFn: () => isPersonal 
      ? listUserNotifications(profileId, walletAddress)
      : listPublicNotifications(),
    enabled: open,
    retry: false,
  })
  const notifications = notificationQuery.data ?? []

  useEffect(() => {
    if (open && !notificationQuery.isLoading && notifications.length > 0) {
      markAsRead()
    }
  }, [open, notificationQuery.isLoading, notifications.length, markAsRead])

  return (
    <ModalShell
      open={open}
      title={isPersonal ? 'Notifikasi Anda' : 'Notifikasi Publik'}
      description={isPersonal 
        ? 'Update aktivitas, hasil voting, dan pengumuman untuk akun Anda.' 
        : 'Update terbaru mengenai fase pemilihan dan aktivitas sistem Votein.'}
      onClose={onClose}
    >
      <div className="max-h-[400px] overflow-y-auto pr-2">
        <div className="space-y-4">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="group relative flex gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-slate-200 hover:shadow-sm"
            >
              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                item.type === 'info' ? 'bg-blue-50 text-blue-600' :
                item.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                'bg-amber-50 text-amber-600'
              }`}>
                {item.type === 'info' ? <Info className="h-5 w-5" /> :
                 item.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                 <AlertTriangle className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-semibold text-slate-900 truncate">{item.title}</h3>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {item.timeLabel}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-6 text-slate-600">
                  {item.description}
                </p>
                {item.link && (
                  <a
                    href={item.link}
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Lihat detail
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {!notificationQuery.isLoading && notifications.length === 0 && (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-200" />
            <p className="mt-4 text-[14px] text-slate-500">Tidak ada notifikasi saat ini.</p>
          </div>
        )}
        {notificationQuery.isLoading ? (
          <div className="py-12 text-center text-[14px] text-slate-500">Memuat notifikasi dari Supabase...</div>
        ) : null}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <button
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-slate-900 text-[14px] font-medium text-white hover:bg-slate-800 transition-colors"
        >
          Tutup
        </button>
      </div>
    </ModalShell>
  )
}
