'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCurrentSession,
  signInWithEmailPassword,
  signInWithMicrosoftCampus,
  signOutCurrentSession,
} from '@/lib/repositories/authRepository'

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

export function useMicrosoftCampusLogin() {
  return useMutation({
    mutationFn: ({ nextPath }: { nextPath: string }) => signInWithMicrosoftCampus(nextPath),
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
