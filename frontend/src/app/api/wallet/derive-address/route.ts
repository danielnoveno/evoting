/**
 * API Route: Derive Wallet Address
 *
 * GET /api/wallet/derive-address
 *
 * Mengembalikan wallet address yang di-derive dari user ID.
 * Address selalu sama untuk user yang sama (deterministic).
 *
 * Keamanan:
 * - Hanya bisa diakses oleh user yang sudah login
 * - Private key tidak pernah dikembalikan ke client
 * - Master secret tidak pernah diexpose
 */

import { NextResponse, type NextRequest } from 'next/server'
import { deriveWalletAddress, isValidMasterSecret } from '@/lib/wallet-crypto'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 1. Validate master secret
    const masterSecret = process.env.WALLET_MASTER_SECRET
    if (!isValidMasterSecret(masterSecret)) {
      console.error('[WALLET] WALLET_MASTER_SECRET tidak valid atau belum diatur')
      return NextResponse.json(
        { error: 'Sistem wallet belum dikonfigurasi.' },
        { status: 500 },
      )
    }

    // 2. Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi.' },
        { status: 401 },
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // 3. Verify user with Supabase
    const supabase = getSupabaseServiceRoleClient()

    if (!supabase) {
      console.error('[WALLET] Supabase configuration missing')
      return NextResponse.json(
        { error: 'Sistem autentikasi belum siap.' },
        { status: 500 },
      )
    }

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Sesi tidak valid. Silakan masuk kembali.' },
        { status: 401 },
      )
    }

    // 4. Derive wallet address (deterministic)
    const walletAddress = deriveWalletAddress(user.id, masterSecret!)

    // 5. Upsert to user_wallets table (store public address only)
    const { error: upsertError } = await supabase
      .from('user_wallets')
      .upsert(
        {
          user_id: user.id,
          wallet_address: walletAddress,
        },
        { onConflict: 'user_id' },
      )

    if (upsertError) {
      console.error('[WALLET] Upsert error:', upsertError)
      // Non-fatal: address derivation still works
    }

    // 6. Sync app_profiles.wallet_address to match derived wallet
    //    This ensures the voter's profile wallet always matches the server-derived
    //    wallet, preventing "ID voting berbeda dari dompet akun" mismatches.
    const { data: currentProfile } = await supabase
      .schema('app')
      .from('app_profiles')
      .select('wallet_address')
      .eq('user_id', user.id)
      .maybeSingle()

    const currentWallet = (currentProfile as Record<string, unknown> | null)?.wallet_address as string | null
    if (!currentWallet || currentWallet.toLowerCase() !== walletAddress.toLowerCase()) {
      // Check if derived wallet is already used by another profile
      const { data: existingOwner } = await supabase
        .schema('app')
        .from('app_profiles')
        .select('user_id')
        .ilike('wallet_address', walletAddress)
        .neq('user_id', user.id)
        .maybeSingle()

      if (!existingOwner) {
        const { error: syncError } = await supabase
          .schema('app')
          .from('app_profiles')
          .update({ wallet_address: walletAddress })
          .eq('user_id', user.id)

        if (syncError) {
          console.error('[WALLET] Profile wallet sync error:', syncError)
          // Non-fatal: derivation still works, just profile might show old wallet
        }
      } else {
        console.warn('[WALLET] Derived wallet already used by another profile, skipping sync')
      }
    }

    // 7. Return address (public only, no private key)
    return NextResponse.json({
      address: walletAddress,
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
