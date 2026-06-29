import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function safeExtension(file: File): string {
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/jpeg') return 'jpg'
  return 'webp'
}

export async function POST(request: NextRequest) {
  const client = getSupabaseServiceRoleClient()
  if (!client) return jsonError('Service role Supabase belum dikonfigurasi.', 503)

  const authorization = request.headers.get('authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return jsonError('Sesi pengguna tidak ditemukan.', 401)

  const { data: userData, error: userError } = await client.auth.getUser(token)
  if (userError || !userData.user) return jsonError('Sesi pengguna tidak valid atau sudah berakhir.', 401)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError('Payload unggahan tidak valid.', 400)
  }

  const file = formData.get('file')
  if (!(file instanceof File)) return jsonError('File foto belum dipilih.', 400)
  if (!file.type.startsWith('image/')) return jsonError('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.', 400)
  if (file.size > MAX_AVATAR_BYTES) return jsonError('Ukuran foto terlalu besar. Maksimal 2MB setelah kompresi.', 400)

  const { data: profile, error: profileError } = await client
    .from('app_profiles')
    .select('id, user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (profileError) return jsonError('Gagal memuat profil pengguna.', 500)
  if (!profile) return jsonError('Profil pengguna belum aktif.', 404)

  const extension = safeExtension(file)
  const filePath = `avatars/${userData.user.id}-${Date.now()}.${extension}`
  const { data: uploadData, error: uploadError } = await client.storage
    .from('public-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      contentType: file.type || 'image/webp',
      upsert: true,
    })

  if (uploadError || !uploadData) return jsonError(uploadError?.message ?? 'Gagal mengunggah foto.', 500)

  const { data: publicUrlData } = client.storage
    .from('public-assets')
    .getPublicUrl(uploadData.path)

  const avatarUrl = publicUrlData.publicUrl
  const { error: updateError } = await client
    .from('app_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', userData.user.id)

  if (updateError) return jsonError('Foto terunggah, tetapi profil gagal diperbarui.', 500)

  return NextResponse.json({ avatarUrl })
}
