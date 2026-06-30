'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bindCurrentUserWallet, createAdminRegistry, deleteAdminRegistry, getCurrentAdminRegistryStatus, getCurrentProfile, getAdminRegistryByWalletAddress, getProfileByWalletAddress, listAdminDirectory, updateAdminRegistry, upsertCurrentProfile } from '@/lib/repositories/profileRepository'
import type { AdminRegistryInput, AppProfileRecord, ProfileUpsertInput } from '@/lib/repositories/types'

export const profileQueryKeys = {
  current: ['profile', 'current'] as const,
  currentAdminRegistryStatus: ['profile', 'current-admin-registry-status'] as const,
  wallet: (walletAddress: string) => ['profile', 'wallet', walletAddress] as const,
  adminRegistryByWallet: (walletAddress: string) => ['profile', 'admin-registry-wallet', walletAddress] as const,
  adminDirectory: ['profile', 'admin-directory'] as const,
  superadmins: ['superadmins'] as const,
}

function invalidateProfileDirectoryViews(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
  void queryClient.invalidateQueries({ queryKey: profileQueryKeys.superadmins })
}

export function useCurrentProfile() {
  return useQuery({
    queryKey: profileQueryKeys.current,
    queryFn: getCurrentProfile,
    retry: false,
  })
}

export function useCurrentAdminRegistryStatus() {
  return useQuery({
    queryKey: profileQueryKeys.currentAdminRegistryStatus,
    queryFn: getCurrentAdminRegistryStatus,
    retry: false,
    refetchInterval: 15_000,
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

// ponytail: cek admin_registry by wallet_address — admin mungkin belum punya app_profiles
export function useAdminRegistryByWallet(walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: profileQueryKeys.adminRegistryByWallet(walletAddress ?? 'unknown'),
    queryFn: () => getAdminRegistryByWalletAddress(walletAddress ?? ''),
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
      invalidateProfileDirectoryViews(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useUpdateAdminRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ currentEmail, input }: { currentEmail: string; input: AdminRegistryInput }) => updateAdminRegistry(currentEmail, input),
    onSuccess: () => {
      invalidateProfileDirectoryViews(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useDeleteAdminRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (email: string) => deleteAdminRegistry(email),
    onSuccess: () => {
      invalidateProfileDirectoryViews(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useSaveCurrentProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ProfileUpsertInput) => upsertCurrentProfile(input),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.current })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.wallet(profile.walletAddress) })
      invalidateProfileDirectoryViews(queryClient)
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
      invalidateProfileDirectoryViews(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
    },
  })
}
