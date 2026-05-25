'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createWhitelistEntriesBulk, createWhitelistEntry, deleteWhitelistEntry, getWhitelistStatus, listWhitelistEntries } from '@/lib/repositories/whitelistRepository'

export function useWhitelistEntries(proposalDraftId: string | null | undefined) {
  return useQuery({
    queryKey: ['whitelist', 'list', proposalDraftId ?? 'unknown'],
    queryFn: () => listWhitelistEntries(proposalDraftId ?? ''),
    enabled: Boolean(proposalDraftId),
    retry: false,
  })
}

export function useWhitelistStatus(proposalDraftId: string | null | undefined, walletAddress: string | null | undefined) {
  return useQuery({
    queryKey: ['whitelist', 'status', proposalDraftId ?? 'unknown', walletAddress ?? 'unknown'],
    queryFn: () => getWhitelistStatus(proposalDraftId ?? '', walletAddress ?? ''),
    enabled: Boolean(proposalDraftId && walletAddress),
    retry: false,
  })
}

export function useCreateWhitelistEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWhitelistEntry,
    onSuccess: (entry) => {
      void queryClient.invalidateQueries({ queryKey: ['whitelist', 'list', entry.proposalDraftId] })
      void queryClient.invalidateQueries({ queryKey: ['whitelist', 'status', entry.proposalDraftId] })
    },
  })
}

export function useDeleteWhitelistEntry(proposalDraftId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWhitelistEntry,
    onSuccess: () => {
      if (proposalDraftId) {
        void queryClient.invalidateQueries({ queryKey: ['whitelist', 'list', proposalDraftId] })
      }
    },
  })
}

export function useCreateWhitelistEntriesBulk(proposalDraftId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWhitelistEntriesBulk,
    onSuccess: () => {
      if (proposalDraftId) {
        void queryClient.invalidateQueries({ queryKey: ['whitelist', 'list', proposalDraftId] })
      }
    },
  })
}
