'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'

type AuthErrorLike = {
  status?: number
  message?: string
}

function getAuthErrorLike(error: unknown): AuthErrorLike {
  if (typeof error !== 'object' || error === null) return {}
  const record = error as Record<string, unknown>
  return {
    status: typeof record.status === 'number' ? record.status : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
  }
}

function isInvalidStoredSession(error: unknown): boolean {
  const { status, message } = getAuthErrorLike(error)
  const normalizedMessage = message?.toLowerCase() ?? ''

  return status === 401
    || status === 403
    || normalizedMessage.includes('jwt')
    || normalizedMessage.includes('session')
    || normalizedMessage.includes('expired')
    || normalizedMessage.includes('invalid')
    || normalizedMessage.includes('not found')
}

async function clearLocalAuthSession() {
  const client = getSupabaseBrowserClient()
  if (!client) return

  await client.auth.signOut({ scope: 'local' }).catch(() => undefined)
}

export async function getCurrentSession() {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const { data, error } = await client.auth.getSession()
  if (error) {
    if (isInvalidStoredSession(error)) {
      await clearLocalAuthSession()
      return null
    }

    throw new RepositoryError('Gagal memuat sesi akun. Coba lagi.')
  }

  if (!data.session) return null

  const { error: userError } = await client.auth.getUser()
  if (userError) {
    if (isInvalidStoredSession(userError)) {
      await clearLocalAuthSession()
      return null
    }

    throw new RepositoryError('Gagal memvalidasi sesi akun. Coba lagi.')
  }

  return data.session
}

export async function signInWithEmailPassword(email: string, password: string) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const { data, error } = await client.auth.signInWithPassword({ email, password })
  
  if (error) {
    if (error.status === 429) {
      throw new RepositoryError('Terlalu banyak percobaan. Silakan tunggu sebentar.')
    }
    
    // Check for unconfirmed email which often returns 400
    if (error.message.toLowerCase().includes('confirm') || error.message.toLowerCase().includes('verified')) {
      throw new RepositoryError('Email Anda belum dikonfirmasi. Silakan cek inbox email kampus Anda untuk aktivasi.')
    }

    if (error.status === 400) {
      throw new RepositoryError('Email kampus atau password tidak cocok. Pastikan akun sudah aktif.')
    }
    
    throw new RepositoryError(error.message || 'Gagal masuk ke sistem. Coba lagi.')
  }

  return data.session
}

export async function signUpWithEmailPassword(email: string, password: string) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const { data, error } = await client.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        full_name: email.split('@')[0],
      }
    }
  })
  
  if (error) {
    if (error.message.includes('User already registered')) {
      throw new RepositoryError('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.')
    }
    if (error.message.includes('Password should be at least')) {
      throw new RepositoryError('Password minimal harus 6 karakter.')
    }
    if (error.message.includes('invalid format')) {
      throw new RepositoryError('Format email tidak valid. Pastikan email Anda benar.')
    }
    throw new RepositoryError(error.message)
  }
  return data.session
}

export async function resetPasswordForEmail(email: string) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/update-password`,
  })
  
  if (error) throw new RepositoryError(error.message)
}

export async function updatePassword(newPassword: string) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const { error } = await client.auth.updateUser({
    password: newPassword,
  })

  if (error) throw new RepositoryError(error.message)
}

export async function signOutCurrentSession() {
  const client = getSupabaseBrowserClient()
  if (!client) return

  const { error } = await client.auth.signOut()
  if (error) {
    if (isInvalidStoredSession(error)) {
      await clearLocalAuthSession()
      return
    }

    throw new RepositoryError('Gagal mengakhiri sesi akun. Coba lagi.')
  }
}

// MFA Functions
export async function enrollMFA() {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client.auth.mfa.enroll({
    factorType: 'totp',
  })

  if (error) throw new RepositoryError(error.message)
  return data
}

export async function verifyMFA(factorId: string, code: string) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data: challengeData, error: challengeError } = await client.auth.mfa.challenge({
    factorId,
  })

  if (challengeError) throw new RepositoryError(challengeError.message)

  const { data, error } = await client.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  })

  if (error) throw new RepositoryError(error.message)
  return data
}

export async function unenrollMFA(factorId: string) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client.auth.mfa.unenroll({
    factorId,
  })

  if (error) throw new RepositoryError(error.message)
  return data
}

export async function getMFAFactors() {
  const client = getSupabaseBrowserClient()
  if (!client) return { totp: [] }

  const { data, error } = await client.auth.mfa.listFactors()
  if (error) throw new RepositoryError(error.message)

  return data
}
