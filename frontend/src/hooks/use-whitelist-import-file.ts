'use client'

import { useMutation } from '@tanstack/react-query'
import { createWhitelistImportSignedUrl } from '@/lib/repositories/whitelistRepository'

export function useWhitelistImportSignedUrl() {
  return useMutation({
    mutationFn: (filePath: string) => createWhitelistImportSignedUrl(filePath),
  })
}
