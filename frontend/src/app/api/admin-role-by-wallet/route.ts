import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

const WALLET_RE = /^0x[a-fA-F0-9]{40}$/

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const wallet = searchParams.get('wallet')?.trim() ?? ''

  if (!WALLET_RE.test(wallet)) {
    return NextResponse.json({ error: 'wallet_invalid' }, { status: 400 })
  }

  const client = getSupabaseServiceRoleClient()
  if (!client) {
    return NextResponse.json({ error: 'backend_not_configured' }, { status: 503 })
  }

  const { data, error } = await client
    .from('admin_registry')
    .select('assigned_role, organization_name')
    .ilike('wallet_address', wallet)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'registry_unavailable' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json(null, { status: 200 })
  }

  return NextResponse.json({
    role: data.assigned_role,
    organizationName: data.organization_name,
  })
}
