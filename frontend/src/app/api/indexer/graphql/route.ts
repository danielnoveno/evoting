import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getIndexerGraphqlUrl(): string | null {
  const rawUrl = process.env.NEXT_PUBLIC_PONDER_URL?.trim()
  if (!rawUrl) return null
  return rawUrl.endsWith('/graphql') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/graphql`
}

export async function POST(request: NextRequest) {
  const graphqlUrl = getIndexerGraphqlUrl()
  if (!graphqlUrl) {
    return NextResponse.json({ error: 'Endpoint indexer belum dikonfigurasi.' }, { status: 503 })
  }

  let body: string
  try {
    body = await request.text()
  } catch {
    return NextResponse.json({ error: 'Payload GraphQL tidak valid.' }, { status: 400 })
  }

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  const text = await response.text()
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') ?? 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
