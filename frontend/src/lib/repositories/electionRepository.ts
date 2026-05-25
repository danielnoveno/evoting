'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database } from '@/lib/supabase/database.types'
import { RepositoryError } from '@/lib/repositories/errors'

export interface SpaceRegistryMap {
  id: string
  proposalDraftId: string
  chainId: number
  onchainProposalId: number | null
  spaceId: number | null
  registryAddress: string
  spaceAddress: string | null
  ownerWallet: string
  deploymentTxHash: string | null
}

export async function getSpaceRegistryMapByProposalId(proposalId: string): Promise<SpaceRegistryMap | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const { data, error } = await client
    .schema('app')
    .from('space_registry_map')
    .select('*')
    .eq('proposal_draft_id', proposalId)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memuat pemetaan registry ruang pemilihan.')
  
  if (!data) return null

  return {
    id: data.id,
    proposalDraftId: data.proposal_draft_id || '',
    chainId: Number(data.chain_id),
    onchainProposalId: data.onchain_proposal_id ? Number(data.onchain_proposal_id) : null,
    spaceId: data.space_id ? Number(data.space_id) : null,
    registryAddress: data.registry_address,
    spaceAddress: data.space_address,
    ownerWallet: data.owner_wallet,
    deploymentTxHash: data.deployment_tx_hash,
  }
}
