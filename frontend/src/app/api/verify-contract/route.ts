import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse, type NextRequest } from 'next/server'
import { encodeAbiParameters, type Address } from 'viem'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Verify that the caller is an authenticated Supabase user. */
async function requireAuth(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user.id
}

const BASESCAN_API_URL = 'https://api-sepolia.basescan.org/api'

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

async function readContractSource(name: 'VoteChainRegistry' | 'ElectionSpace') {
  return readFile(path.join(process.cwd(), '..', 'contracts', 'src', `${name}.sol`), 'utf8')
}

async function getFlattenedRegistrySource() {
  const electionSpace = await readContractSource('ElectionSpace')
  const registry = await readContractSource('VoteChainRegistry')
  return [
    electionSpace,
    registry
      .replace('// SPDX-License-Identifier: MIT', '')
      .replace('pragma solidity ^0.8.24;', '')
      .replace('import { ElectionSpace } from "./ElectionSpace.sol";', ''),
  ].join('\n')
}

async function getContractConfig(body: VerifyBody): Promise<ContractConfig> {
  const type = body.contractType === 'registry' ? 'registry' : 'election-space'

  if (type === 'registry') {
    const initialSuperAdmin = body.initialSuperAdmin || process.env.INITIAL_SUPERADMIN || process.env.NEXT_PUBLIC_SUPERADMIN_ADDRESS
    if (!isAddress(initialSuperAdmin)) throw new Error('initialSuperAdmin/INITIAL_SUPERADMIN wajib address valid')

    return {
      contractName: 'VoteChainRegistry',
      sourceCode: await getFlattenedRegistrySource(),
      constructorArguements: encodeAbiParameters([{ type: 'address' }], [initialSuperAdmin]).slice(2),
    }
  }

  if (!isAddress(body.registry)) throw new Error('registry wajib address valid')
  if (!isAddress(body.spaceAdmin)) throw new Error('spaceAdmin wajib address valid')
  if (!isAddress(body.initialActor)) throw new Error('initialActor wajib address valid')

  return {
    contractName: 'ElectionSpace',
    sourceCode: await readContractSource('ElectionSpace'),
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

  const response = await fetch(`${BASESCAN_API_URL}?apikey=${apiKey}&module=contract&action=getverificationstatus&guid=${guid}`)
  const data = (await response.json()) as BasescanResponse
  if (data.result === 'Pending in queue') return { pending: true, verified: false, message: 'Masih dalam antrian verifikasi' }
  if (data.result === 'Pass - Verified') return { pending: false, verified: true, message: 'Terverifikasi' }
  return { pending: false, verified: false, message: data.result }
}

export async function POST(request: NextRequest) {
  // ── Auth: verify caller is authenticated ──
  const userId = await requireAuth(request)
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Tidak terautentikasi.' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as VerifyBody
    if (!isAddress(body.contractAddress)) {
      return NextResponse.json({ success: false, message: 'contractAddress wajib address valid' }, { status: 400 })
    }

    const contractType = body.contractType === 'registry' ? 'registry' : 'election-space'
    const result = await verifyContract(body.contractAddress, await getContractConfig({ ...body, contractType }))

    if (result.success && result.guid) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      const status = await checkVerificationStatus(result.guid)
      return NextResponse.json({ success: true, guid: result.guid, contractType, ...status })
    }

    return NextResponse.json({ ...result, contractType })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
