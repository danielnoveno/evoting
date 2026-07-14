'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDisconnect } from 'wagmi'
import { getCurrentSession, signInWithEmailPassword, signInWithMagicLink, signOutCurrentSession, signUpWithEmailPassword, resetPasswordForEmail, updatePassword } from '@/lib/repositories/authRepository'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { getPublicAppOrigin } from '@/lib/supabase/config'
import { clearManualLogoutMarker, markManualLogoutStarted } from '@/lib/auth-session-events'

export const authSessionQueryKey = ['auth', 'session'] as const

export function useAuthSession() {
  return useQuery({
    queryKey: authSessionQueryKey,
    queryFn: getCurrentSession,
    retry: false,
  })
}

export function useEmailPasswordLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signInWithEmailPassword(email, password),
    onSuccess: () => {
      clearManualLogoutMarker()
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useEmailPasswordSignUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signUpWithEmailPassword(email, password),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useMagicLinkLogin() {
  return useMutation({
    mutationFn: ({ email, nextPath }: { email: string; nextPath?: string }) => signInWithMagicLink(email, nextPath),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (email: string) => resetPasswordForEmail(email),
  })
}

export function useUpdatePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (password: string) => updatePassword(password),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
    },
  })
}

export function useMicrosoftCampusLogin() {
  return useMutation({
    mutationFn: async ({ nextPath }: { nextPath?: string }) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new Error('Supabase client not available')
      const appOrigin = getPublicAppOrigin(window.location.origin)

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid profile email',
          queryParams: {
            prompt: 'select_account',
          },
          redirectTo: `${appOrigin}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`,
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // OAuth redirect happens
    }
  })
}

export function useGoogleLogin() {
  return useMutation({
    mutationFn: async ({ nextPath }: { nextPath?: string }) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new Error('Supabase client not available')
      const appOrigin = getPublicAppOrigin(window.location.origin)

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          redirectTo: `${appOrigin}/auth/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`,
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // OAuth redirect happens
    }
  })
}

export function useLogoutSession() {
  const queryClient = useQueryClient()
  const { disconnect } = useDisconnect()

  return useMutation({
    mutationFn: signOutCurrentSession,
    onMutate: async () => {
      markManualLogoutStarted()
      await queryClient.cancelQueries({ queryKey: authSessionQueryKey })
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      queryClient.setQueryData(authSessionQueryKey, null)
      queryClient.removeQueries({ queryKey: ['profile'] })
      disconnect()
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
