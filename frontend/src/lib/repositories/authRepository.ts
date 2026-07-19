'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'
import { clearLocalAuthSession, isInvalidStoredSession } from './helpers'

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

export async function signInWithMagicLink(email: string, nextPath = '/pemilih', shouldCreateUser = true) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const normalizedEmail = email.trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new RepositoryError('Format email tidak valid. Pastikan alamat email sudah benar.')
  }

  if (!shouldCreateUser) {
    const eligibility = await fetch(`/api/auth/magic-link-eligibility?email=${encodeURIComponent(normalizedEmail)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    if (!eligibility.ok) {
      const body = await eligibility.json().catch(() => null)
      throw new RepositoryError(body?.error ?? 'Email belum teraktivasi sebagai pemilih. Gunakan link aktivasi dari admin terlebih dahulu.')
    }
  }

  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser,
      data: {
        full_name: normalizedEmail.split('@')[0],
      },
    },
  })

  if (error) {
    if (error.status === 429) {
      throw new RepositoryError('Terlalu banyak permintaan link masuk. Tunggu sebentar lalu coba lagi.')
    }
    if (!shouldCreateUser) {
      throw new RepositoryError('Email belum terdaftar atau belum diaktivasi. Gunakan link aktivasi dari admin terlebih dahulu.')
    }
    throw new RepositoryError(error.message || 'Gagal mengirim link masuk. Coba lagi.')
  }
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

  try {
    const { error } = await client.auth.signOut()
    if (error && !isInvalidStoredSession(error)) {
      console.warn('[Auth Repository] Server sign-out failed, clearing local session anyway:', error)
    }
  } catch (err) {
    console.error('[Auth Repository] Unexpected error during server sign-out:', err)
  } finally {
    // ALWAYS clear local session to ensure cookies are removed even if network fails
    await clearLocalAuthSession()
  }
}
