'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listPublicNotifications, listUserNotifications } from '@/lib/repositories/electionRepository'
import { useCurrentProfile } from '@/hooks/use-profile'

const STORAGE_KEY = 'votein_last_notif_seen'

export function useNotificationBadge() {
  const { data: profile } = useCurrentProfile()
  const [hasUnread, setHasUnread] = useState(false)

  const isPersonal = !!profile
  const { data: notifications } = useQuery({
    queryKey: isPersonal ? ['user', 'notifications', profile.id, profile.walletAddress] : ['public', 'notifications'],
    queryFn: () => isPersonal 
      ? listUserNotifications(profile.id, profile.walletAddress)
      : listPublicNotifications(),
    refetchInterval: 60000, // Check every minute
  })

  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setHasUnread(false)
      return
    }

    const latestId = notifications[0].id
    const lastSeenId = localStorage.getItem(STORAGE_KEY)
    
    const isNew = latestId !== lastSeenId
    setHasUnread(isNew)
    updateFaviconBadge(isNew)
  }, [notifications])

  const markAsRead = () => {
    if (notifications && notifications.length > 0) {
      localStorage.setItem(STORAGE_KEY, notifications[0].id)
      setHasUnread(false)
      updateFaviconBadge(false)
    }
  }

  return { hasUnread, markAsRead }
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

    // Draw red dot badge
    ctx.fillStyle = '#ef4444' // slate-500 red
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
