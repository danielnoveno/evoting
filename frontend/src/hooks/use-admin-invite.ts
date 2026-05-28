'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activateAdminInvite,
  createSuperadminInvite,
  getAdminInvitePreview,
  type CreateSuperadminInviteInput,
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

export function useCreateSuperadminInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSuperadminInviteInput) => createSuperadminInvite(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
      void queryClient.invalidateQueries({ queryKey: ['superadmins'] })
    },
  })
}

export function useActivateAdminInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => activateAdminInvite(token, password),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-invite'] })
    },
  })
}
