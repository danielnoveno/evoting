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
