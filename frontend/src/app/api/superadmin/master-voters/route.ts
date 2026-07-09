import { NextResponse, type NextRequest } from 'next/server'
import { jsonError, requireProfile, type ServiceClient } from '@/app/api/_lib/auth'
import { logAudit, getActorInfo } from '@/lib/audit-logger'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanNullableText(value: unknown) {
  const text = cleanText(value)
  return text || null
}

/**
 * POST /api/superadmin/master-voters
 *
 * Dua mode berdasarkan body:
 * 1. { action: 'add', nim, fullName, email, prodi, fakultas?, angkatan? } → tambah voter
 * 2. { action: 'bulk-delete', ids: string[] } → hapus banyak voter (cascade)
 */
export async function POST(request: NextRequest) {
  const auth = await requireProfile(request, ['super_admin'])
  if ('error' in auth) return auth.error

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError('Format permintaan tidak valid.', 400)
  }

  if (!isRecord(payload)) return jsonError('Data tidak valid.', 400)

  const action = payload.action === 'bulk-delete' ? 'bulk-delete' : 'add'

  if (action === 'bulk-delete') {
    return handleBulkDelete(auth.client, payload)
  }
  return handleAdd(auth.client, payload)
}

async function handleAdd(client: ServiceClient, payload: Record<string, unknown>) {
  const nim = cleanText(payload.nim)
  const fullName = cleanText(payload.fullName)
  const email = cleanText(payload.email)
  const prodi = cleanText(payload.prodi)
  const fakultas = cleanNullableText(payload.fakultas)
  const angkatan = cleanNullableText(payload.angkatan)
  const walletAddress = cleanNullableText(payload.walletAddress)

  if (!/^\d{8,10}$/.test(nim)) return jsonError('NIM harus berupa 8-10 digit angka.', 400)
  if (!fullName) return jsonError('Nama lengkap wajib diisi.', 400)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('Email tidak valid.', 400)
  if (!prodi) return jsonError('Program studi wajib diisi.', 400)
  if (angkatan && !/^\d{4}$/.test(angkatan)) return jsonError('Angkatan harus berupa tahun 4 digit.', 400)

  const { data, error } = await client
    .schema('app')
    .from('master_voters')
    .insert({
      nim,
      full_name: fullName,
      email: email.toLowerCase(),
      prodi,
      fakultas: fakultas ?? 'FTI',
      angkatan,
      wallet_address: walletAddress,
      status: 'active',
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') return jsonError('NIM sudah terdaftar di sistem.', 409)
    return jsonError('Gagal menambahkan mahasiswa. Periksa data yang diisi.', 500)
  }

  const actor = await getActorInfo(client)
  await logAudit({
    action_name: 'add_voter',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'master_voter',
    entity_id: data.id,
    details: { nim, fullName, email, prodi, fakultas, angkatan },
    related_tx_hash: null,
    source: 'server_api',
  })

  return NextResponse.json({
    voter: {
      id: data.id,
      nim: data.nim,
      fullName: data.full_name,
      email: data.email,
      prodi: data.prodi,
      fakultas: data.fakultas,
      angkatan: data.angkatan,
      walletAddress: data.wallet_address,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  })
}

async function handleBulkDelete(client: ServiceClient, payload: Record<string, unknown>) {
  if (!Array.isArray(payload.ids) || payload.ids.length === 0) {
    return jsonError('Daftar ID voter wajib diisi.', 400)
  }

  const ids = payload.ids as string[]
  if (ids.length > 100) return jsonError('Maksimal 100 voter per sekali hapus.', 400)

  const { data: voters, error: fetchError } = await client
    .from('master_voters')
    .select('id, email, nim, full_name')
    .in('id', ids)

  if (fetchError) return jsonError('Gagal memuat data voter.', 500)
  if (!voters || voters.length === 0) return jsonError('Data voter tidak ditemukan.', 404)

  const emails = [...new Set(voters.map((v) => v.email?.trim().toLowerCase()).filter(Boolean))] as string[]

  for (const email of emails) {
    const { data: profiles } = await client
      .from('app_profiles')
      .select('id, user_id')
      .ilike('email', email)

    if (profiles && profiles.length > 0) {
      const userIds = profiles.map((p) => p.user_id).filter(Boolean)
      if (userIds.length > 0) {
        await client.from('user_wallets').delete().in('user_id', userIds)
      }
      await client.from('app_profiles').delete().in('id', profiles.map((p) => p.id))
    }

    await client.from('activation_tokens').delete().ilike('email', email)
  }

  const { error: deleteError } = await client
    .from('master_voters')
    .delete()
    .in('id', ids)

  if (deleteError) return jsonError('Gagal menghapus data voter.', 500)

  const actor = await getActorInfo(client)
  await logAudit({
    action_name: 'bulk_delete_voters',
    actor_wallet: actor.wallet,
    actor_email: actor.email,
    actor_role: actor.role,
    entity_type: 'master_voter',
    entity_id: ids.join(','),
    details: { count: voters.length, emails },
    related_tx_hash: null,
    source: 'server_api',
  })

  return NextResponse.json({ success: true, deleted: voters.length })
}
