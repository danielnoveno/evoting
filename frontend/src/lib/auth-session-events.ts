export const MANUAL_LOGOUT_EVENT = 'votein:manual-logout'

const MANUAL_LOGOUT_STORAGE_KEY = 'votein:manual-logout-at'
const MANUAL_LOGOUT_GRACE_MS = 10_000

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

export function markManualLogoutStarted() {
  const storage = getStorage()
  storage?.setItem(MANUAL_LOGOUT_STORAGE_KEY, String(Date.now()))
  window.dispatchEvent(new Event(MANUAL_LOGOUT_EVENT))
}

export function clearManualLogoutMarker() {
  getStorage()?.removeItem(MANUAL_LOGOUT_STORAGE_KEY)
}

export function isManualLogoutInProgress() {
  const storage = getStorage()
  const storedValue = storage?.getItem(MANUAL_LOGOUT_STORAGE_KEY)
  if (!storedValue) return false

  const startedAt = Number.parseInt(storedValue, 10)
  if (!Number.isFinite(startedAt)) {
    clearManualLogoutMarker()
    return false
  }

  const isStillInGracePeriod = Date.now() - startedAt < MANUAL_LOGOUT_GRACE_MS
  if (!isStillInGracePeriod) clearManualLogoutMarker()
  return isStillInGracePeriod
}
