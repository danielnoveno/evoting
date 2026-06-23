'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { areNotificationsEnabled } from '@/lib/supabase/config'
import { useCurrentProfile } from '@/hooks/use-profile'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { getReadNotificationIds } from '@/lib/notification-store'

interface NotificationItem {
  id: string
  title: string
  description: string
  type: 'info' | 'success' | 'warning'
  link?: string | null
  createdAt: string
}

export function useNotificationBadge() {
  const { data: profile, isLoading: profileLoading } = useCurrentProfile()
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationsEnabled = areNotificationsEnabled()

  const isPersonal = !!profile
  const profileId = profile?.id
  const walletAddress = profile?.walletAddress

  const { data: notifications } = useQuery({
    queryKey: isPersonal
      ? ['user-notifications-page', profileId, walletAddress]
      : ['public-notifications-page'],
    queryFn: async () => {
      if (isPersonal && profileId) {
        const client = getSupabaseBrowserClient()
        const token = client ? (await client.auth.getSession()).data.session?.access_token : null
        const res = await fetch('/api/notifications/list', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) return []
        const payload = await res.json()
        return (payload.notifications ?? []) as NotificationItem[]
      } else {
        const res = await fetch('/api/notifications/public')
        if (!res.ok) return []
        const payload = await res.json()
        return (payload.notifications ?? []) as NotificationItem[]
      }
    },
    enabled: notificationsEnabled && (isPersonal ? !!profileId : !profileLoading),
    staleTime: 0,
    retry: false,
    refetchInterval: 60000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setUnreadCount(0)
      updateFaviconBadge(false)
      return
    }

    const readIds = new Set(getReadNotificationIds())
    const count = notifications.filter((n) => !readIds.has(n.id)).length
    setUnreadCount(count)
    updateFaviconBadge(count > 0)
  }, [notifications])

  const markAsRead = () => {
    setUnreadCount(0)
    updateFaviconBadge(false)
  }

  return { hasUnread: unreadCount > 0, unreadCount, markAsRead }
}

function updateFaviconBadge(hasBadge: boolean) {
  if (typeof window === 'undefined') return

  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
  if (!favicon) return

  if (!hasBadge) {
    favicon.href = '/favicon.png'
    document.title = document.title.replace('● ', '')
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.src = '/favicon.png'
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    ctx.clearRect(0, 0, 64, 64)
    ctx.drawImage(img, 0, 0, 64, 64)

    ctx.fillStyle = '#ef4444'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4

    ctx.beginPath()
    ctx.arc(50, 14, 10, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    favicon.href = canvas.toDataURL('image/png')

    if (!document.title.startsWith('● ')) {
      document.title = '● ' + document.title
    }
  }
}
