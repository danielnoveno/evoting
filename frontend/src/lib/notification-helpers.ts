'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export type NotificationPayload = {
  eventType: string
  title: string
  description: string
  actorLabel?: string
  message?: string | null
  link?: string
  type?: 'info' | 'success' | 'warning'
}

/**
 * Insert an in-app notification for a specific profile.
 * Fire-and-forget: errors are caught and logged, never thrown.
 */
export async function insertNotification(targetProfileId: string | null, payload: NotificationPayload) {
  const client = getSupabaseBrowserClient()
  if (!client) return
  try {
    await client.schema('app').from('notification_jobs').insert({
      target_profile_id: targetProfileId,
      channel: 'in_app',
      template_key: 'proposal_activity',
      status: 'sent',
      payload,
    })
  } catch (error) {
    console.warn('[notification] Failed to insert in-app notification:', error)
  }
}

/**
 * Insert a public broadcast notification (no target profile).
 * Used for system-wide announcements (e.g. phase changes).
 */
export async function insertPublicNotification(payload: NotificationPayload) {
  const client = getSupabaseBrowserClient()
  if (!client) return
  try {
    await client.schema('app').from('notification_jobs').insert({
      channel: 'in_app',
      template_key: 'proposal_activity',
      status: 'sent',
      payload,
    })
  } catch (error) {
    console.warn('[notification] Failed to insert public notification:', error)
  }
}

/**
 * Notify all superadmins with an in-app notification.
 */
export async function notifySuperadmins(payload: NotificationPayload) {
  const client = getSupabaseBrowserClient()
  if (!client) return
  try {
    const { data } = await client.schema('app').from('app_profiles').select('id').eq('role', 'super_admin')
    const ids = (data ?? []).map((row: { id: string }) => row.id)
    await Promise.all(ids.map((id: string) => insertNotification(id, payload)))
  } catch (error) {
    console.warn('[notification] Failed to notify superadmins:', error)
  }
}

/**
 * Notify a voter about their commit/reveal action.
 * The notification goes to the voter's own profile.
 */
export async function notifyVoter(
  profileId: string,
  payload: NotificationPayload,
) {
  await insertNotification(profileId, payload)
}
