'use client'

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bindCurrentUserWallet, createAdminRegistry, deleteAdminRegistry, getCurrentProfile, getProfileByWalletAddress, listAdminDirectory, updateAdminRegistry, upsertCurrentProfile } from '@/lib/repositories/profileRepository'
import type { AdminRegistryInput, AppProfileRecord, ProfileUpsertInput } from '@/lib/repositories/types'

export const profileQueryKeys = {
  current: ['profile', 'current'] as const,
  wallet: (walletAddress: string) => ['profile', 'wallet', walletAddress] as const,
  adminDirectory: ['profile', 'admin-directory'] as const,
}

export function useCurrentProfile() {
  return useQuery({
    queryKey: profileQueryKeys.current,
    queryFn: getCurrentProfile,
    retry: false,
  })
}

export function useProfileByWallet(walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: profileQueryKeys.wallet(walletAddress ?? 'unknown'),
    queryFn: () => getProfileByWalletAddress(walletAddress ?? ''),
    enabled: Boolean(walletAddress),
    retry: false,
  })
}

export function useSuperadminAdminDirectory() {
  return useQuery({
    queryKey: profileQueryKeys.adminDirectory,
    queryFn: listAdminDirectory,
    retry: false,
  })
}

export function useCreateAdminRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AdminRegistryInput) => createAdminRegistry(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useUpdateAdminRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ currentEmail, input }: { currentEmail: string; input: AdminRegistryInput }) => updateAdminRegistry(currentEmail, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useDeleteAdminRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (email: string) => deleteAdminRegistry(email),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useResolvedProfile(walletAddress: string | null | undefined, fallback: AppProfileRecord | null = null) {
  const query = useProfileByWallet(walletAddress)

  const resolvedProfile = useMemo(() => query.data ?? fallback, [fallback, query.data])

  return {
    ...query,
    resolvedProfile,
  }
}

export function useSaveCurrentProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ProfileUpsertInput) => upsertCurrentProfile(input),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.current })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.wallet(profile.walletAddress) })
    },
  })
}

export function useBindCurrentWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ProfileUpsertInput) => bindCurrentUserWallet(input),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.current })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.wallet(profile.walletAddress) })
      void queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
    },
  })
}
