'use client'

import { useEffect, useRef, useCallback } from 'react'

const STORAGE_PREFIX = 'votein:form-draft:'

/**
 * Persist form state to localStorage so data survives session timeout,
 * accidental navigation, or page refresh. Call `clearDraft()` on successful submit.
 *
 * @param key - Unique identifier for this form (e.g. "proposal-create", "candidate-edit-123")
 * @param state - The current form state object
 * @param setState - The state setter function
 * @param clearOnMount - If true, clear any existing draft on mount (use for create forms)
 */
export function useFormDraft<T extends object>(
  key: string,
  state: T,
  setState: React.Dispatch<React.SetStateAction<T>>,
  clearOnMount = false,
) {
  const storageKey = `${STORAGE_PREFIX}${key}`
  const skipNextSaveRef = useRef(false)

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      if (clearOnMount) {
        // Create forms: always start fresh, remove any stale draft
        localStorage.removeItem(storageKey)
        return
      }
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>
        setState((prev) => ({ ...prev, ...parsed }))
        // Skip the next save cycle to avoid overwriting with stale data
        skipNextSaveRef.current = true
      }
    } catch {
      // Corrupted data — ignore and start fresh
      localStorage.removeItem(storageKey)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save to localStorage on every state change
  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // Storage full — silently ignore
    }
  }, [state, storageKey])

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Ignore
    }
  }, [storageKey])

  return { clearDraft }
}
