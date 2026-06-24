'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'

export async function syncAdminSpaces(email: string, proposalDraftIds: string[]): Promise<void> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  // 1. Remove all current access
  const { error: deleteError } = await client
    .schema('app')
    .from('admin_space_access')
    .delete()
    .eq('admin_email', email)

  if (deleteError) throw new RepositoryError('Gagal sinkronisasi akses pemilihan (tahap pembersihan).')

  if (proposalDraftIds.length === 0) return

  // 2. Insert new access list
  const inserts = proposalDraftIds.map(id => ({
    admin_email: email,
    proposal_draft_id: id
  }))

  const { error: insertError } = await client
    .schema('app')
    .from('admin_space_access')
    .insert(inserts)

  if (insertError) throw new RepositoryError('Gagal sinkronisasi akses pemilihan (tahap penambahan).')
}
