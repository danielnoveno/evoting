import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    { error: 'Commit relayer dinonaktifkan. Commit harus dikirim dari dompet aktivasi voter dengan paymaster.' },
    { status: 410 },
  )
}
