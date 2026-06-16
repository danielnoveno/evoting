import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_BASE_SEPOLIA_RPC_URLS = [
  'https://base-sepolia-rpc.publicnode.com',
  'https://sepolia.base.org',
]

function getRpcUrls(): string[] {
  return Array.from(new Set([
    process.env.BASE_SEPOLIA_RPC_URL?.trim(),
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim(),
    ...DEFAULT_BASE_SEPOLIA_RPC_URLS,
  ].filter((url): url is string => Boolean(url))))
}

async function fetchWithTimeout(url: string, body: string) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8_000)

  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(request: NextRequest) {
  let body: string
  try {
    body = await request.text()
    JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Payload RPC tidak valid.' }, { status: 400 })
  }

  const rpcUrls = getRpcUrls()
  let lastError = 'Endpoint RPC Base Sepolia tidak merespons.'

  for (const rpcUrl of rpcUrls) {
    try {
      const response = await fetchWithTimeout(rpcUrl, body)
      const text = await response.text()

      if (response.ok && text.trim().length > 0) {
        return new NextResponse(text, {
          status: response.status,
          headers: {
            'Content-Type': response.headers.get('content-type') ?? 'application/json',
            'Cache-Control': 'no-store',
          },
        })
      }

      lastError = text.trim() || `RPC ${rpcUrl} mengembalikan status ${response.status}.`
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'RPC Base Sepolia gagal diakses.'
    }
  }

  return NextResponse.json({ error: lastError }, { status: 502 })
}
