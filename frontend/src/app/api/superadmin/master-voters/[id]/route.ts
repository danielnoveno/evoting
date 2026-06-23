import { NextResponse, type NextRequest } from 'next/server'
import { jsonError, requireProfile } from '@/app/api/_lib/auth'
import { logAudit, getActorInfo } from '@/lib/audit-logger'
import type { Database } from '@/lib/supabase/database.types'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'

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

  // Log the update
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
