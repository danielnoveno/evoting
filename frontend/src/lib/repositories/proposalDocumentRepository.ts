'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import { getCurrentProfile } from '@/lib/repositories/profileRepository'
import { RepositoryError } from '@/lib/repositories/errors'
import type { ProposalDocumentRecord } from '@/lib/repositories/types'

type ProposalDocumentRow = Database['app']['Tables']['proposal_documents']['Row']

const PROPOSAL_DOCUMENT_BUCKET = 'proposal-documents'
const MAX_PROPOSAL_DOCUMENT_SIZE = 10 * 1024 * 1024

function mapProposalDocumentRow(row: ProposalDocumentRow): ProposalDocumentRecord {
  return {
    id: row.id,
    proposalDraftId: row.proposal_draft_id,
    uploadedBy: row.uploaded_by,
    filePath: row.file_path,
    fileName: row.file_name,
    contentType: row.content_type,
    fileSize: row.file_size,
    documentType: row.document_type,
    createdAt: row.created_at,
  }
}

function getSafeFileName(fileName: string) {
  return (fileName.trim() || 'dokumen-pendukung.pdf')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

function assertValidProposalDocument(file: File) {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) {
    throw new RepositoryError('Format dokumen belum didukung. Gunakan file PDF.')
  }

  if (file.size > MAX_PROPOSAL_DOCUMENT_SIZE) {
    throw new RepositoryError('Ukuran dokumen terlalu besar. Maksimal 10 MB.')
  }
}

export async function listProposalDocuments(proposalDraftId: string): Promise<ProposalDocumentRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('proposal_documents')
    .select('*')
    .eq('proposal_draft_id', proposalDraftId)
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat dokumen pendukung proposal.')
  return (data ?? []).map(mapProposalDocumentRow)
}

export async function uploadProposalDocument(input: {
  proposalDraftId: string
  file: File
  documentType?: ProposalDocumentRecord['documentType']
}): Promise<ProposalDocumentRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const profile = await getCurrentProfile()
  if (!profile) throw new RepositoryError('Sesi admin belum aktif untuk mengunggah dokumen.')

  assertValidProposalDocument(input.file)

  const safeFileName = getSafeFileName(input.file.name)
  const filePath = `${input.proposalDraftId}/${profile.id}/${Date.now()}-${safeFileName}`

  const { error: uploadError } = await client.storage
    .from(PROPOSAL_DOCUMENT_BUCKET)
    .upload(filePath, input.file, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    throw new RepositoryError('Gagal mengunggah dokumen pendukung. Coba lagi.')
  }

  const { data, error } = await client
    .schema('app')
    .from('proposal_documents')
    .insert({
      proposal_draft_id: input.proposalDraftId,
      uploaded_by: profile.id,
      file_path: filePath,
      file_name: input.file.name,
      content_type: 'application/pdf',
      file_size: input.file.size,
      document_type: input.documentType ?? 'supporting',
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new RepositoryError('Dokumen terunggah, tetapi metadata dokumen gagal disimpan.')
  }

  return mapProposalDocumentRow(data)
}

export async function createProposalDocumentSignedUrl(filePath: string, downloadName?: string): Promise<string> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const { data, error } = await client.storage
    .from(PROPOSAL_DOCUMENT_BUCKET)
    .createSignedUrl(filePath, 60 * 5, {
      download: downloadName ?? true,
    })

  if (error || !data?.signedUrl) {
    throw new RepositoryError('Gagal membuat tautan unduhan dokumen. Coba lagi.')
  }

  return data.signedUrl
}
