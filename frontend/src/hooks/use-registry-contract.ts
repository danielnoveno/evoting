'use client'

import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { decodeEventLog, type Address, type Log } from 'viem'
import VoteChainRegistryArtifact from '@/lib/abi/VoteChainRegistry.json'

const registryAbi = VoteChainRegistryArtifact.abi

// Default registry address for Base Sepolia - should be updated after deployment
export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0xe5EC7c2C0308eB11C5254Fd6f0a20478edb8ff41'

interface ElectionSpaceCreatedEvent {
  proposalId: number
  spaceId: number
  spaceAddress: Address
}

export function useRegistryContract() {
  const { address: userAddress } = useAccount()

  const { 
    writeContract, 
    data: hash, 
    isPending: isWritePending, 
    error: writeError,
    reset: resetWrite
  } = useWriteContract()

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Read functions
  const { data: isSuperAdmin } = useReadContract({
    address: REGISTRY_ADDRESS as `0x${string}`,
    abi: registryAbi,
    functionName: 'isSuperAdmin',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!REGISTRY_ADDRESS && !!userAddress && REGISTRY_ADDRESS !== '0x0000000000000000000000000000000000000000',
    }
  })

  // Write functions
  const reviewProposal = (proposalId: number, approve: boolean) => {
    writeContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: registryAbi,
      functionName: 'reviewProposal',
      args: [BigInt(proposalId), approve],
    })
  }

  const createElection = (proposalId: number) => {
    writeContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: registryAbi,
      functionName: 'createElectionFromProposal',
      args: [BigInt(proposalId)],
    })
  }

  const createElectionForAdmin = (
    spaceAdmin: Address,
    title: string,
    metadataURI: string,
    candidateCount: number
  ) => {
    writeContract({
      address: REGISTRY_ADDRESS as Address,
      abi: registryAbi,
      functionName: 'createElectionForAdmin',
      args: [spaceAdmin, title, metadataURI, BigInt(candidateCount)],
    })
  }

  const parseElectionSpaceCreated = (receipt?: { logs?: Log[] } | null): ElectionSpaceCreatedEvent | null => {
    if (!receipt || !receipt.logs) return null
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== REGISTRY_ADDRESS.toLowerCase()) continue

      try {
        const decoded = decodeEventLog({
          abi: registryAbi,
          data: log.data,
          topics: log.topics,
        })

        if (decoded.eventName !== 'ElectionSpaceCreated') continue
        const args = decoded.args as { spaceId?: bigint; space?: Address; proposalId?: bigint }
        if (typeof args.spaceId === 'bigint' && args.space && typeof args.proposalId === 'bigint') {
          return {
            proposalId: Number(args.proposalId),
            spaceId: Number(args.spaceId),
            spaceAddress: args.space,
          }
        }
      } catch {
        // Continue scanning receipt logs until the registry deployment event is found.
      }
    }
    return null
  }

  const submitProposal = (
    title: string,
    metadataURI: string,
    candidateCount: number,
    commitDuration: number,
    revealDuration: number
  ) => {
    writeContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: registryAbi,
      functionName: 'submitProposal',
      args: [title, metadataURI, BigInt(candidateCount)],
    })
  }

  return {
    isSuperAdmin,
    userAddress,
    reviewProposal,
    createElection,
    createElectionForAdmin,
    submitProposal,
    parseElectionSpaceCreated,
    hash,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    receipt,
    resetWrite
  }
}
