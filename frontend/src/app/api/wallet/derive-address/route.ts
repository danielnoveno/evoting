/**
 * API Route: Derive Wallet Address
 *
 * GET /api/wallet/derive-address
 *
 * Mengembalikan wallet aktivasi voter yang tersimpan di profil.
 *
 * Keamanan:
 * - Hanya bisa diakses oleh user yang sudah login
 * - Private key tidak pernah dikembalikan ke client
 * - Master secret tidak pernah diexpose
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get auth user from bearer token, or from Supabase SSR cookies when called directly in browser.
    const authHeader = request.headers.get('Authorization')
    const supabase = getSupabaseServiceRoleClient()

    if (!supabase) {
      console.error('[WALLET] Supabase configuration missing')
      return NextResponse.json(
        { error: 'Sistem autentikasi belum siap.' },
        { status: 500 },
      )
    }

    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null
    const cookieClient = token ? null : getSupabaseServerClient()
    const { data: { user }, error: authError } = token
      ? await supabase.auth.getUser(token)
      : cookieClient
        ? await cookieClient.auth.getUser()
        : { data: { user: null }, error: new Error('Tidak terautentikasi.') }

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk kembali.' },
        { status: 401 },
      )
    }

    const { data: currentProfile } = await supabase
      .schema('app')
      .from('app_profiles')
      .select('wallet_address')
      .eq('user_id', user.id)
      .maybeSingle()

    const currentWallet = (currentProfile as Record<string, unknown> | null)?.wallet_address as string | null
    if (!currentWallet) {
      return NextResponse.json(
        { error: 'Wallet aktivasi belum tertaut. Silakan hubungkan dompet terlebih dahulu.' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      address: currentWallet,
      userId: user.id,
    })
  } catch (error) {
    console.error('[WALLET] Derive address error:', error)
    return NextResponse.json(
      { error: 'Gagal membuat ID voting.' },
      { status: 500 },
    )
  }
}
