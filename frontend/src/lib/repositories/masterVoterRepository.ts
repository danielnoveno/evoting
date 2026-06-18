'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { MasterVoterRecord, MasterVoterFilter } from '@/lib/repositories/types'
import { RepositoryError } from '@/lib/repositories/errors'

type MasterVoterRow = {
  id: string
  nim: string
  full_name: string
  email: string
  prodi: string
  fakultas: string
  angkatan: string | null
  wallet_address: string | null
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
}

function mapMasterVoterRow(row: MasterVoterRow): MasterVoterRecord {
  return {
    id: row.id,
    nim: row.nim,
    fullName: row.full_name,
    email: row.email,
    prodi: row.prodi,
    fakultas: row.fakultas,
    angkatan: row.angkatan,
    walletAddress: row.wallet_address,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listMasterVoters(filter?: MasterVoterFilter): Promise<MasterVoterRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  let query = client
    .schema('app')
    .from('master_voters')
    .select('*')
    .eq('status', 'active')
    .order('prodi', { ascending: true })
    .order('full_name', { ascending: true })

  if (filter?.prodi) {
    query = query.eq('prodi', filter.prodi)
  }
  if (filter?.fakultas) {
    query = query.eq('fakultas', filter.fakultas)
  }
  if (filter?.angkatan) {
    query = query.eq('angkatan', filter.angkatan)
  }
  if (filter?.search) {
    const term = filter.search.trim().toLowerCase()
    query = query.or(`nim.ilike.%${term}%,full_name.ilike.%${term}%,email.ilike.%${term}%`)
  }

  const { data, error } = await query

  if (error) throw new RepositoryError('Gagal memuat daftar master voter. Coba lagi.')
  return (data ?? []).map(mapMasterVoterRow)
}

export async function listMasterVoterProdiOptions(): Promise<string[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('master_voters')
    .select('prodi')
    .eq('status', 'active')
    .order('prodi', { ascending: true })

  if (error) throw new RepositoryError('Gagal memuat opsi program studi.')
  const unique = [...new Set((data ?? []).map((row) => row.prodi))]
  return unique
}

export async function addMasterVoterToWhitelist(input: {
  proposalDraftId: string
  masterVoterIds: string[]
}): Promise<{ added: number; skipped: number }> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')
  const { data: sessionData } = await client.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new RepositoryError('Sesi admin belum aktif.')

  const response = await fetch(`/api/admin/master-voters/add-to-whitelist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  })

  const payload: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : 'Gagal menambahkan pemilih ke whitelist dari master voter.'
    throw new RepositoryError(message)
  }
  if (!payload || typeof payload !== 'object' || !('added' in payload)) {
    throw new RepositoryError('Respons tidak dikenali.')
  }
  return payload as { added: number; skipped: number }
}
