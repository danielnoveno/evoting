import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

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
  if (!profile || profile.role !== 'super_admin') return { client, error: jsonError('Hanya superadmin aktif yang dapat melihat aktivitas platform.', 403) }

  return { client, error: null }
}

interface ActivityRow {
  id: string
  action_type: string
  wallet_address: string
  tx_hash: string
  block_number: number | null
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
}

interface OpsAuditRow {
  id: string
  action_name: string
  actor_wallet: string | null
  entity_type: string
  entity_id: string
  related_tx_hash: string | null
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  submit_proposal: 'Proposal disubmit',
  review_proposal: 'Proposal ditinjau',
  deploy_space: 'Space berhasil deploy',
  register_voter: 'Voter didaftarkan',
  unregister_voter: 'Voter dihapus',
  phase_transition: 'Fase voting berubah',
  commit_vote: 'Suara committed',
  reveal_vote: 'Suara direveal',
  suspend_space: 'Space ditangguhkan',
  unsuspend_space: 'Space dipulihkan',
  terminate_space: 'Space dihentikan',
}

const OPS_ACTION_LABELS: Record<string, string> = {
  add_superadmin: 'Superadmin ditambahkan',
  remove_superadmin: 'Superadmin dihapus',
  add_admin: 'Admin ditambahkan',
  remove_admin: 'Admin dihapus',
  update_proposal: 'Proposal diperbarui',
  deploy_proposal: 'Proposal di-deploy',
  deploy_space: 'Ruang pemilihan di-deploy',
  create_proposal: 'Proposal baru dibuat',
  add_whitelist: 'Whitelist ditambahkan',
  remove_whitelist: 'Whitelist dihapus',
  sync_whitelist: 'Whitelist disinkronisasi ke blockchain',
  add_voter: 'Voter ditambahkan',
  update_voter: 'Voter diperbarui',
  delete_voter: 'Voter dihapus',
  bulk_import_voters: 'Voter diimpor massal',
  activate_account: 'Akun diaktivasi',
  commit_vote: 'Suara committed',
  reveal_vote: 'Suara direveal',
}

function formatActivity(row: ActivityRow) {
  return {
    id: row.id,
    type: row.action_type,
    label: ACTION_LABELS[row.action_type] ?? row.action_type,
    actor: row.wallet_address ? `${row.wallet_address.slice(0, 6)}...${row.wallet_address.slice(-4)}` : 'Unknown',
    txHash: row.tx_hash,
    blockNumber: row.block_number,
    status: row.status === 'success' ? 'success' : 'failed',
    metadata: row.metadata,
    timestamp: row.created_at,
  }
}

function formatOpsActivity(row: OpsAuditRow) {
  return {
    id: row.id,
    type: row.action_name,
    label: OPS_ACTION_LABELS[row.action_name] ?? row.action_name,
    actor: row.actor_wallet ? `${row.actor_wallet.slice(0, 6)}...${row.actor_wallet.slice(-4)}` : 'Unknown',
    txHash: row.related_tx_hash,
    blockNumber: null,
    status: 'success' as const,
    metadata: { entity_type: row.entity_type, entity_id: row.entity_id },
    timestamp: row.created_at,
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperadmin(request)
  if (auth.error) return auth.error
  const client = auth.client
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const { searchParams } = new URL(request.url)
  const daysParam = searchParams.get('days')
  const days = daysParam ? Math.min(Math.max(Number(daysParam) || 7, 1), 30) : 7
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 10, 1), 50) : 10
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // Fetch tx_audit_log and ops_audit_log in parallel
  const [txResult, opsResult, txCountResult] = await Promise.all([
    client
      .from('tx_audit_log')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200),
    client
      .from('ops_audit_log')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200),
    // Total tx count for chart aggregation
    client
      .from('tx_audit_log')
      .select('created_at, action_type, status')
      .gte('created_at', since),
  ])

  const firstError = txResult.error ?? opsResult.error ?? txCountResult.error
  if (firstError) {
    console.error('[dashboard-activity] Query error:', firstError.message, firstError.code)
    return jsonError('Gagal memuat data aktivitas.', 500)
  }

  const txRows = (txResult.data ?? []) as ActivityRow[]
  const opsRows = (opsResult.data ?? []) as OpsAuditRow[]

  // Build activity log (combine both sources, sort by timestamp, take top N)
  const combinedActivities = [
    ...txRows.map(formatActivity),
    ...opsRows.map(formatOpsActivity),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)

  // Build chart data: aggregate by day and action_type
  const txAllRows = (txCountResult.data ?? []) as ActivityRow[]
  const chartDays: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    chartDays.push(d.toISOString().split('T')[0])
  }

  // Group by day
  const dayMap: Record<string, Record<string, number>> = {}
  for (const day of chartDays) {
    dayMap[day] = {}
  }

  for (const row of txAllRows) {
    const day = row.created_at.split('T')[0]
    if (!dayMap[day]) continue
    const actionType = row.action_type
    dayMap[day][actionType] = (dayMap[day][actionType] ?? 0) + 1
  }

  // Convert to chart series format
  const allActionTypes = new Set<string>()
  for (const dayData of Object.values(dayMap)) {
    for (const key of Object.keys(dayData)) {
      allActionTypes.add(key)
    }
  }

  const SERIES_COLORS: Record<string, string> = {
    deploy_space: '#3b82f6',
    commit_vote: '#22c55e',
    reveal_vote: '#f59e0b',
    register_voter: '#8b5cf6',
    phase_transition: '#ef4444',
    submit_proposal: '#06b6d4',
    review_proposal: '#ec4899',
  }

  const chartSeries = Array.from(allActionTypes).map((actionType) => ({
    name: ACTION_LABELS[actionType] ?? actionType,
    color: SERIES_COLORS[actionType] ?? '#6b7280',
    data: chartDays.map((day) => ({
      x: day,
      y: dayMap[day][actionType] ?? 0,
    })),
  }))

  // Blockchain status
  const latestTx = txRows.length > 0 ? txRows[0] : null
  const totalTxCount = txAllRows.length
  const successCount = txAllRows.filter((r) => r.status === 'success').length

  return NextResponse.json({
    chart: {
      categories: chartDays.map((d) => {
        const date = new Date(d)
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      }),
      series: chartSeries,
    },
    activities: combinedActivities,
    blockchainStatus: {
      network: 'Base Sepolia',
      status: 'Connected',
      latestBlock: latestTx?.block_number ?? null,
      totalTransactions: totalTxCount,
      successRate: totalTxCount > 0 ? Math.round((successCount / totalTxCount) * 100) : 100,
    },
  })
}
