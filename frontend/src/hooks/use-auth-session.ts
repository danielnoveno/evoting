'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentSession, signInWithEmailPassword, signOutCurrentSession, signUpWithEmailPassword, resetPasswordForEmail, updatePassword } from '@/lib/repositories/authRepository'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ nextPath }: { nextPath?: string }) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new Error('Supabase client not available')

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          scopes: 'openid profile email',
          redirectTo: `${window.location.origin}/auth/callback${nextPath ? `?next=${nextPath}` : ''}`,
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

  return useMutation({
    mutationFn: signOutCurrentSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authSessionQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
