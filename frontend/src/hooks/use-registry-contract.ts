'use client'

import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import VoteChainRegistryArtifact from '@/lib/abi/VoteChainRegistry.json'
import { capabilities } from '@/lib/wagmi'

const registryAbi = VoteChainRegistryArtifact.abi

// Default registry address for Base Sepolia - should be updated after deployment
export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000'

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
  const submitProposal = (title: string, metadataURI: string, candidateCount: number) => {
    writeContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: registryAbi,
      functionName: 'submitProposal',
      args: [title, metadataURI, BigInt(candidateCount)],
      capabilities,
    })
  }

  const reviewProposal = (proposalId: number, approve: boolean) => {
    writeContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: registryAbi,
      functionName: 'reviewProposal',
      args: [BigInt(proposalId), approve],
      capabilities,
    })
  }

  const createElection = (proposalId: number) => {
    writeContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: registryAbi,
      functionName: 'createElectionFromProposal',
      args: [BigInt(proposalId)],
      capabilities,
    })
  }

  return {
    isSuperAdmin,
    submitProposal,
    reviewProposal,
    createElection,
    hash,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    receipt,
    resetWrite
  }
}
