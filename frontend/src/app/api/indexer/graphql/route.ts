import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getIndexerGraphqlUrl(): string | null {
  // Server-only PONDER_URL (never exposed to the client bundle).
  // Falls back to NEXT_PUBLIC_PONDER_URL only so local/dev keeps working until
  // the deployment env is migrated to the secret PONDER_URL.
  const url = process.env.PONDER_URL?.trim() || process.env.NEXT_PUBLIC_PONDER_URL?.trim()
  if (!url) return null
  return url.endsWith('/graphql') ? url : `${url.replace(/\/$/, '')}/graphql`
}

// Reject queries that SELECT the `voter` field on voteReveals/vote_reveals.
// Matches `voter` used as a field selection (followed by whitespace / { / } / end),
// but NOT `voter_in` (where-filter) nor `$voterVariants` (variable), so the
// legitimate per-voter proof queries keep working while the voter→candidate
// mapping stays hidden behind the server.
function selectsVoterField(body: string): boolean {
  return /voter(?![\w])/.test(body)
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

  if (selectsVoterField(body)) {
    return NextResponse.json(
      { error: 'Query ditolak: pemilihan field voter tidak diizinkan oleh proxy.' },
      { status: 403 },
    )
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
