import { NextResponse, type NextRequest } from 'next/server'
import { ensureCanManageProposal, jsonError, requireProfile } from '@/app/api/_lib/auth'
import { logAudit, getActorInfo } from '@/lib/audit-logger'
import type { Database } from '@/lib/supabase/database.types'

export const runtime = 'nodejs'

type ProposalStatus = Database['app']['Tables']['proposal_drafts']['Row']['status']
type ProposalRow = Database['app']['Tables']['proposal_drafts']['Row']

const VALID_STATUSES: ProposalStatus[] = ['draft', 'submitted', 'revision_requested', 'approved', 'rejected', 'deployed', 'archived']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mapProposalRow(row: ProposalRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    organizationName: row.organization_name,
    candidateCount: row.candidate_count,
    status: row.status,
    proposalTxHash: row.proposal_tx_hash,
    reviewTxHash: row.review_tx_hash,
    deploymentTxHash: row.deployment_tx_hash,
    onchainProposalId: row.onchain_proposal_id,
    deployedSpaceId: row.deployed_space_id,
    deployedSpaceAddress: row.deployed_space_address,
    commitStartAt: row.commit_start_at,
    revealStartAt: row.reveal_start_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    creatorDisplayName: null,
    creatorOrganizationName: null,
    createdByWalletAddress: null,
  }
}

function activityTitleForStatus(status: ProposalStatus) {
  switch (status) {
    case 'submitted': return 'Proposal diajukan'
    case 'revision_requested': return 'Superadmin meminta revisi'
    case 'approved': return 'Proposal disetujui'
    case 'rejected': return 'Proposal ditolak'
    case 'deployed': return 'Pemilihan berhasil di-deploy'
    case 'archived': return 'Pengajuan proposal dibatalkan'
    default: return 'Proposal diperbarui'
  }
}

function activityDescriptionForStatus(status: ProposalStatus, message?: string | null) {
  if (message?.trim()) return message.trim()
  switch (status) {
    case 'submitted': return 'Admin organisasi mengirim proposal untuk direview superadmin.'
    case 'revision_requested': return 'Superadmin meminta admin organisasi memperbaiki proposal.'
    case 'approved': return 'Proposal disetujui untuk proses deploy.'
    case 'rejected': return 'Proposal ditolak oleh superadmin.'
    case 'deployed': return 'Proposal sudah menjadi ruang pemilihan di blockchain.'
    case 'archived': return 'Admin organisasi membatalkan pengajuan proposal.'
    default: return 'Proposal diperbarui.'
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const { id } = await context.params

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) return jsonError('Payload status proposal tidak valid.')
  const status = typeof body.status === 'string' && VALID_STATUSES.includes(body.status as ProposalStatus) ? body.status as ProposalStatus : null
  if (!status) return jsonError('Status proposal tidak valid.')

  if (['revision_requested', 'approved', 'rejected', 'deployed'].includes(status) && auth.profile.role !== 'super_admin') {
    return jsonError('Hanya superadmin yang dapat melakukan review/deploy proposal.', 403)
  }
  const permissionError = await ensureCanManageProposal(auth.client, auth.profile, id)
  if (permissionError) return permissionError

  const { data: beforeRow } = await auth.client.from('proposal_drafts').select('*').eq('id', id).maybeSingle()

  const txHash = typeof body.txHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(body.txHash.trim()) ? body.txHash.trim() : null
  const payload: Database['app']['Tables']['proposal_drafts']['Update'] = { status, updated_at: new Date().toISOString() }
  if (txHash) {
    if (status === 'submitted') payload.proposal_tx_hash = txHash
    if (status === 'approved') payload.review_tx_hash = txHash
    if (status === 'deployed') payload.deployment_tx_hash = txHash
  }
  if (typeof body.onchainProposalId === 'number' && Number.isFinite(body.onchainProposalId)) payload.onchain_proposal_id = body.onchainProposalId

  const deployment = isRecord(body.deployment) ? body.deployment : null
  if (deployment) {
    payload.deployment_tx_hash = typeof deployment.deploymentTxHash === 'string' ? deployment.deploymentTxHash : payload.deployment_tx_hash
    payload.deployed_space_id = typeof deployment.deployedSpaceId === 'number' ? deployment.deployedSpaceId : null
    payload.deployed_space_address = typeof deployment.deployedSpaceAddress === 'string' ? deployment.deployedSpaceAddress : null
  }

  const { data, error } = await auth.client.from('proposal_drafts').update(payload).eq('id', id).select('*').single()
  if (error) return jsonError('Gagal memperbarui status proposal.', 500)

  const message = typeof body.message === 'string' ? body.message.trim() : null

  // Log the status change
  const actor = await getActorInfo(auth.client)
  await logAudit({
    action_name: status === 'deployed' ? 'deploy_space' : 'update_proposal',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'proposal',
    entity_id: id,
    details: {
      previousStatus: beforeRow?.status ?? null,
      newStatus: status,
      title: data.title,
      txHash,
      message: message ?? null,
      deployedSpaceAddress: deployment ? (deployment as Record<string, unknown>).deployedSpaceAddress : null,
    },
    related_tx_hash: txHash,
    source: 'server_api',
  })

  const activityPayload = {
    proposalId: id,
    eventType: beforeRow?.status === 'revision_requested' && status === 'submitted' ? 'resubmitted' : status,
    title: beforeRow?.status === 'revision_requested' && status === 'submitted' ? 'Proposal diajukan ulang' : activityTitleForStatus(status),
    description: activityDescriptionForStatus(status, message),
    actorLabel: auth.profile.display_name || auth.profile.email || (['revision_requested', 'approved', 'rejected', 'deployed'].includes(status) ? 'Superadmin' : 'Admin Organisasi'),
    message,
    link: status === 'revision_requested' ? `/admin/daftar-proposal/${id}` : `/superadmin/manajemen-proposal/${id}`,
    type: status === 'revision_requested' ? 'warning' : status === 'rejected' || status === 'archived' ? 'info' : 'success',
  }

  if (beforeRow?.created_by) {
    await auth.client.from('notification_jobs').insert({ target_profile_id: beforeRow.created_by, channel: 'in_app', template_key: 'proposal_activity', status: 'queued', payload: activityPayload }).throwOnError()
  }

  // Public notification for deployed elections — visible to all visitors
  if (status === 'deployed' && data.title) {
    try {
      await auth.client.schema('app').from('notification_jobs').insert({
        channel: 'in_app',
        template_key: 'public_election',
        status: 'sent',
        payload: {
          title: 'Pemilihan baru tersedia',
          description: `Pemilihan "${data.title}" telah dibuka. Anda bisa melihat detail dan berpartisipasi.`,
          type: 'success',
          link: '/pemilihan',
        },
      }).throwOnError()
    } catch {
      // fire-and-forget: public notification failure should not block the status update
    }
  }

  if (deployment) {
    const registryAddress = typeof deployment.registryAddress === 'string' ? deployment.registryAddress : ''
    const ownerWallet = typeof deployment.ownerWallet === 'string' ? deployment.ownerWallet : ''
    const deploymentTxHash = typeof deployment.deploymentTxHash === 'string' ? deployment.deploymentTxHash : txHash ?? ''
    const deployedSpaceId = typeof deployment.deployedSpaceId === 'number' ? deployment.deployedSpaceId : null
    const deployedSpaceAddress = typeof deployment.deployedSpaceAddress === 'string' ? deployment.deployedSpaceAddress : null
    if (registryAddress && ownerWallet && deploymentTxHash) {
      await auth.client.from('space_registry_map').upsert({ proposal_draft_id: id, chain_id: 84532, onchain_proposal_id: payload.onchain_proposal_id ?? null, space_id: deployedSpaceId, registry_address: registryAddress, space_address: deployedSpaceAddress, owner_wallet: ownerWallet, deployment_tx_hash: deploymentTxHash }, { onConflict: 'proposal_draft_id' }).throwOnError()
      await auth.client.from('tx_audit_log').upsert({ space_id: deployedSpaceId, proposal_draft_id: id, wallet_address: typeof deployment.actorWallet === 'string' ? deployment.actorWallet : ownerWallet, action_type: 'deploy_space', tx_hash: deploymentTxHash, block_number: typeof deployment.blockNumber === 'number' ? deployment.blockNumber : null, status: 'success', source: 'server_api', metadata: { registryAddress, spaceAddress: deployedSpaceAddress, ownerWallet } }, { onConflict: 'tx_hash,action_type' }).throwOnError()
    }
  }

  return NextResponse.json({ proposal: mapProposalRow(data) })
}
