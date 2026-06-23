'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'
import { isRecord } from '@/lib/repositories/helpers'

type SendVoterActivationEmailInput = {
  recipients: Array<{
    email: string
    name: string
    nim: string
  }>
}

export type SendVoterActivationEmailResult = {
  total: number
  sentCount: number
  failedCount: number
  failures: Array<{
    email: string
    success: false
    error?: string
  }>
}

export async function sendVoterActivationEmails(input: SendVoterActivationEmailInput): Promise<SendVoterActivationEmailResult> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.access_token) throw new RepositoryError('Sesi superadmin belum aktif. Silakan masuk ulang.')

  const response = await fetch('/api/voter-activation-email/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify(input),
  })

  const payload: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.error === 'string'
      ? payload.error
      : 'Gagal mengirim email aktivasi voter.'
    throw new RepositoryError(message)
  }

  if (!isRecord(payload)) throw new RepositoryError('Respons email aktivasi voter tidak valid.')

  return {
    total: typeof payload.total === 'number' ? payload.total : 0,
    sentCount: typeof payload.sentCount === 'number' ? payload.sentCount : 0,
    failedCount: typeof payload.failedCount === 'number' ? payload.failedCount : 0,
    failures: Array.isArray(payload.failures)
      ? payload.failures.filter(isRecord).map((item) => ({
        email: typeof item.email === 'string' ? item.email : '',
        success: false as const,
        error: typeof item.error === 'string' ? item.error : undefined,
      }))
      : [],
  }
}
