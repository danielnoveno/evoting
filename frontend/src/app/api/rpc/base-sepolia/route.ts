import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_BASE_SEPOLIA_RPC_URLS = [
  'https://base-sepolia-rpc.publicnode.com',
  'https://sepolia.base.org',
  'https://rpc.ankr.com/base_sepolia',
]

function getRpcUrls(): string[] {
  return Array.from(new Set([
    process.env.BASE_SEPOLIA_RPC_URL?.trim(),
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim(),
    ...DEFAULT_BASE_SEPOLIA_RPC_URLS,
  ].filter((url): url is string => Boolean(url))))
}

async function fetchWithTimeout(url: string, body: string, timeoutMs = 10_000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

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

/**
 * Retry a single RPC endpoint up to 2 times for transient errors (429, 502, 503, network).
 * This helps when public RPCs briefly rate-limit or drop connections.
 */
async function fetchWithRetry(url: string, body: string, maxRetries = 2): Promise<{ ok: boolean; text: string; status: number }> {
  let lastError = ''

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, body)
      const text = await response.text()

      // Success: non-empty valid JSON response
      if (response.ok && text.trim().length > 0) {
        try {
          const payload: unknown = JSON.parse(text)
          if (payload && typeof payload === 'object' && 'error' in payload) {
            const rpcError = payload.error
            lastError = rpcError && typeof rpcError === 'object' && 'message' in rpcError && typeof rpcError.message === 'string'
              ? rpcError.message
              : 'RPC mengembalikan kesalahan.'
            return { ok: false, text: lastError, status: response.status }
          }
        } catch {
          lastError = 'Respons RPC tidak valid.'
          return { ok: false, text: lastError, status: response.status }
        }
        return { ok: true, text, status: response.status }
      }

      // Rate-limited or transient server error — retry
      if ([429, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
        lastError = text.trim() || `Status ${response.status}`
        const delay = Math.min(1000 * 2 ** attempt, 3000)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }

      // Non-transient error — don't retry
      lastError = text.trim() || `Status ${response.status}`
      return { ok: false, text: lastError, status: response.status }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error'

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * 2 ** attempt, 3000)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  return { ok: false, text: lastError, status: 0 }
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
  const triedUrls: string[] = []
  let lastError = 'Endpoint RPC Base Sepolia tidak merespons.'

  for (const rpcUrl of rpcUrls) {
    triedUrls.push(rpcUrl)
    const result = await fetchWithRetry(rpcUrl, body)

    if (result.ok) {
      return new NextResponse(result.text, {
        status: result.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      })
    }

    lastError = result.text || `RPC ${rpcUrl} gagal.`
  }

  // All endpoints failed — return detailed error for debugging
  return NextResponse.json({
    error: lastError,
    tried: triedUrls,
    hint: 'Semua endpoint RPC Base Sepolia gagal. Coba lagi dalam beberapa menit atau gunakan RPC berbayar (Alchemy/Infura).',
  }, { status: 502 })
}
