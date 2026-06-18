'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listMasterVoters, listMasterVoterProdiOptions, addMasterVoterToWhitelist } from '@/lib/repositories/masterVoterRepository'
import type { MasterVoterFilter } from '@/lib/repositories/types'

export function useMasterVoters(filter?: MasterVoterFilter) {
  return useQuery({
    queryKey: ['master-voters', 'list', filter ?? {}],
    queryFn: () => listMasterVoters(filter),
    retry: false,
  })
}

export function useMasterVoterProdiOptions() {
  return useQuery({
    queryKey: ['master-voters', 'prodi-options'],
    queryFn: () => listMasterVoterProdiOptions(),
    retry: false,
  })
}

export function useAddMasterVoterToWhitelist(proposalDraftId: string | null | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addMasterVoterToWhitelist,
    onSuccess: () => {
      if (proposalDraftId) {
        void queryClient.invalidateQueries({ queryKey: ['whitelist', 'list', proposalDraftId] })
      }
    },
  })
}
