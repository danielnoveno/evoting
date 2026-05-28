'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'

export type AdminInvitePreview = {
  email: string
  displayName: string | null
  walletAddress: string | null
  role: 'admin' | 'super_admin'
  expiresAt: string
}

export type CreateAdminInviteInput = {
  email: string
  displayName: string
  walletAddress?: string
  role?: 'admin' | 'super_admin'
  organizationName?: string
  accessScope?: 'all' | 'specific'
}

export type CreateAdminInviteResult = AdminInvitePreview & {
  activationLink: string | null
  emailStatus?: 'sent' | 'skipped' | 'failed'
  emailError?: string
}

export type ResendInviteResult = {
  activationLink: string
  emailStatus: 'sent' | 'failed'
  emailId?: string
  emailError?: string
}

export type ActivateAdminInviteResult = {
  email: string
  displayName: string | null
  role: 'admin' | 'super_admin'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readApiError(response: Response, fallback: string): Promise<RepositoryError> {
  try {
    const payload: unknown = await response.json()
    if (isRecord(payload) && typeof payload.error === 'string') {
      return new RepositoryError(payload.error)
    }
  } catch {
    // Ignore invalid JSON and use the safe fallback below.
  }

  return new RepositoryError(fallback)
}

function parseInvitePreview(payload: unknown): AdminInvitePreview {
  if (!isRecord(payload)) throw new RepositoryError('Respons undangan tidak valid.')

  const data = isRecord(payload.invite) ? payload.invite : payload
  if (!isRecord(data)) throw new RepositoryError('Data undangan tidak valid.')

  const role = data.role
  if (typeof data.email !== 'string' || (role !== 'admin' && role !== 'super_admin') || typeof data.expiresAt !== 'string') {
    throw new RepositoryError('Data undangan tidak lengkap.')
  }

  return {
    email: data.email,
    displayName: typeof data.displayName === 'string' ? data.displayName : null,
    walletAddress: typeof data.walletAddress === 'string' ? data.walletAddress : null,
    role,
    expiresAt: data.expiresAt,
  }
}

export async function getAdminInvitePreview(token: string): Promise<AdminInvitePreview> {
  const normalizedToken = token.trim()
  if (!normalizedToken) throw new RepositoryError('Token undangan tidak ditemukan.')

  const response = await fetch(`/api/admin-invites?token=${encodeURIComponent(normalizedToken)}`, {
    method: 'GET',
  })

  if (!response.ok) throw await readApiError(response, 'Undangan tidak valid atau sudah kedaluwarsa.')

  return parseInvitePreview(await response.json())
}

export async function createAdminInvite(input: CreateAdminInviteInput): Promise<CreateAdminInviteResult> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.access_token) throw new RepositoryError('Sesi superadmin belum aktif. Silakan masuk ulang.')

  const body: Record<string, unknown> = {
    email: input.email,
    displayName: input.displayName,
  }

  if (input.walletAddress) body.walletAddress = input.walletAddress
  if (input.role) body.role = input.role
  if (input.organizationName) body.organizationName = input.organizationName
  if (input.accessScope) body.accessScope = input.accessScope

  const response = await fetch('/api/admin-invites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw await readApiError(response, 'Gagal membuat undangan.')

  const payload: unknown = await response.json()
  if (!isRecord(payload)) throw new RepositoryError('Respons tidak valid dari server.')

  const activationLink = typeof payload.activationLink === 'string' ? payload.activationLink : null

  return {
    ...parseInvitePreview(payload),
    activationLink,
    emailStatus: payload.emailStatus as 'sent' | 'skipped' | 'failed' | undefined,
    emailError: typeof payload.emailError === 'string' ? payload.emailError : undefined,
  }
}

export async function resendAdminInvite(email: string): Promise<ResendInviteResult> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.access_token) throw new RepositoryError('Sesi superadmin belum aktif. Silakan masuk ulang.')

  const response = await fetch('/api/admin-invites/resend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message = (isRecord(payload) && typeof payload.error === 'string') ? payload.error : 'Gagal mengirim ulang undangan.'
    throw new RepositoryError(message)
  }

  const payload: unknown = await response.json()
  if (!isRecord(payload)) throw new RepositoryError('Respons tidak valid.')

  return {
    activationLink: typeof payload.activationLink === 'string' ? payload.activationLink : '',
    emailStatus: payload.emailStatus === 'sent' ? 'sent' : 'failed',
    emailId: typeof payload.emailId === 'string' ? payload.emailId : undefined,
    emailError: typeof payload.emailError === 'string' ? payload.emailError : undefined,
  }
}

export async function activateAdminInvite(token: string, password: string): Promise<ActivateAdminInviteResult> {
  const response = await fetch('/api/admin-invites/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })

  if (!response.ok) throw await readApiError(response, 'Aktivasi akun gagal.')

  const payload: unknown = await response.json()
  if (!isRecord(payload) || typeof payload.email !== 'string') {
    throw new RepositoryError('Respons aktivasi tidak valid.')
  }

  const role = payload.role
  if (role !== 'admin' && role !== 'super_admin') throw new RepositoryError('Role aktivasi tidak valid.')

  return {
    email: payload.email,
    displayName: typeof payload.displayName === 'string' ? payload.displayName : null,
    role,
  }
}
