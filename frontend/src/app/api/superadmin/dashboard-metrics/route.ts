import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
  Pragma: 'no-cache',
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
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
  if (!profile || profile.role !== 'super_admin') return { client, error: jsonError('Hanya superadmin aktif yang dapat melihat statistik platform.', 403) }

  return { client, error: null }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperadmin(request)
  if (auth.error) return auth.error
  const client = auth.client
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const [
    activeAdminRegistry,
    adminProfiles,
    activeSpaces,
    pendingProposals,
    voterProfiles,
  ] = await Promise.all([
    client.from('admin_registry').select('email', { count: 'exact', head: true }).eq('assigned_role', 'admin').eq('status', 'active'),
    client.from('app_profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
    client.from('proposal_drafts').select('id', { count: 'exact', head: true }).eq('status', 'deployed'),
    client.from('proposal_drafts').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
    client.from('app_profiles').select('id', { count: 'exact', head: true }).eq('role', 'voter'),
  ])

  const firstError = activeAdminRegistry.error ?? adminProfiles.error ?? activeSpaces.error ?? pendingProposals.error ?? voterProfiles.error
  if (firstError) return jsonError('Gagal memuat statistik dashboard superadmin.', 500)

  const debug = request.nextUrl.searchParams.get('debug') === '1'
  return NextResponse.json({
    totalAdmins: Math.max(activeAdminRegistry.count ?? 0, adminProfiles.count ?? 0),
    activeSpaces: activeSpaces.count ?? 0,
    pendingProposals: pendingProposals.count ?? 0,
    totalVoters: voterProfiles.count ?? 0,
    ...(debug
      ? {
          _debug: {
            activeAdminRegistry: activeAdminRegistry.count ?? 0,
            adminProfiles: adminProfiles.count ?? 0,
            deployedProposalDrafts: activeSpaces.count ?? 0,
            submittedProposalDrafts: pendingProposals.count ?? 0,
            voterProfiles: voterProfiles.count ?? 0,
          },
        }
      : {}),
  }, { headers: NO_STORE_HEADERS })
}
