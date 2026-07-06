'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
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

export async function createWhitelistImportSignedUrl(filePath: string, downloadName?: string): Promise<string> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client.storage
    .from('proof-exports')
    .createSignedUrl(filePath, 60 * 5, {
      download: downloadName ?? true
    })

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
  const normalizedWalletAddress = walletAddress.trim().toLowerCase()

  const { data, error } = await client
    .schema('app')
    .from('proposal_whitelist_entries')
    .select('*')
    .eq('proposal_draft_id', proposalDraftId)
    .eq('wallet_address', normalizedWalletAddress)
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
  const { data: sessionData } = await client.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new RepositoryError('Sesi admin belum aktif untuk menambahkan whitelist.')

  const response = await fetch(`/api/admin/proposals/${input.proposalDraftId}/whitelist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ walletAddress: input.walletAddress, voterName: input.voterName ?? null }),
  })

  const payload: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Gagal menambahkan pemilih ke whitelist. Coba lagi.'
    throw new RepositoryError(message)
  }
  if (!payload || typeof payload !== 'object' || !('entry' in payload)) throw new RepositoryError('Respons whitelist tidak dikenali.')
  return payload.entry as WhitelistEntryRecord
}

export async function deleteWhitelistEntry(input: string | { id: string; unregisterTxHash?: string | null }): Promise<void> {
  const id = typeof input === 'string' ? input : input.id
  const unregisterTxHash = typeof input === 'string' ? null : input.unregisterTxHash ?? null
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')
  const { data: sessionData } = await client.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new RepositoryError('Sesi admin belum aktif untuk menghapus whitelist.')

  const response = await fetch(`/api/admin/whitelist/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ unregisterTxHash }),
  })
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => ({}))
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Gagal menghapus pemilih dari whitelist. Coba lagi.'
    throw new RepositoryError(message)
  }
}

export async function updateWhitelistSyncStatus(input: {
  proposalDraftId: string
  txHash: string
  walletAddresses: string[]
}): Promise<void> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')
  const { data: sessionData } = await client.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new RepositoryError('Sesi admin belum aktif untuk sinkronisasi whitelist.')

  const response = await fetch(`/api/admin/proposals/${input.proposalDraftId}/whitelist-sync`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ txHash: input.txHash, walletAddresses: input.walletAddresses }),
  })
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => ({}))
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Gagal memperbarui status sinkronisasi whitelist.'
    throw new RepositoryError(message)
  }
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
  const { data: sessionData } = await client.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new RepositoryError('Sesi admin belum aktif untuk memproses CSV whitelist.')

  const response = await fetch(`/api/admin/proposals/${input.proposalDraftId}/whitelist-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  })
  const payload: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Gagal memproses file CSV whitelist. Coba lagi.'
    throw new RepositoryError(message)
  }
  if (!payload || typeof payload !== 'object' || !('importJob' in payload) || !('entries' in payload)) throw new RepositoryError('Respons impor whitelist tidak dikenali.')
  return payload as { importJob: WhitelistImportJobRecord; entries: WhitelistEntryRecord[] }
}
