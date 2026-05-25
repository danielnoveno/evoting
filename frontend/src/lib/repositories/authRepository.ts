'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'

export async function getCurrentSession() {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const { data, error } = await client.auth.getSession()
  if (error) throw new RepositoryError('Gagal memuat sesi akun. Coba lagi.')

  return data.session
}

export async function signInWithEmailPassword(email: string, password: string) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new RepositoryError('Email kampus atau password tidak cocok. Coba lagi.')

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
  
  if (error) throw new RepositoryError(error.message)
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
  if (error) throw new RepositoryError('Gagal mengakhiri sesi akun. Coba lagi.')
}
