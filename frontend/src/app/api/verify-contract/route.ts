import { encodeAbiParameters, type Address } from 'viem'
import { NextResponse, type NextRequest } from 'next/server'
import { ELECTION_SPACE_SOURCE, FLATTENED_REGISTRY_SOURCE } from '@/lib/contract-source'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASESCAN_API_URL = 'https://api.etherscan.io/v2/api'
const BASE_SEPOLIA_CHAIN_ID = '84532'

type ContractType = 'registry' | 'election-space'

type VerifyBody = {
  contractAddress?: string
  contractType?: ContractType
  initialSuperAdmin?: string
  registry?: string
  spaceAdmin?: string
  spaceId?: number
  candidateCount?: number
  title?: string
  metadataURI?: string
  initialActor?: string
  initialVoters?: string[]
  commitStartsAt?: string | number
  commitEndsAt?: string | number
  revealStartsAt?: string | number
  revealEndsAt?: string | number
}

type ContractConfig = {
  contractName: string
  sourceCode: string
  constructorArguements: string
}

type BasescanResponse = {
  status: string
  message: string
  result: string
}

function isAddress(value: unknown): value is Address {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)
}

function asBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(value)
  if (typeof value === 'string' && value.trim()) return BigInt(value)
  return BigInt(0)
}

// ponytail: source code di-embed dari build time agar production-safe (tidak depend on process.cwd)
async function getContractConfig(body: VerifyBody): Promise<ContractConfig> {
  const type = body.contractType === 'registry' ? 'registry' : 'election-space'

  if (type === 'registry') {
    const initialSuperAdmin = body.initialSuperAdmin || process.env.INITIAL_SUPERADMIN || process.env.NEXT_PUBLIC_SUPERADMIN_ADDRESS
    if (!isAddress(initialSuperAdmin)) throw new Error('initialSuperAdmin/INITIAL_SUPERADMIN wajib address valid')

    return {
      contractName: 'VoteChainRegistry',
      sourceCode: FLATTENED_REGISTRY_SOURCE,
      constructorArguements: encodeAbiParameters([{ type: 'address' }], [initialSuperAdmin]).slice(2),
    }
  }

  if (!isAddress(body.registry)) throw new Error('registry wajib address valid')
  if (!isAddress(body.spaceAdmin)) throw new Error('spaceAdmin wajib address valid')
  if (!isAddress(body.initialActor)) throw new Error('initialActor wajib address valid')

  return {
    contractName: 'ElectionSpace',
    sourceCode: ELECTION_SPACE_SOURCE,
    constructorArguements: encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'address' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'string' },
        { type: 'string' },
        { type: 'address' },
        { type: 'address[]' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint256' },
      ],
      [
        body.registry,
        body.spaceAdmin,
        asBigInt(body.spaceId),
        asBigInt(body.candidateCount),
        body.title || '',
        body.metadataURI || '',
        body.initialActor,
        (body.initialVoters || []).filter(isAddress),
        asBigInt(body.commitStartsAt),
        asBigInt(body.commitEndsAt),
        asBigInt(body.revealStartsAt),
        asBigInt(body.revealEndsAt),
      ],
    ).slice(2),
  }
}

async function verifyContract(contractAddress: string, config: ContractConfig) {
  const apiKey = process.env.BASESCAN_API_KEY
  if (!apiKey) return { success: false, message: 'BASESCAN_API_KEY tidak dikonfigurasi di server' }

  const params = new URLSearchParams({
    chainid: BASE_SEPOLIA_CHAIN_ID,
    apikey: apiKey,
    module: 'contract',
    action: 'verifysourcecode',
    contractaddress: contractAddress,
    sourceCode: config.sourceCode,
    codeformat: 'solidity-single-file',
    contractname: config.contractName,
    compilerversion: 'v0.8.24+commit.e11b9ed9',
    optimizationUsed: '1',
    runs: '200',
    constructorArguements: config.constructorArguements,
    evmversion: 'cancun',
    viaIR: 'true',
    licenseType: '3',
  })

  const response = await fetch(BASESCAN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const data = (await response.json()) as BasescanResponse

  if (data.status === '1') return { success: true, message: 'Verifikasi dikirim', guid: data.result }
  if (data.result?.toLowerCase().includes('already verified')) return { success: true, message: 'Contract sudah verified' }
  return { success: false, message: data.result || 'Verifikasi gagal' }
}

async function checkVerificationStatus(guid: string) {
  const apiKey = process.env.BASESCAN_API_KEY
  if (!apiKey) return { pending: false, verified: false, message: 'BASESCAN_API_KEY tidak dikonfigurasi' }

  const response = await fetch(`${BASESCAN_API_URL}?${new URLSearchParams({ chainid: BASE_SEPOLIA_CHAIN_ID, apikey: apiKey, module: 'contract', action: 'getverificationstatus', guid })}`)
  const data = (await response.json()) as BasescanResponse
  if (data.result === 'Pending in queue') return { pending: true, verified: false, message: 'Masih dalam antrian verifikasi' }
  if (data.result === 'Pass - Verified') return { pending: false, verified: true, message: 'Terverifikasi' }
  return { pending: false, verified: false, message: data.result }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyBody
    if (!isAddress(body.contractAddress)) {
      return NextResponse.json({ success: false, message: 'contractAddress wajib address valid' }, { status: 400 })
    }

    const contractType = body.contractType === 'registry' ? 'registry' : 'election-space'
    console.log(`[verify-contract] Memulai verifikasi ${contractType} di ${body.contractAddress}`)
    
    const result = await verifyContract(body.contractAddress, await getContractConfig({ ...body, contractType }))
    console.log(`[verify-contract] Hasil verifikasi:`, result)

    if (result.success && result.guid) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      const status = await checkVerificationStatus(result.guid)
      console.log(`[verify-contract] Status verifikasi:`, status)
      return NextResponse.json({ success: true, guid: result.guid, contractType, ...status })
    }

    return NextResponse.json({ ...result, contractType })
  } catch (error) {
    console.error('[verify-contract] Error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

/** GET: check if a contract is verified on Basescan */
export async function GET(request: NextRequest) {
  const contractAddress = request.nextUrl.searchParams.get('address')
  if (!contractAddress || !isAddress(contractAddress)) {
    return NextResponse.json({ verified: false, message: 'address wajib address valid' }, { status: 400 })
  }

  const apiKey = process.env.BASESCAN_API_KEY
  if (!apiKey) {
    return NextResponse.json({ verified: false, message: 'BASESCAN_API_KEY tidak dikonfigurasi' })
  }

  try {
    const response = await fetch(
      `${BASESCAN_API_URL}?apikey=${apiKey}&module=contract&action=getabi&address=${contractAddress}`
      + `&chainid=${BASE_SEPOLIA_CHAIN_ID}`
    )
    const data = (await response.json()) as BasescanResponse
    const verified = data.status === '1' && data.message === 'OK'
    return NextResponse.json({ verified, message: verified ? 'Terverifikasi' : 'Belum terverifikasi' })
  } catch (error) {
    return NextResponse.json({ verified: false, message: 'Gagal memeriksa status verifikasi' })
  }
}
