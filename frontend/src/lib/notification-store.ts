'use client'

const STORAGE_KEY = 'votein_notif_read_ids'
const DELETED_STORAGE_KEY = 'votein_notif_deleted_ids'

function getStringSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(arr)
  } catch {
    return new Set()
  }
}

function saveStringSet(key: string, set: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch {
    // quota exceeded or private browsing — ignore
  }
}

function getReadSet(): Set<string> {
  return getStringSet(STORAGE_KEY)
}

function saveReadSet(set: Set<string>) {
  saveStringSet(STORAGE_KEY, set)
}

function getDeletedSet(): Set<string> {
  return getStringSet(DELETED_STORAGE_KEY)
}

function saveDeletedSet(set: Set<string>) {
  saveStringSet(DELETED_STORAGE_KEY, set)
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

/** Mark multiple notifications as unread */
export function markNotificationsUnread(ids: string[]) {
  const s = getReadSet()
  ids.forEach((id) => s.delete(id))
  saveReadSet(s)
}

/** Check if a notification has been deleted/dismissed on this device */
export function isNotificationDeleted(id: string): boolean {
  return getDeletedSet().has(id)
}

/** Get all locally deleted notification IDs */
export function getDeletedNotificationIds(): string[] {
  return [...getDeletedSet()]
}

/** Hide multiple notifications on this device */
export function markNotificationsDeleted(ids: string[]) {
  const s = getDeletedSet()
  ids.forEach((id) => s.add(id))
  saveDeletedSet(s)
}
