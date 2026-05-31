'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enrollMFA, getMFAFactors, unenrollMFA, verifyMFA } from '@/lib/repositories/authRepository'

export function useMFAFactors() {
  return useQuery({
    queryKey: ['auth', 'mfa-factors'],
    queryFn: getMFAFactors,
  })
}

export function useEnrollMFA() {
  return useMutation({
    mutationFn: enrollMFA,
  })
}

export function useVerifyMFA() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ factorId, code }: { factorId: string; code: string }) => verifyMFA(factorId, code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'mfa-factors'] })
    },
  })
}

export function useUnenrollMFA() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (factorId: string) => unenrollMFA(factorId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth', 'mfa-factors'] })
    },
  })
}
