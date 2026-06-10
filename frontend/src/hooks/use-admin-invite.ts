'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  claimAdminInvite,
  createAdminInvite,
  getAdminInvitePreview,
  resendAdminInvite,
  type CreateAdminInviteInput,
} from '@/lib/repositories/adminInviteRepository'
import { profileQueryKeys } from '@/hooks/use-profile'

export const adminInviteQueryKeys = {
  preview: (token: string) => ['admin-invite', 'preview', token] as const,
}

export function useAdminInvitePreview(token: string | null | undefined) {
  const normalizedToken = token?.trim() ?? ''

  return useQuery({
    queryKey: adminInviteQueryKeys.preview(normalizedToken),
    queryFn: () => getAdminInvitePreview(normalizedToken),
    enabled: Boolean(normalizedToken),
    retry: false,
  })
}

export function useCreateAdminInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAdminInviteInput) => createAdminInvite(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.superadmins })
    },
  })
}

export function useResendAdminInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (email: string) => resendAdminInvite(email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.superadmins })
    },
  })
}

export function useClaimAdminInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => claimAdminInvite(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-invite'] })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.current })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.superadmins })
    },
  })
}
