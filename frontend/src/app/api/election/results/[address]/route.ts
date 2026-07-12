import { NextResponse } from 'next/server'

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

  // Hasil pemilihan (termasuk jumlah komitmen) hanya tersedia lewat indexer
  // Ponder yang mencatat event Commit/Reveal. Tanpa indexer, menampilkan
  // nol adalah data palsu, sehingga kita mengembalikan error eksplisit
  // alih-alih nol palsu.
  return NextResponse.json(
    { error: 'Indexer Ponder tidak tersedia; data hasil pemilihan belum dapat diambil.' },
    { status: 503 },
  )
}
