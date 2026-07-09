'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bindCurrentUserWallet, getCurrentAdminRegistryStatus, getCurrentProfile, getAdminRegistryByWalletAddress, getProfileByWalletAddress, listAdminDirectory, upsertCurrentProfile } from '@/lib/repositories/profileRepository'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'
import type { AdminRegistryInput, AdminDirectoryRecord, AppProfileRecord, ProfileUpsertInput } from '@/lib/repositories/types'

async function getAccessToken() {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')
  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.access_token) throw new RepositoryError('Sesi superadmin tidak ditemukan. Silakan masuk ulang.')
  return data.session.access_token
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Terjadi kesalahan pada server.'
    throw new RepositoryError(message)
  }
  return response.json() as Promise<T>
}

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
    mutationFn: (input: AdminRegistryInput) =>
      apiFetch<{ admin: AdminDirectoryRecord }>('/api/superadmin/admin-directory', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      invalidateProfileDirectoryViews(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useUpdateAdminRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ currentEmail, input }: { currentEmail: string; input: AdminRegistryInput }) =>
      apiFetch<{ admin: AdminDirectoryRecord }>(`/api/superadmin/admin-directory/${encodeURIComponent(currentEmail)}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      invalidateProfileDirectoryViews(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useDeleteAdminRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<{ success: boolean }>(`/api/superadmin/admin-directory/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      }),
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
