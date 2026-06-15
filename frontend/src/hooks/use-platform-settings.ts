'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPlatformSettings, updatePlatformSettings, type PlatformSettings } from '@/lib/repositories/platformRepository'

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: getPlatformSettings,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Partial<PlatformSettings>) => updatePlatformSettings(settings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
    },
  })
}
