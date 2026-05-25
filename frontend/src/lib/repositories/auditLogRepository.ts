'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import { RepositoryError } from '@/lib/repositories/errors'

export interface AuditLogEntry {
  id: string
  walletAddress: string
  actionType: string
  txHash: string | null
  blockNumber: number | null
  status: string
  metadata: any
  createdAt: string
}

export async function listAuditLogs(proposalId: string): Promise<AuditLogEntry[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  // First get space address to filter logs by metadata if needed, 
  // but usually we can filter by the specific election space address in metadata.
  const { data: spaceMap } = await client
    .schema('app')
    .from('space_registry_map')
    .select('space_address')
    .eq('proposal_draft_id', proposalId)
    .maybeSingle()

  let query = client
    .schema('app')
    .from('tx_audit_log')
    .select('*')
    .order('created_at', { ascending: false })

  if (spaceMap?.space_address) {
    // Filter logs that belong to this space
    query = query.or(`metadata->>space.eq.${spaceMap.space_address}`)
  }

  const { data, error } = await query

  if (error) throw new RepositoryError('Gagal memuat log audit. Coba lagi.')

  return (data ?? []).map((row) => ({
    id: row.id,
    walletAddress: row.wallet_address,
    actionType: row.action_type,
    txHash: row.tx_hash,
    blockNumber: Number(row.block_number),
    status: row.status,
    metadata: row.metadata,
    createdAt: row.created_at,
  }))
}
