'use client'

const STORAGE_KEY = 'votein_notif_read_ids'

function getReadSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(arr)
  } catch {
    return new Set()
  }
}

function saveReadSet(set: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    // quota exceeded or private browsing — ignore
  }
}

/** Check if a notification has been read */
export function isNotificationRead(id: string): boolean {
  return getReadSet().has(id)
}

/** Get all read notification IDs */
export function getReadNotificationIds(): string[] {
  return [...getReadSet()]
}

/** Mark a single notification as read */
export function markNotificationRead(id: string) {
  const s = getReadSet()
  s.add(id)
  saveReadSet(s)
}

/** Mark multiple notifications as read */
export function markNotificationsRead(ids: string[]) {
  const s = getReadSet()
  ids.forEach((id) => s.add(id))
  saveReadSet(s)
}

/** Mark a single notification as unread */
export function markNotificationUnread(id: string) {
  const s = getReadSet()
  s.delete(id)
  saveReadSet(s)
}

/** Mark multiple notifications as unread */
export function markNotificationsUnread(ids: string[]) {
  const s = getReadSet()
  ids.forEach((id) => s.delete(id))
  saveReadSet(s)
}

/** Mark all given notifications as read */
export function markAllRead(ids: string[]) {
  const s = getReadSet()
  ids.forEach((id) => s.add(id))
  saveReadSet(s)
}

/** Mark all given notifications as unread */
export function markAllUnread(ids: string[]) {
  const s = getReadSet()
  ids.forEach((id) => s.delete(id))
  saveReadSet(s)
}
