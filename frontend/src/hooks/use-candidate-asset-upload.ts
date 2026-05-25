'use client'

import { useMutation } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export function useCandidateAssetUpload() {
  return useMutation({
    mutationFn: async ({ file, candidateId, electionId }: { file: File; candidateId: string; electionId: string }) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new Error('Supabase client not initialized')

      const ext = file.name.split('.').pop()
      const filePath = `candidates/${electionId}/${candidateId}-${Date.now()}.${ext}`

      const { data, error } = await client.storage
        .from('public-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
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
