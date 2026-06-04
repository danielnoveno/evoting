'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import { getCurrentProfile } from '@/lib/repositories/profileRepository'
import type { WhitelistEntryRecord, WhitelistImportJobRecord } from '@/lib/repositories/types'
import { RepositoryError } from '@/lib/repositories/errors'

type WhitelistRow = Database['app']['Tables']['proposal_whitelist_entries']['Row']
type WhitelistImportJobRow = Database['app']['Tables']['whitelist_import_jobs']['Row']

function mapWhitelistRow(row: WhitelistRow): WhitelistEntryRecord {
  return {
    id: row.id,
    proposalDraftId: row.proposal_draft_id,
    walletAddress: row.wallet_address,
    voterName: row.voter_name,
    source: row.source,
    validationStatus: row.validation_status,
    syncStatus: row.sync_status,
    latestSyncTxHash: row.latest_sync_tx_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapWhitelistImportJobRow(row: WhitelistImportJobRow): WhitelistImportJobRecord {
  return {
    id: row.id,
    proposalDraftId: row.proposal_draft_id,
    createdBy: row.created_by,
    filePath: row.file_path,
    fileName: row.file_name,
    rowCount: row.row_count,
    invalidCount: row.invalid_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listWhitelistImportJobs(proposalDraftId: string): Promise<WhitelistImportJobRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('whitelist_import_jobs')
    .select('*')
    .eq('proposal_draft_id', proposalDraftId)
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat riwayat impor whitelist. Coba lagi.')
  return (data ?? []).map(mapWhitelistImportJobRow)
}

export async function getWhitelistImportJob(id: string): Promise<WhitelistImportJobRecord | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const { data, error } = await client
    .schema('app')
    .from('whitelist_import_jobs')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memuat detail impor whitelist. Coba lagi.')
  return data ? mapWhitelistImportJobRow(data) : null
}

export async function createWhitelistImportSignedUrl(filePath: string): Promise<string> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client.storage
    .from('proof-exports')
    .createSignedUrl(filePath, 60 * 5)

  if (error || !data?.signedUrl) {
    throw new RepositoryError('Gagal membuat tautan unduhan file impor. Coba lagi.')
  }

  return data.signedUrl
}

export async function listWhitelistEntries(proposalDraftId: string): Promise<WhitelistEntryRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .select('*')
    .eq('proposal_draft_id', proposalDraftId)
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat daftar pemilih. Coba lagi.')
  return (data ?? []).map(mapWhitelistRow)
}

export async function listWhitelistEntriesByJobId(importJobId: string): Promise<WhitelistEntryRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .select('*')
    .eq('import_job_id', importJobId)
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat daftar pemilih dari job impor ini.')
  return (data ?? []).map(mapWhitelistRow)
}

export async function getWhitelistStatus(proposalDraftId: string, walletAddress: string): Promise<WhitelistEntryRecord | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const { data, error } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .select('*')
    .eq('proposal_draft_id', proposalDraftId)
    .eq('wallet_address', walletAddress)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memuat status whitelist. Coba lagi.')
  return data ? mapWhitelistRow(data) : null
}

export async function createWhitelistEntry(input: {
  proposalDraftId: string
  walletAddress: string
  voterName?: string | null
}): Promise<WhitelistEntryRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .insert({
      proposal_draft_id: input.proposalDraftId,
      wallet_address: input.walletAddress,
      voter_name: input.voterName ?? null,
      source: 'manual',
    })
    .select('*')
    .single()

  if (error) throw new RepositoryError('Gagal menambahkan pemilih ke whitelist. Coba lagi.')
  return mapWhitelistRow(data)
}

export async function deleteWhitelistEntry(id: string): Promise<void> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { error } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .delete()
    .eq('id', id)

  if (error) throw new RepositoryError('Gagal menghapus pemilih dari whitelist. Coba lagi.')
}

export async function updateWhitelistSyncStatus(input: {
  proposalDraftId: string
  txHash: string
  walletAddresses: string[]
}): Promise<void> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { error } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .update({
      sync_status: 'synced',
      latest_sync_tx_hash: input.txHash,
    })
    .eq('proposal_draft_id', input.proposalDraftId)
    .in('wallet_address', input.walletAddresses)

  if (error) throw new RepositoryError('Gagal memperbarui status sinkronisasi whitelist.')
}

export async function createWhitelistEntriesBulk(input: {
  proposalDraftId: string
  fileName: string
  rawContent: string
  entries: Array<{
    walletAddress: string
    voterName?: string | null
  }>
  invalidCount?: number
}): Promise<{ importJob: WhitelistImportJobRecord; entries: WhitelistEntryRecord[] }> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const profile = await getCurrentProfile()
  if (!profile) throw new RepositoryError('Sesi admin belum aktif untuk memproses CSV whitelist.')

  const normalizedFileName = input.fileName.trim() || 'whitelist-import.csv'
  const filePath = `imports/${input.proposalDraftId}/${Date.now()}-${normalizedFileName.replace(/\s+/g, '-').toLowerCase()}`

  const uploadPayload = new Blob([input.rawContent], { type: 'text/csv;charset=utf-8' })
  const { error: uploadError } = await client.storage
    .from('proof-exports')
    .upload(filePath, uploadPayload, {
      contentType: 'text/csv',
      upsert: false,
    })

  if (uploadError) {
    throw new RepositoryError('Gagal mengunggah file CSV ke storage. Coba lagi.')
  }

  const { data: importJobData, error: importJobError } = await client
    .schema('app')
    .from('whitelist_import_jobs')
    .insert({
      proposal_draft_id: input.proposalDraftId,
      created_by: profile.id,
      file_path: filePath,
      file_name: normalizedFileName,
      row_count: input.entries.length,
      invalid_count: input.invalidCount ?? 0,
      status: input.entries.length > 0 ? 'valid' : 'invalid',
    })
    .select('*')
    .single()

  if (importJobError || !importJobData) {
    throw new RepositoryError('Gagal mencatat pekerjaan impor whitelist. Coba lagi.')
  }

  const payload = input.entries.map((entry) => ({
    proposal_draft_id: input.proposalDraftId,
    import_job_id: importJobData.id,
    wallet_address: entry.walletAddress,
    voter_name: entry.voterName ?? null,
    source: 'csv' as const,
  }))

  const { data, error } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .insert(payload)
    .select('*')

  if (error) throw new RepositoryError('Gagal memproses file CSV whitelist. Coba lagi.')

  return {
    importJob: mapWhitelistImportJobRow(importJobData),
    entries: (data ?? []).map(mapWhitelistRow),
  }
}
