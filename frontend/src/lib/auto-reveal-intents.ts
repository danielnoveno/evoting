'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export type AutoRevealIntentInput = {
  electionId: string
  voterWallet: string
  contractAddress: string
  candidateUuid: string
  candidateNumber: number
  salt: `0x${string}`
  commitment: `0x${string}`
  commitTxHash: `0x${string}`
  blockNumber: number
}

export async function queueAutoRevealIntent(input: AutoRevealIntentInput) {
  const supabase = getSupabaseBrowserClient()
  const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }
  const token = data.session?.access_token
  if (!token) throw new Error('Sesi pemilih tidak tersedia untuk menyimpan antrean penghitungan otomatis.')

  const response = await fetch('/api/voter/auto-reveal-intents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })

  const payload: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Gagal menyimpan antrean penghitungan otomatis.'
    throw new Error(message)
  }
}
