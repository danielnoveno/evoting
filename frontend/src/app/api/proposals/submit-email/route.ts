import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { sendProposalSubmittedEmail } from '@/lib/email/send'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Payload tidak valid.' }, { status: 400 })
  }

  const proposalId = typeof body.proposalId === 'string' ? body.proposalId.trim() : ''
  const facultyFilter = typeof body.faculty === 'string' ? body.faculty.trim() : ''
  if (!proposalId) return NextResponse.json({ error: 'proposalId wajib diisi.' }, { status: 400 })

  const serviceClient = getSupabaseServiceRoleClient()
  if (!serviceClient) return NextResponse.json({ error: 'Service role Supabase belum dikonfigurasi.' }, { status: 503 })

  // Fetch proposal data
  const { data: proposal, error: proposalError } = await serviceClient
    .schema('app')
    .from('proposal_drafts')
    .select('id, title, organization_name, created_by')
    .eq('id', proposalId)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposal tidak ditemukan.' }, { status: 404 })
  }

  // Fetch superadmin emails, filtered by faculty if provided
  let superadminQuery = serviceClient
    .schema('app')
    .from('app_profiles')
    .select('id, email, display_name')
    .eq('role', 'super_admin')
    .not('email', 'is', null)

  const { data: superadmins, error: queryError } = await superadminQuery

  if (queryError) {
    return NextResponse.json({ error: 'Gagal memuat daftar superadmin.' }, { status: 500 })
  }

  // If faculty filter is provided, cross-reference with admin_registry
  let targetSuperadmins = superadmins ?? []
  if (facultyFilter && targetSuperadmins.length > 0) {
    const superadminIds = targetSuperadmins.map((s: { id: string }) => s.id)
    const { data: registries } = await serviceClient
      .schema('app')
      .from('admin_registry')
      .select('email, faculty')
      .in('email', targetSuperadmins.map((s: { email: string }) => s.email).filter(Boolean))
      .eq('assigned_role', 'super_admin')

    if (registries && registries.length > 0) {
      const facultyEmails = new Set(
        registries
          .filter((r: { faculty?: string | null }) => r.faculty === facultyFilter)
          .map((r: { email: string }) => r.email.toLowerCase())
      )
      // If we have faculty-matched superadmins, use only those; otherwise fall back to all
      if (facultyEmails.size > 0) {
        targetSuperadmins = targetSuperadmins.filter(
          (s: { email: string | null }) => s.email && facultyEmails.has(s.email.toLowerCase())
        )
      }
    }
  }

  if (!targetSuperadmins || targetSuperadmins.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'Tidak ada superadmin yang cocok.' })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://e-votein.netlify.app'
  const proposalLink = `${siteUrl}/superadmin/manajemen-proposal/${proposalId}`
  const actorName = proposal.organization_name || 'Admin Organisasi'

  let sent = 0
  for (const admin of targetSuperadmins) {
    if (!admin.email) continue
    const result = await sendProposalSubmittedEmail({
      email: admin.email,
      adminName: actorName,
      proposalTitle: proposal.title,
      organizationName: proposal.organization_name || 'Organisasi',
      isResubmission: false,
      proposalLink,
    }).catch(() => null)
    if (result?.success) sent++
  }

  return NextResponse.json({ ok: true, sent })
}
