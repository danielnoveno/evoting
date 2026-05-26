'use client'

import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import VoteChainRegistryArtifact from '@/lib/abi/VoteChainRegistry.json'

const registryAbi = VoteChainRegistryArtifact.abi

// Default registry address for Base Sepolia - should be updated after deployment
export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0xa91568d64d24d42Ec1Cd10C20B2F9D8d341250D0'

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

  const parseElectionSpaceCreated = (receipt: any) => {
    if (!receipt || !receipt.logs) return null
    // The event is ElectionSpaceCreated(uint256 spaceId, address space, ...)
    // Usually it's one of the logs. For simplicity in this demo environment:
    try {
      // Find the log from the Registry contract
      const log = receipt.logs.find((l: any) => l.address.toLowerCase() === REGISTRY_ADDRESS.toLowerCase())
      if (!log) return null
      
      // In a real app we'd use viem's decodeEventLog
      // For now, let's just look at the topics/data if we know the position
      // Topic 0 is event signature, Topic 1 is spaceId, Topic 2 is space address (if indexed)
      // Looking at the Solidity: event ElectionSpaceCreated(uint256 indexed spaceId, address indexed space, ...)
      // So topic 2 is the space address.
      if (log.topics && log.topics[2]) {
        return `0x${log.topics[2].slice(26)}` as `0x${string}`
      }
    } catch (e) {
      console.error('Failed to parse space address', e)
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
      args: [title, metadataURI, BigInt(candidateCount), BigInt(commitDuration), BigInt(revealDuration)],
    })
  }

  return {
    isSuperAdmin,
    reviewProposal,
    createElection,
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
