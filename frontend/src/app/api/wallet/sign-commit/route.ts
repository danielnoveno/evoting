import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    { error: 'Flow server-derived wallet sudah dinonaktifkan. Gunakan dompet aktivasi voter dengan paymaster untuk commit.' },
    { status: 410 },
  )
}
