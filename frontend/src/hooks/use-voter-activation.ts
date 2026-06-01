'use client'

import { useMutation } from '@tanstack/react-query'
import { sendVoterActivationEmails } from '@/lib/repositories/voterActivationRepository'

export function useSendVoterActivationEmails() {
  return useMutation({
    mutationFn: sendVoterActivationEmails,
  })
}
