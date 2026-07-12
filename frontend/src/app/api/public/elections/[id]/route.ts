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
  const normalizedId = id.toLowerCase()

  // Try exact id match first, then deployedSpaceAddress (case-insensitive)
  const election = elections.find((item) => {
    if (!item || typeof item !== 'object') return false
    if ('id' in item && item.id === id) return true
    if ('id' in item && typeof item.id === 'string' && item.id.toLowerCase() === normalizedId) return true
    if ('deployedSpaceAddress' in item && typeof item.deployedSpaceAddress === 'string' && item.deployedSpaceAddress.toLowerCase() === normalizedId) return true
    return false
  }) ?? null

  console.log(`[public-election-${id}] found=${Boolean(election)}, totalElections=${elections.length}`)
  return NextResponse.json({ election })
}
