import { NextResponse, type NextRequest } from 'next/server'
import { requireProfile, jsonError } from '@/app/api/_lib/auth'
import { isRecord } from '@/lib/repositories/helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isHex32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value)
}

function isTxHash(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value)
}

export async function POST(request: NextRequest) {
  const auth = await requireProfile(request, ['voter'])
  if ('error' in auth) return auth.error

  const body: unknown = await request.json().catch(() => null)
  if (!isRecord(body)) return jsonError('Payload auto reveal tidak valid.')

  const electionId = typeof body.electionId === 'string' ? body.electionId.trim() : ''
  const voterWallet = typeof body.voterWallet === 'string' ? body.voterWallet.trim().toLowerCase() : ''
  const contractAddress = typeof body.contractAddress === 'string' ? body.contractAddress.trim().toLowerCase() : ''
  const candidateUuid = typeof body.candidateUuid === 'string' ? body.candidateUuid.trim() : ''
  const candidateNumber = typeof body.candidateNumber === 'number' ? body.candidateNumber : Number(body.candidateNumber)
  const salt = typeof body.salt === 'string' ? body.salt.trim() : ''
  const commitment = typeof body.commitment === 'string' ? body.commitment.trim() : ''
  const commitTxHash = typeof body.commitTxHash === 'string' ? body.commitTxHash.trim() : ''
  const blockNumber = typeof body.blockNumber === 'number' ? body.blockNumber : Number(body.blockNumber)

  if (!electionId) return jsonError('ID pemilihan wajib tersedia.')
  if (!/^0x[a-f0-9]{40}$/.test(voterWallet)) return jsonError('Wallet pemilih tidak valid.')
  if (!/^0x[a-f0-9]{40}$/.test(contractAddress)) return jsonError('Alamat kontrak tidak valid.')
  if (!candidateUuid) return jsonError('Kandidat belum dipilih.')
  if (!Number.isInteger(candidateNumber) || candidateNumber <= 0) return jsonError('Nomor kandidat tidak valid.')
  if (!isHex32(salt)) return jsonError('Salt reveal tidak valid.')
  if (!isHex32(commitment)) return jsonError('Commitment tidak valid.')
  if (!isTxHash(commitTxHash)) return jsonError('Hash transaksi commit tidak valid.')

  if (auth.profile.wallet_address.toLowerCase() !== voterWallet) {
    return jsonError('Wallet pemilih berbeda dari profil akun.', 403)
  }

  const { data: proposal, error: proposalError } = await auth.client
    .from('proposal_drafts')
    .select('id, deployed_space_id, deployed_space_address, reveal_start_at, ended_at')
    .eq('id', electionId)
    .maybeSingle()

  if (proposalError) return jsonError('Gagal memeriksa data pemilihan.', 500)
  if (!proposal) return jsonError('Pemilihan tidak ditemukan.', 404)
  if ((proposal.deployed_space_address ?? '').toLowerCase() !== contractAddress) {
    return jsonError('Alamat kontrak tidak sesuai dengan pemilihan.', 409)
  }

  const { error } = await auth.client
    .from('tx_audit_log')
    .insert({
      proposal_draft_id: electionId,
      space_id: proposal.deployed_space_id,
      wallet_address: voterWallet,
      action_type: 'commit_vote',
      tx_hash: commitTxHash,
      block_number: Number.isFinite(blockNumber) ? blockNumber : null,
      status: 'auto_reveal_queued',
      source: 'voter_one_click_flow',
      metadata: {
        autoReveal: true,
        revealStatus: 'queued',
        candidateUuid,
        candidateId: candidateNumber,
        salt,
        commitment,
        contractAddress,
        revealStartAt: proposal.reveal_start_at,
        endedAt: proposal.ended_at,
        custodyModel: 'trusted_relayer_backend',
        note: 'Sensitive reveal payload for delegated revealFor. Access must be restricted to trusted relayer/TU.',
      },
    })

  if (error) return jsonError('Gagal menyimpan antrean penghitungan otomatis.', 500)
  return NextResponse.json({ ok: true })
}
