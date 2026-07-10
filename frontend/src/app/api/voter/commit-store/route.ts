import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/voter/commit-store
 * Save vote commitment (salt + candidateId) to server after commit tx confirmed.
 * This enables auto-reveal by the relayer during the Reveal phase.
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ success: false, message: 'Server tidak terkonfigurasi.' }, { status: 500 })
  }

  // Auth: extract user from Bearer token
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 })
  }

  const body = (await request.json()) as {
    electionId?: string
    spaceAddress?: string
    voterAddress?: string
    candidateId?: number
    salt?: string
    commitmentHash?: string
    commitTxHash?: string
  }

  if (!body.electionId || !body.spaceAddress || !body.voterAddress || !body.candidateId || !body.salt || !body.commitmentHash) {
    return NextResponse.json({ success: false, message: 'Field wajib tidak lengkap.' }, { status: 400 })
  }

  // Verify the voter_address matches the authenticated user's wallet
  const { data: profile } = await supabase
    .schema('app')
    .from('app_profiles')
    .select('wallet_address')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.wallet_address?.toLowerCase() !== body.voterAddress.toLowerCase()) {
    return NextResponse.json({ success: false, message: 'Wallet address tidak cocok dengan akun.' }, { status: 403 })
  }

  const { error } = await supabase
    .schema('app')
    .from('vote_commitments')
    .upsert({
      election_id: body.electionId,
      space_address: body.spaceAddress,
      voter_address: body.voterAddress,
      candidate_id: body.candidateId,
      salt: body.salt,
      commitment_hash: body.commitmentHash,
      commit_tx_hash: body.commitTxHash ?? null,
      revealed: false,
    }, { onConflict: 'election_id,voter_address' })

  if (error) {
    console.error('[commit-store] Error:', error)
    return NextResponse.json({ success: false, message: 'Gagal menyimpan komitmen.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
