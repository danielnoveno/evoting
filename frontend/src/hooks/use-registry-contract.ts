'use client'

import { useCallback } from 'react'
import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { decodeEventLog, type Address, type Log } from 'viem'
import VoteChainRegistryArtifact from '@/lib/abi/VoteChainRegistry.json'

const registryAbi = VoteChainRegistryArtifact.abi

// Default registry address for Base Sepolia - should be updated after deployment
export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x7928524CdFc035136b629E796EA4e7C54A6Ef3c0'

interface ElectionSpaceCreatedEvent {
  proposalId: number
  spaceId: number
  spaceAddress: Address
}

export function useRegistryContract() {
  const { address: userAddress, isConnected, chainId } = useAccount()

  const { 
    writeContract, 
    writeContractAsync,
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
  const { data: isSuperAdmin, isLoading: isSuperAdminLoading, isFetching: isSuperAdminFetching } = useReadContract({
    address: REGISTRY_ADDRESS as `0x${string}`,
    abi: registryAbi,
    functionName: 'isSuperAdmin',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!REGISTRY_ADDRESS && !!userAddress && REGISTRY_ADDRESS !== '0x0000000000000000000000000000000000000000',
    }
  })

  // Baca alamat superAdmin dari on-chain (digunakan untuk pesan error deploy)
  const { data: superAdminAddress } = useReadContract({
    address: REGISTRY_ADDRESS as `0x${string}`,
    abi: registryAbi,
    functionName: 'superAdmin',
    query: {
      enabled: !!REGISTRY_ADDRESS && REGISTRY_ADDRESS !== '0x0000000000000000000000000000000000000000',
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

  const createElectionForAdmin = useCallback((
    spaceAdmin: Address,
    title: string,
    metadataURI: string,
    candidateCount: number
  ) => {
    return writeContractAsync({
      address: REGISTRY_ADDRESS as Address,
      abi: registryAbi,
      functionName: 'createElectionForAdmin',
      args: [spaceAdmin, title, metadataURI, BigInt(candidateCount)],
    })
  }, [writeContractAsync])

  const addSuperAdmin = useCallback((admin: Address) => {
    return writeContractAsync({
      address: REGISTRY_ADDRESS as Address,
      abi: registryAbi,
      functionName: 'addSuperAdmin',
      args: [admin],
    })
  }, [writeContractAsync])

  const removeSuperAdmin = useCallback((admin: Address) => {
    return writeContractAsync({
      address: REGISTRY_ADDRESS as Address,
      abi: registryAbi,
      functionName: 'removeSuperAdmin',
      args: [admin],
    })
  }, [writeContractAsync])

  const parseElectionSpaceCreated = useCallback((receipt?: { logs?: Log[] } | null): ElectionSpaceCreatedEvent | null => {
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
  }, [])

  const submitProposal = (
    title: string,
    metadataURI: string,
    candidateCount: number,
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
    isSuperAdminLoading: isSuperAdminLoading || isSuperAdminFetching,
    superAdminAddress,
    registryAddress: REGISTRY_ADDRESS,
    userAddress,
    isConnected,
    chainId,
    reviewProposal,
    createElection,
    createElectionForAdmin,
    addSuperAdmin,
    removeSuperAdmin,
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
