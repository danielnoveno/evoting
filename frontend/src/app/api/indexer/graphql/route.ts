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

  try {
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(10_000), // ponytail: 10s timeout agar tidak hang
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError'
      ? 'Indexer Ponder tidak merespons (timeout 10 detik). Server mungkin sedang down.'
      : 'Indexer Ponder tidak dapat dihubungi. Pastikan server indexer berjalan.'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
