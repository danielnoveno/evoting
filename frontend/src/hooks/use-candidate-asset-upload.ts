'use client'

import { useMutation } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { compressImage } from '@/lib/image-compression'

export function useCandidateAssetUpload() {
  return useMutation({
    mutationFn: async ({ file, candidateId, electionId }: { file: File; candidateId: string; electionId: string }) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new Error('Supabase client not initialized')

      // Compress image: convert to WebP at 50% quality
      const compressed = await compressImage(file, 0.5)

      const ext = 'webp'
      const filePath = `candidates/${electionId}/${candidateId}-${Date.now()}.${ext}`

      const { data, error } = await client.storage
        .from('public-assets')
        .upload(filePath, compressed, {
          cacheControl: '3600',
          contentType: 'image/webp',
          upsert: false,
        })

      if (error) {
        throw new Error(error.message)
      }

      const { data: publicUrlData } = client.storage
        .from('public-assets')
        .getPublicUrl(data.path)

      return publicUrlData.publicUrl
    },
  })
}
