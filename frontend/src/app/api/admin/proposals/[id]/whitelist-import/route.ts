import { NextResponse, type NextRequest } from 'next/server'
import { ensureCanManageProposal, jsonError, requireProfile } from '@/app/api/_lib/auth'
import type { Database } from '@/lib/supabase/database.types'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type WhitelistRow = Database['app']['Tables']['proposal_whitelist_entries']['Row']
type ImportJobRow = Database['app']['Tables']['whitelist_import_jobs']['Row']

function mapWhitelistRow(row: WhitelistRow) {
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

function mapJob(row: ImportJobRow) {
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

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const { id } = await context.params
  const permissionError = await ensureCanManageProposal(auth.client, auth.profile, id)
  if (permissionError) return permissionError

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) return jsonError('Payload impor whitelist tidak valid.')
  const rawContent = typeof body.rawContent === 'string' ? body.rawContent : ''
  const fileName = typeof body.fileName === 'string' && body.fileName.trim() ? body.fileName.trim() : 'whitelist-import.csv'
  const entriesInput = Array.isArray(body.entries) ? body.entries : []
  const entries = entriesInput
    .filter(isRecord)
    .map((entry) => ({
      walletAddress: typeof entry.walletAddress === 'string' ? entry.walletAddress.trim().toLowerCase() : '',
      voterName: typeof entry.voterName === 'string' && entry.voterName.trim() ? entry.voterName.trim() : null,
    }))
    .filter((entry) => /^0x[a-f0-9]{40}$/.test(entry.walletAddress))
  const invalidCount = typeof body.invalidCount === 'number' && Number.isFinite(body.invalidCount) ? Math.max(0, body.invalidCount) : 0

  const normalizedFileName = fileName.replace(/\s+/g, '-').toLowerCase()
  const filePath = `imports/${id}/${Date.now()}-${normalizedFileName}`
  const { error: uploadError } = await auth.client.storage
    .from('proof-exports')
    .upload(filePath, rawContent, { contentType: 'text/csv;charset=utf-8', upsert: false })

  if (uploadError) return jsonError('Gagal mengunggah file CSV whitelist ke storage.', 500)

  const { data: importJob, error: importError } = await auth.client
    .from('whitelist_import_jobs')
    .insert({
      proposal_draft_id: id,
      created_by: auth.profile.id,
      file_path: filePath,
      file_name: fileName,
      row_count: entries.length,
      invalid_count: invalidCount,
      status: entries.length > 0 ? 'valid' : 'invalid',
    })
    .select('*')
    .single()

  if (importError || !importJob) return jsonError('Gagal mencatat pekerjaan impor whitelist.', 500)

  if (entries.length === 0) return NextResponse.json({ importJob: mapJob(importJob), entries: [] })

  const { data, error } = await auth.client
    .from('proposal_whitelist_entries')
    .insert(entries.map((entry) => ({
      proposal_draft_id: id,
      import_job_id: importJob.id,
      wallet_address: entry.walletAddress,
      voter_name: entry.voterName,
      source: 'csv' as const,
      validation_status: 'valid' as const,
      sync_status: 'pending' as const,
    })))
    .select('*')

  if (error) return jsonError('Gagal menyimpan entri whitelist dari CSV.', 500)
  return NextResponse.json({ importJob: mapJob(importJob), entries: (data ?? []).map(mapWhitelistRow) })
}
