'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'

function getOAuthRedirectUrl(nextPath: string) {
  if (typeof window === 'undefined') return undefined

  const callbackUrl = new URL('/auth/callback', window.location.origin)
  callbackUrl.searchParams.set('next', nextPath)
  return callbackUrl.toString()
}

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

export async function signInWithMicrosoftCampus(nextPath: string) {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend login belum dikonfigurasi.')

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: getOAuthRedirectUrl(nextPath),
      scopes: 'openid email profile',
      queryParams: {
        prompt: 'select_account',
        domain_hint: 'uajy.ac.id',
      },
    },
  })

  if (error) {
    throw new RepositoryError('Login Microsoft kampus belum berhasil. Coba lagi atau hubungi admin.')
  }

  if (!data.url) {
    throw new RepositoryError('Tautan login Microsoft kampus tidak tersedia.')
  }

  window.location.assign(data.url)
}

export async function signOutCurrentSession() {
  const client = getSupabaseBrowserClient()
  if (!client) return

  const { error } = await client.auth.signOut()
  if (error) throw new RepositoryError('Gagal mengakhiri sesi akun. Coba lagi.')
}
