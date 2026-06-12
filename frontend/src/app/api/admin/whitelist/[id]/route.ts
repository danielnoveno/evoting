import { NextResponse, type NextRequest } from 'next/server'
import { ensureCanManageProposal, jsonError, requireProfile } from '@/app/api/_lib/auth'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireProfile(request, ['admin', 'super_admin'])
  if ('error' in auth) return auth.error
  const { id } = await context.params

  const { data: row, error: loadError } = await auth.client
    .from('proposal_whitelist_entries')
    .select('id, proposal_draft_id')
    .eq('id', id)
    .maybeSingle()

  if (loadError) return jsonError('Gagal memuat data whitelist.', 500)
  if (!row) return jsonError('Data whitelist tidak ditemukan.', 404)

  const permissionError = await ensureCanManageProposal(auth.client, auth.profile, row.proposal_draft_id)
  if (permissionError) return permissionError

  const { error } = await auth.client.from('proposal_whitelist_entries').delete().eq('id', id)
  if (error) return jsonError('Gagal menghapus pemilih dari whitelist.', 500)
  return NextResponse.json({ ok: true })
}
