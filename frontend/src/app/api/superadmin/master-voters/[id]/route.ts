import { NextResponse, type NextRequest } from 'next/server'
import { jsonError, requireProfile } from '@/app/api/_lib/auth'
import { logAudit, getActorInfo } from '@/lib/audit-logger'
import type { Database } from '@/lib/supabase/database.types'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type MasterVoterRow = Database['app']['Tables']['master_voters']['Row']
type MasterVoterStatus = MasterVoterRow['status']

function mapVoter(row: MasterVoterRow) {
  return {
    id: row.id,
    nim: row.nim,
    fullName: row.full_name,
    email: row.email,
    prodi: row.prodi,
    fakultas: row.fakultas,
    angkatan: row.angkatan,
    walletAddress: row.wallet_address,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanNullableText(value: unknown) {
  const text = cleanText(value)
  return text || null
}

function parseStatus(value: unknown): MasterVoterStatus | null {
  if (value === 'active' || value === 'inactive' || value === 'pending') return value
  return null
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireProfile(request, ['super_admin'])
  if ('error' in auth) return auth.error

  const { data, error } = await auth.client
    .from('master_voters')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (error) return jsonError('Gagal memuat detail voter.', 500)
  if (!data) return jsonError('Data voter tidak ditemukan.', 404)

  return NextResponse.json({ voter: mapVoter(data) })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireProfile(request, ['super_admin'])
  if ('error' in auth) return auth.error

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError('Format permintaan tidak valid.', 400)
  }

  if (!isRecord(payload)) return jsonError('Data update tidak valid.', 400)

  const nim = cleanText(payload.nim)
  const fullName = cleanText(payload.fullName)
  const prodi = cleanText(payload.prodi)
  const fakultas = cleanText(payload.fakultas)
  const angkatan = cleanNullableText(payload.angkatan)
  const status = parseStatus(payload.status)

  if (!/^\d{8,10}$/.test(nim)) return jsonError('NIM harus berupa 8-10 digit angka.', 400)
  if (!fullName) return jsonError('Nama lengkap wajib diisi.', 400)
  if (!prodi) return jsonError('Program studi wajib diisi.', 400)
  if (!fakultas) return jsonError('Fakultas wajib diisi.', 400)
  if (angkatan && !/^\d{4}$/.test(angkatan)) return jsonError('Angkatan harus berupa tahun 4 digit, misalnya 2022.', 400)
  if (!status) return jsonError('Status voter tidak valid.', 400)

  // Email dan wallet_address sengaja tidak diterima dari payload agar identitas utama tidak berubah dari UI superadmin.
  const { data, error } = await auth.client
    .from('master_voters')
    .update({
      nim,
      full_name: fullName,
      prodi,
      fakultas,
      angkatan,
      status,
    })
    .eq('id', params.id)
    .select('*')
    .maybeSingle()

  if (error) {
    if (error.code === '23505') return jsonError('NIM sudah digunakan oleh voter lain.', 409)
    return jsonError('Gagal memperbarui data voter.', 500)
  }

  if (!data) return jsonError('Data voter tidak ditemukan.', 404)

  const actor = await getActorInfo(auth.client)
  await logAudit({
    action_name: 'update_voter',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'master_voter',
    entity_id: params.id,
    details: { nim, fullName, prodi, fakultas, angkatan, status },
    related_tx_hash: null,
    source: 'server_api',
  })

  return NextResponse.json({ voter: mapVoter(data) })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireProfile(request, ['super_admin'])
  if ('error' in auth) return auth.error

  // 1. Ambil data voter yang akan dihapus
  const { data: voter, error: fetchError } = await auth.client
    .from('master_voters')
    .select('*')
    .eq('id', params.id)
    .maybeSingle()

  if (fetchError) return jsonError('Gagal memuat data voter.', 500)
  if (!voter) return jsonError('Data voter tidak ditemukan.', 404)

  // 2. Cascade delete: bersihkan app_profiles, user_wallets, activation_tokens
  //    Tanpa cascade ini, wallet di app_profiles tetap hidup sehingga
  //    voter re-add menunjukkan "Sudah ada address wallet" atau "ID voting sudah tertaut".
  const email = voter.email?.trim().toLowerCase()
  if (email) {
    const { data: profiles } = await auth.client
      .from('app_profiles')
      .select('id, user_id')
      .ilike('email', email)

    if (profiles && profiles.length > 0) {
      const userIds = profiles.map((p) => p.user_id).filter(Boolean)

      if (userIds.length > 0) {
        await auth.client.from('user_wallets').delete().in('user_id', userIds)
      }

      await auth.client.from('app_profiles').delete().in('id', profiles.map((p) => p.id))
    }

    await auth.client.from('activation_tokens').delete().ilike('email', email)
  }

  // 3. Hapus master_voters
  const { error: deleteError } = await auth.client
    .from('master_voters')
    .delete()
    .eq('id', params.id)

  if (deleteError) return jsonError('Gagal menghapus data voter.', 500)

  // 4. Log audit
  const actor = await getActorInfo(auth.client)
  await logAudit({
    action_name: 'delete_voter',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'master_voter',
    entity_id: params.id,
    details: { email: voter.email, nim: voter.nim, full_name: voter.full_name },
    related_tx_hash: null,
    source: 'server_api',
  })

  return NextResponse.json({ success: true })
}
