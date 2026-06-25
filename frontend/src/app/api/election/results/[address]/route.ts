import { NextResponse } from 'next/server'
import { fetchElectionResultsFromChain } from '@/lib/alchemy-rpc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { address: string } },
) {
  const address = params.address?.trim()
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Alamat kontrak tidak valid.' }, { status: 400 })
  }

  try {
    const result = await fetchElectionResultsFromChain(address)
    return NextResponse.json({
      spaceAddress: address,
      totalCommitted: 0, // ponytail: not available from contract state
      totalRevealed: result.totalRevealed,
      lastUpdatedBlock: null,
      candidateResults: result.candidateResults.map((r) => ({
        candidateId: String(r.candidateId),
        voteCount: r.voteCount,
        lastRevealTx: null,
        lastUpdatedBlock: null,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal membaca data dari blockchain.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
