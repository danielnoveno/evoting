'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { profileQueryKeys } from './use-profile'

export function useProfileImageUpload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      const client = getSupabaseBrowserClient()
      if (!client) throw new Error('Supabase client not initialized')

      const ext = file.name.split('.').pop()
      const filePath = `avatars/${userId}-${Date.now()}.${ext}`

      // 1. Upload the file to 'public-assets' bucket
      const { data, error: uploadError } = await client.storage
        .from('public-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // 2. Get the public URL
      const { data: publicUrlData } = client.storage
        .from('public-assets')
        .getPublicUrl(data.path)

      const avatarUrl = publicUrlData.publicUrl

      // 3. Update the profile table
      const { error: updateError } = await client
        .schema('app')
        .from('app_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', userId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      return avatarUrl
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.current })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.adminDirectory })
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.superadmins })
    },
  })
}
