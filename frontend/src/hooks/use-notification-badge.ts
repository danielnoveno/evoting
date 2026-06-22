'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { areNotificationsEnabled } from '@/lib/supabase/config'
import { useCurrentProfile } from '@/hooks/use-profile'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

const READ_STORAGE_KEY = 'votein_notif_read_ids'

interface NotificationItem {
  id: string
  title: string
  description: string
  type: 'info' | 'success' | 'warning'
  link?: string | null
  createdAt: string
}

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

export function useNotificationBadge() {
  const { data: profile } = useCurrentProfile()
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationsEnabled = areNotificationsEnabled()

  const isPersonal = !!profile

  const { data: notifications } = useQuery({
    queryKey: isPersonal
      ? ['user-notifications-page']
      : ['public-notifications-page'],
    queryFn: async () => {
      if (isPersonal) {
        // Authenticated: use /api/notifications/list with Bearer token
        const client = getSupabaseBrowserClient()
        const token = client ? (await client.auth.getSession()).data.session?.access_token : null
        const res = await fetch('/api/notifications/list', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) return []
        const payload = await res.json()
        return (payload.notifications ?? []) as NotificationItem[]
      } else {
        // Public: use /api/notifications/public (no auth needed)
        const res = await fetch('/api/notifications/public')
        if (!res.ok) return []
        const payload = await res.json()
        return (payload.notifications ?? []) as NotificationItem[]
      }
    },
    enabled: notificationsEnabled,
    retry: false,
    refetchInterval: 60000,
  })

  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setUnreadCount(0)
      updateFaviconBadge(false)
      return
    }

    const readIds = getReadIds()
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
