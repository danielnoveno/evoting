'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { profileQueryKeys } from './use-profile'
import { compressImage } from '@/lib/image-compression'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function useProfileImageUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new Error('Supabase client not initialized')

      // Compress image: convert to WebP at 50% quality
      const compressed = await compressImage(file, 0.5)

      const { data: sessionData } = await client.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Sesi pengguna tidak ditemukan. Silakan masuk ulang.')

      const formData = new FormData()
      formData.append('file', compressed, `${userId}-${Date.now()}.webp`)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      })

      const payload: unknown = await response.json().catch(() => ({}))
      if (!response.ok) {
        const message = isRecord(payload) && typeof payload.error === 'string'
          ? payload.error
          : 'Gagal mengunggah foto.'
        throw new Error(message)
      }

      const avatarUrl = isRecord(payload) && typeof payload.avatarUrl === 'string' ? payload.avatarUrl : null
      if (!avatarUrl) throw new Error('Respons unggahan foto tidak valid.')

      return avatarUrl
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.current })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.superadmins })
    },
  })
}
