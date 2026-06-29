import { NextResponse, type NextRequest } from 'next/server'
import { GET as listPublicElections } from '@/app/api/public/elections/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const response = await listPublicElections()
  if (!response.ok) return response
  const payload: unknown = await response.json()
  const elections = payload && typeof payload === 'object' && 'elections' in payload && Array.isArray(payload.elections) ? payload.elections : []
  const election = elections.find((item) => item && typeof item === 'object' && 'id' in item && item.id === id) ?? null
  return NextResponse.json({ election })
}
