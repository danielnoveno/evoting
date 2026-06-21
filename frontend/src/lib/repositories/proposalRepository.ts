'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { Database, Json } from '@/lib/supabase/database.types'
import { getCurrentProfile } from '@/lib/repositories/profileRepository'
import type { ProposalActivityRecord, ProposalCandidateRecord, ProposalDraftRecord, ProposalDraftUpsertInput } from '@/lib/repositories/types'
import { RepositoryError } from '@/lib/repositories/errors'
import { insertNotification, notifySuperadmins, type NotificationPayload } from '@/lib/notification-helpers'

type ProposalRow = Database['app']['Tables']['proposal_drafts']['Row']
type ProposalCandidateRow = Database['app']['Tables']['proposal_candidates']['Row']
type ProposalStatus = Database['app']['Tables']['proposal_drafts']['Row']['status']
type ProfileRow = Database['app']['Tables']['app_profiles']['Row']
type AdminRegistryRow = Database['app']['Tables']['admin_registry']['Row']

function asStringArray(value: Json): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function normalizeMission(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean)
  }

  return (value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export interface DeploymentRecordInput {
  deployedSpaceId: number
  deployedSpaceAddress: string
  ownerWallet: string
  registryAddress: string
  deploymentTxHash: string
  blockNumber?: number | null
  actorWallet?: string | null
}

export interface ProposalStatusUpdateInput {
  id: string
  status: ProposalStatus
  txHash?: string
  onchainProposalId?: number | null
  deployment?: DeploymentRecordInput
  message?: string | null
}

type LocalNotificationPayload = NotificationPayload & { proposalId: string }

function mapProposalRow(row: ProposalRow): ProposalDraftRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    bannerImagePath: row.banner_image_path,
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

function withCreatorAccount(
  proposal: ProposalDraftRecord,
  creator?: Pick<ProfileRow, 'display_name' | 'email' | 'wallet_address'> | null,
  registry?: Pick<AdminRegistryRow, 'organization_name'> | null,
): ProposalDraftRecord {
  return {
    ...proposal,
    creatorDisplayName: creator?.display_name ?? null,
    creatorOrganizationName: registry?.organization_name ?? creator?.display_name ?? null,
    createdByWalletAddress: creator?.wallet_address ?? null,
  }
}

async function withCreatorAccounts(proposals: ProposalDraftRecord[]): Promise<ProposalDraftRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client || proposals.length === 0) return proposals

  const creatorIds = Array.from(new Set(proposals.map((proposal) => proposal.createdBy).filter(Boolean)))
  if (creatorIds.length === 0) return proposals

  const { data: profiles, error: profilesError } = await client
    .schema('app')
    .from('app_profiles')
    .select('id, display_name, email, wallet_address')
    .in('id', creatorIds)

  if (profilesError) throw new RepositoryError('Gagal memuat akun admin pengaju. Coba lagi.')

  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
  const creatorEmails = Array.from(new Set((profiles ?? []).map((profile) => profile.email?.trim().toLowerCase()).filter((email): email is string => Boolean(email))))

  let registriesByEmail = new Map<string, Pick<AdminRegistryRow, 'organization_name'>>()

  if (creatorEmails.length > 0) {
    const { data: registries, error: registriesError } = await client
      .schema('app')
      .from('admin_registry')
      .select('email, organization_name')
      .in('email', creatorEmails)

    if (registriesError) throw new RepositoryError('Gagal memuat nama organisasi admin pengaju. Coba lagi.')
    registriesByEmail = new Map((registries ?? []).map((registry) => [registry.email.toLowerCase(), registry]))
  }

  return proposals.map((proposal) => {
    const creator = profilesById.get(proposal.createdBy) ?? null
    const registry = creator?.email ? registriesByEmail.get(creator.email.toLowerCase()) ?? null : null
    return withCreatorAccount(proposal, creator, registry)
  })
}

function mapProposalCandidateRow(row: ProposalCandidateRow): ProposalCandidateRecord {
  return {
    id: row.id,
    proposalDraftId: row.proposal_draft_id,
    candidateLocalId: row.candidate_local_id,
    fullName: row.full_name,
    studentId: row.student_id,
    faculty: row.faculty,
    bio: row.bio,
    vision: row.vision,
    mission: asStringArray(row.mission),
    youtubeUrl: row.youtube_url,
    avatarPath: row.avatar_path,
    sortOrder: row.sort_order,
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
    case 'draft':
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
    case 'draft':
    default: return 'Proposal diperbarui.'
  }
}

export async function listProposalActivities(proposalDraftId: string): Promise<ProposalActivityRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('notification_jobs')
    .select('*')
    .eq('template_key', 'proposal_activity')
    .contains('payload', { proposalId: proposalDraftId })
    .order('created_at', { ascending: false })

  if (error) return []

  return (data ?? []).map((row) => {
    const payload = typeof row.payload === 'object' && row.payload !== null && !Array.isArray(row.payload) ? row.payload : {}
    const getString = (key: string) => typeof payload[key] === 'string' ? payload[key] : ''
    const message = getString('message') || null
    return {
      id: row.id,
      proposalDraftId,
      eventType: getString('eventType') || 'proposal_activity',
      title: getString('title') || row.template_key,
      description: getString('description') || message || 'Aktivitas proposal tercatat.',
      actorLabel: getString('actorLabel') || 'Sistem',
      message,
      createdAt: row.created_at,
    }
  })
}

export async function listProposalDrafts(): Promise<ProposalDraftRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new RepositoryError('Gagal memuat daftar proposal. Coba lagi.')
  return withCreatorAccounts((data ?? []).map(mapProposalRow))
}

export async function getProposalDraftById(id: string): Promise<ProposalDraftRecord | null> {
  const client = getSupabaseBrowserClient()
  if (!client) return null

  const { data, error } = await client
    .schema('app')
    .from('proposal_drafts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new RepositoryError('Gagal memuat detail proposal. Coba lagi.')
  if (!data) return null

  const proposal = mapProposalRow(data)
  const { data: creator, error: creatorError } = await client
    .schema('app')
    .from('app_profiles')
    .select('display_name, email, wallet_address')
    .eq('id', data.created_by)
    .maybeSingle()

  if (creatorError) throw new RepositoryError('Gagal memuat wallet admin pengaju. Coba lagi.')

  const { data: registry, error: registryError } = creator?.email
    ? await client
      .schema('app')
      .from('admin_registry')
      .select('organization_name')
      .eq('email', creator.email.toLowerCase())
      .maybeSingle()
    : { data: null, error: null }

  if (registryError) throw new RepositoryError('Gagal memuat nama organisasi admin pengaju. Coba lagi.')
  return withCreatorAccount(proposal, creator, registry)
}

export async function listProposalCandidates(proposalDraftId: string): Promise<ProposalCandidateRecord[]> {
  const client = getSupabaseBrowserClient()
  if (!client) return []

  const { data, error } = await client
    .schema('app')
    .from('proposal_candidates')
    .select('*')
    .eq('proposal_draft_id', proposalDraftId)
    .order('sort_order', { ascending: true })

  if (error) throw new RepositoryError('Gagal memuat kandidat proposal. Coba lagi.')
  return (data ?? []).map(mapProposalCandidateRow)
}

export async function saveProposalDraft(input: ProposalDraftUpsertInput): Promise<ProposalDraftRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  const profile = await getCurrentProfile()
  if (!profile) throw new RepositoryError('Sesi admin belum aktif untuk menyimpan proposal.')

  const basePayload = {
    title: input.title,
    organization_name: input.organizationName ?? null,
    description: input.description ?? null,
    banner_image_path: input.bannerImagePath ?? null,
    candidate_count: input.candidateCount,
    commit_start_at: input.commitStartAt ?? null,
    reveal_start_at: input.revealStartAt ?? null,
    ended_at: input.endedAt ?? null,
    status: input.status ?? 'draft',
  }

  const { data, error } = input.id
    ? await client
      .schema('app')
      .from('proposal_drafts')
      .update(basePayload)
      .eq('id', input.id)
      .select('*')
      .single()
    : await client
      .schema('app')
      .from('proposal_drafts')
      .insert({ ...basePayload, created_by: profile.id })
      .select('*')
      .single()

  if (error) throw new RepositoryError('Gagal menyimpan proposal. Coba lagi.')

  if (input.candidates) {
    const sanitizedCandidates = input.candidates
      .map((candidate, index) => ({
        proposal_draft_id: data.id,
        candidate_local_id: `candidate-${index + 1}`,
        full_name: candidate.name.trim(),
        student_id: candidate.studentId?.trim() || null,
        faculty: candidate.faculty?.trim() || null,
        bio: candidate.bio?.trim() || null,
        vision: candidate.vision?.trim() || null,
        mission: normalizeMission(candidate.mission),
        youtube_url: candidate.youtubeUrl?.trim() || null,
        avatar_path: candidate.avatarPath?.trim() || null,
        sort_order: index,
      }))
      .filter((candidate) => candidate.full_name.length > 0)

    const { error: deleteCandidatesError } = await client
      .schema('app')
      .from('proposal_candidates')
      .delete()
      .eq('proposal_draft_id', data.id)

    if (deleteCandidatesError) {
      throw new RepositoryError('Proposal tersimpan, tetapi data kandidat gagal diperbarui.')
    }

    if (sanitizedCandidates.length > 0) {
      const { error: insertCandidatesError } = await client
        .schema('app')
        .from('proposal_candidates')
        .insert(sanitizedCandidates)

      if (insertCandidatesError) {
        throw new RepositoryError('Proposal tersimpan, tetapi data kandidat gagal diperbarui.')
      }
    }
  }

  if (input.whitelistEntries) {
    const sanitizedWhitelistEntries = input.whitelistEntries
      .map((entry) => ({
        proposal_draft_id: data.id,
        wallet_address: entry.walletAddress.trim(),
        voter_name: entry.voterName?.trim() || null,
        source: 'manual' as const,
      }))
      .filter((entry) => /^0x[a-fA-F0-9]{40}$/.test(entry.wallet_address))

    const { error: deleteWhitelistError } = await client
      .schema('app')
      .from('proposal_whitelist_entries')
      .delete()
      .eq('proposal_draft_id', data.id)

    if (deleteWhitelistError) {
      throw new RepositoryError('Proposal tersimpan, tetapi daftar pemilih gagal diperbarui.')
    }

    if (sanitizedWhitelistEntries.length > 0) {
      const { error: insertWhitelistError } = await client
        .schema('app')
        .from('proposal_whitelist_entries')
        .insert(sanitizedWhitelistEntries)

      if (insertWhitelistError) {
        throw new RepositoryError('Proposal tersimpan, tetapi daftar pemilih gagal diperbarui.')
      }
    }
  }

  const proposal = mapProposalRow(data)

  if (input.status === 'submitted') {
    const payload: LocalNotificationPayload = {
      proposalId: proposal.id,
      eventType: input.id ? 'resubmitted' : 'submitted',
      title: input.id ? 'Proposal diajukan ulang' : 'Proposal baru diajukan',
      description: `${proposal.title} menunggu review superadmin.`,
      actorLabel: 'Admin Organisasi',
      link: `/superadmin/manajemen-proposal/${proposal.id}`,
      type: 'info',
    }
    void notifySuperadmins(payload).catch(() => undefined)
    void insertNotification(proposal.createdBy, { ...payload, title: 'Proposal berhasil dikirim', description: `${proposal.title} sudah masuk antrean review superadmin.`, link: `/admin/daftar-proposal/${proposal.id}`, type: 'success' }).catch(() => undefined)
  }

  return proposal
}

export async function updateProposalStatus(input: ProposalStatusUpdateInput): Promise<ProposalDraftRecord> {
  const client = getSupabaseBrowserClient()
  if (!client) throw new RepositoryError('Backend belum dikonfigurasi.')

  if (typeof window !== 'undefined') {
    const { data: sessionData } = await client.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) throw new RepositoryError('Sesi pengguna belum aktif untuk memperbarui proposal.')
    const response = await fetch(`/api/proposals/${input.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input),
    })
    const payload: unknown = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : 'Gagal memperbarui status proposal. Coba lagi.'
      throw new RepositoryError(message)
    }
    if (!payload || typeof payload !== 'object' || !('proposal' in payload)) throw new RepositoryError('Respons status proposal tidak dikenali.')
    return payload.proposal as ProposalDraftRecord
  }

  const { data: beforeRow } = await client.schema('app').from('proposal_drafts').select('*').eq('id', input.id).maybeSingle()

  const payload: Partial<Database['app']['Tables']['proposal_drafts']['Update']> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  }

  if (input.txHash) {
    if (input.status === 'submitted') {
      payload.proposal_tx_hash = input.txHash
    } else if (input.status === 'approved') {
      payload.review_tx_hash = input.txHash
    } else if (input.status === 'deployed') {
      payload.deployment_tx_hash = input.txHash
    }
  }

  if (typeof input.onchainProposalId === 'number') {
    payload.onchain_proposal_id = input.onchainProposalId
  }

  if (input.deployment) {
    payload.deployment_tx_hash = input.deployment.deploymentTxHash
    payload.deployed_space_id = input.deployment.deployedSpaceId
    payload.deployed_space_address = input.deployment.deployedSpaceAddress
  }

  const { data, error } = await client
    .schema('app')
    .from('proposal_drafts')
    .update(payload)
    .eq('id', input.id)
    .select('*')
    .single()

  if (error) throw new RepositoryError('Gagal memperbarui status proposal. Coba lagi.')

  const title = activityTitleForStatus(input.status)
  const description = activityDescriptionForStatus(input.status, input.message)
  const activityPayload: LocalNotificationPayload = {
    proposalId: input.id,
    eventType: beforeRow?.status === 'revision_requested' && input.status === 'submitted' ? 'resubmitted' : input.status,
    title: beforeRow?.status === 'revision_requested' && input.status === 'submitted' ? 'Proposal diajukan ulang' : title,
    description,
    actorLabel: input.status === 'revision_requested' || input.status === 'approved' || input.status === 'rejected' || input.status === 'deployed' ? 'Superadmin' : 'Admin Organisasi',
    message: input.message?.trim() || null,
    link: input.status === 'revision_requested' ? `/admin/daftar-proposal/${input.id}` : `/superadmin/manajemen-proposal/${input.id}`,
    type: input.status === 'revision_requested' ? 'warning' : input.status === 'rejected' || input.status === 'archived' ? 'info' : 'success',
  }

  if (input.status === 'submitted') void notifySuperadmins(activityPayload).catch(() => undefined)
  if (beforeRow?.created_by) void insertNotification(beforeRow.created_by, { ...activityPayload, link: `/admin/daftar-proposal/${input.id}` }).catch(() => undefined)

  if (input.deployment) {
    const { error: mapError } = await client
      .schema('app')
      .from('space_registry_map')
      .upsert({
        proposal_draft_id: input.id,
        chain_id: 84532,
        onchain_proposal_id: input.onchainProposalId ?? null,
        space_id: input.deployment.deployedSpaceId,
        registry_address: input.deployment.registryAddress,
        space_address: input.deployment.deployedSpaceAddress,
        owner_wallet: input.deployment.ownerWallet,
        deployment_tx_hash: input.deployment.deploymentTxHash,
      }, { onConflict: 'proposal_draft_id' })

    if (mapError) throw new RepositoryError('Pemilihan tersimpan, tetapi mapping registry Supabase gagal diperbarui.')

    const auditWallet = input.deployment.actorWallet ?? input.deployment.ownerWallet
    const { error: auditError } = await client
      .schema('app')
      .from('tx_audit_log')
      .upsert({
        space_id: input.deployment.deployedSpaceId,
        proposal_draft_id: input.id,
        wallet_address: auditWallet,
        action_type: 'deploy_space',
        tx_hash: input.deployment.deploymentTxHash,
        block_number: input.deployment.blockNumber ?? null,
        status: 'success',
        source: 'frontend',
        metadata: {
          registryAddress: input.deployment.registryAddress,
          spaceAddress: input.deployment.deployedSpaceAddress,
          ownerWallet: input.deployment.ownerWallet,
        },
      }, { onConflict: 'tx_hash,action_type' })

    if (auditError) throw new RepositoryError('Pemilihan tersimpan, tetapi audit transaksi Supabase gagal diperbarui.')

    // Notify admin that their proposal has been deployed
    if (beforeRow?.created_by) {
      void insertNotification(beforeRow.created_by, {
        eventType: 'deployed',
        title: 'Pemilihan berhasil di-deploy',
        description: 'Proposal Anda sudah menjadi ruang pemilihan aktif di blockchain. Pemilih sekarang bisa melakukan pencoblosan.',
        actorLabel: 'Superadmin',
        link: `/admin/daftar-proposal/${input.id}`,
        type: 'success',
      }).catch(() => undefined)
    }
  }

  return mapProposalRow(data)
}
