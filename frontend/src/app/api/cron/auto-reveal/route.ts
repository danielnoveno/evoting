import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    { error: 'Auto reveal relayer dinonaktifkan. Reveal harus dikirim dari dompet aktivasi voter dengan paymaster.' },
    { status: 410 },
  )
}
