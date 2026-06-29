import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function requireSuperadmin(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return { client: null, error: jsonError('Service role Supabase belum dikonfigurasi.', 503) }

  const authorization = request.headers.get('authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return { client, error: jsonError('Sesi superadmin tidak ditemukan.', 401) }

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) return { client, error: jsonError('Sesi superadmin tidak valid atau sudah berakhir.', 401) }

  const { data: profile, error: profileError } = await client
    .from('app_profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (profileError) return { client, error: jsonError('Gagal memeriksa otoritas superadmin.', 500) }
  if (!profile || profile.role !== 'super_admin') return { client, error: jsonError('Hanya superadmin aktif yang dapat melihat log audit.', 403) }

  return { client, error: null }
}

interface TxAuditRow {
  id: string
  space_id: number | null
  proposal_draft_id: string | null
  wallet_address: string
  action_type: string
  tx_hash: string
  block_number: number | null
  status: string
  source: string
  metadata: Record<string, unknown> | null
  created_at: string
}

interface OpsAuditRow {
  id: string
  action_name: string
  actor_wallet: string | null
  actor_email: string | null
  actor_role: string | null
  entity_type: string
  entity_id: string
  details: Record<string, unknown> | null
  related_tx_hash: string | null
  source: string
  created_at: string
}

const TX_ACTION_LABELS: Record<string, string> = {
  submit_proposal: 'Proposal Diajukan',
  review_proposal: 'Proposal Ditinjau',
  deploy_space: 'Pemilihan Di-deploy',
  register_voter: 'Voter Didftarkan',
  unregister_voter: 'Voter Dihapus',
  phase_transition: 'Fase Voting Berubah',
  commit_vote: 'Suara Committed',
  reveal_vote: 'Suara Direveal',
  suspend_space: 'Space Ditangguhkan',
  unsuspend_space: 'Space Dipulihkan',
  terminate_space: 'Space Dihentikan',
}

const OPS_ACTION_LABELS: Record<string, string> = {
  add_superadmin: 'Superadmin Ditambahkan',
  remove_superadmin: 'Superadmin Dihapus',
  add_admin: 'Admin Ditambahkan',
  remove_admin: 'Admin Dihapus',
  update_proposal: 'Proposal Diperbarui',
  deploy_proposal: 'Proposal Di-deploy',
  deploy_space: 'Pemilihan Di-deploy',
  create_proposal: 'Proposal Baru Dibuat',
  add_whitelist: 'Whitelist Ditambahkan',
  remove_whitelist: 'Whitelist Dihapus',
  sync_whitelist: 'Whitelist Disinkronisasi',
  add_voter: 'Voter Ditambahkan',
  update_voter: 'Voter Diperbarui',
  delete_voter: 'Voter Dihapus',
  bulk_import_voters: 'Voter Diimpor Massal',
  activate_account: 'Akun Diaktivasi',
  commit_vote: 'Suara Committed',
  reveal_vote: 'Suara Direveal',
}

function mapIcon(actionType: string): 'proposal' | 'vote' | 'validator' {
  if (actionType.includes('proposal') || actionType.includes('deploy') || actionType.includes('whitelist')) return 'proposal'
  if (actionType.includes('vote') || actionType.includes('commit') || actionType.includes('reveal')) return 'vote'
  return 'validator'
}

function mapStatusTone(status: string): 'verified' | 'syncing' {
  return status === 'success' ? 'verified' : 'syncing'
}

function formatTxLog(row: TxAuditRow) {
  return {
    id: row.id,
    block: row.block_number ? `#${row.block_number}` : '#—',
    eventLabel: TX_ACTION_LABELS[row.action_type] ?? row.action_type,
    title: TX_ACTION_LABELS[row.action_type] ?? row.action_type,
    timestamp: row.created_at,
    txHash: row.tx_hash,
    status: row.status === 'success' ? 'Verified' : 'Syncing',
    statusTone: mapStatusTone(row.status),
    icon: mapIcon(row.action_type),
    actorWallet: row.wallet_address,
    source: row.source,
    metadata: row.metadata,
    type: 'tx' as const,
  }
}

function formatOpsLog(row: OpsAuditRow) {
  return {
    id: row.id,
    block: '—',
    eventLabel: OPS_ACTION_LABELS[row.action_name] ?? row.action_name,
    title: OPS_ACTION_LABELS[row.action_name] ?? row.action_name,
    timestamp: row.created_at,
    txHash: row.related_tx_hash ?? '—',
    status: 'Verified',
    statusTone: 'verified' as const,
    icon: mapIcon(row.action_name),
    actorWallet: row.actor_wallet,
    actorEmail: row.actor_email,
    source: row.source,
    metadata: row.details,
    type: 'ops' as const,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperadmin(request)
  if (auth.error) return auth.error
  const client = auth.client
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const { searchParams } = new URL(request.url)
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 50, 1), 200) : 50
  const daysParam = searchParams.get('days')
  const days = daysParam ? Math.min(Math.max(Number(daysParam) || 30, 1), 90) : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const [txResult, opsResult] = await Promise.all([
    client
      .from('tx_audit_log')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit),
    client
      .from('ops_audit_log')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit),
  ])

  const firstError = txResult.error ?? opsResult.error
  if (firstError) {
    console.error('[audit-log] Query error:', firstError.message, firstError.code)
    return jsonError('Gagal memuat data audit log.', 500)
  }

  const txRows = (txResult.data ?? []) as TxAuditRow[]
  const opsRows = (opsResult.data ?? []) as OpsAuditRow[]

  const combinedLogs = [
    ...txRows.map(formatTxLog),
    ...opsRows.map(formatOpsLog),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)

  return NextResponse.json({ logs: combinedLogs })
}
