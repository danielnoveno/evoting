'use client'

import { useQuery } from '@tanstack/react-query'

export type ActivationTokenPreview = {
  email: string
  role: string
  status: string
  isExpired: boolean
  isUsed: boolean
  isValid: boolean
}

async function fetchActivationTokenPreview(token: string): Promise<ActivationTokenPreview> {
  const response = await fetch(`/api/activation-tokens/preview?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? 'Token aktivasi tidak valid atau sudah kedaluwarsa.')
  }

  return response.json()
}

export const activationTokenQueryKeys = {
  preview: (token: string) => ['activation-token', 'preview', token] as const,
}

export function useActivationTokenPreview(token: string | null | undefined) {
  const normalizedToken = token?.trim() ?? ''

  return useQuery({
    queryKey: activationTokenQueryKeys.preview(normalizedToken),
    queryFn: () => fetchActivationTokenPreview(normalizedToken),
    enabled: Boolean(normalizedToken),
    retry: false,
  })
}
