'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { RepositoryError } from '@/lib/repositories/errors'
import type { AdminSpaceAccessRecord } from '@/lib/repositories/types'

export async function listAdminSpaceAccess(email: string): Promise<AdminSpaceAccessRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('admin_space_access')
    .select(`
      id,
      admin_email,
      proposal_draft_id,
      created_at,
      proposal_drafts (
        title
      )
    `)
    .eq('admin_email', email)

  if (error) throw new RepositoryError('Gagal memuat akses pemilihan admin.')

  return (data ?? []).map((row: any) => ({
    id: row.id,
    adminEmail: row.admin_email,
    proposalDraftId: row.proposal_draft_id,
    createdAt: row.created_at,
    proposalTitle: row.proposal_drafts?.title || 'Pemilihan tidak dikenal'
  }))
}

export async function assignAdminToSpace(email: string, proposalDraftId: string): Promise<void> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { error } = await client
    .schema('app')
    .from('admin_space_access')
    .upsert({
      admin_email: email,
      proposal_draft_id: proposalDraftId
    }, { onConflict: 'admin_email,proposal_draft_id' })

  if (error) throw new RepositoryError('Gagal memberikan akses pemilihan.')
}

export async function removeAdminFromSpace(email: string, proposalDraftId: string): Promise<void> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { error } = await client
    .schema('app')
    .from('admin_space_access')
    .delete()
    .eq('admin_email', email)
    .eq('proposal_draft_id', proposalDraftId)

  if (error) throw new RepositoryError('Gagal mencabut akses pemilihan.')
}

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
