'use client'

import { useCallback } from 'react'
import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { decodeEventLog, type Address, type Log } from 'viem'
import { PAYMASTER_URL } from '@/lib/wagmi'
import VoteChainRegistryArtifact from '@/lib/abi/VoteChainRegistry.json'

const registryAbi = VoteChainRegistryArtifact.abi

// Default registry address for Base Sepolia - should be updated after deployment
export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x059e0F48aEB8190c7c9955023eB46716b8ef8Ce1'

interface ElectionSpaceCreatedEvent {
  proposalId: number
  spaceId: number
  spaceAddress: Address
}

export function useRegistryContract() {
  const { address: userAddress, isConnected, chainId } = useAccount()

  const { 
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
  const createElectionForAdminWithConfig = useCallback((
    spaceAdmin: Address,
    title: string,
    metadataURI: string,
    candidateCount: number,
    initialVoters: Address[],
    commitStartsAt: bigint,
    commitEndsAt: bigint,
    revealStartsAt: bigint,
    revealEndsAt: bigint,
  ) => {
    const capabilities = PAYMASTER_URL ? { paymasterService: { url: PAYMASTER_URL } } : undefined;
    return writeContractAsync({
      address: REGISTRY_ADDRESS as Address,
      abi: registryAbi,
      functionName: 'createElectionForAdminWithConfig',
      args: [
        spaceAdmin,
        title,
        metadataURI,
        BigInt(candidateCount),
        initialVoters,
        commitStartsAt,
        commitEndsAt,
        revealStartsAt,
        revealEndsAt,
      ],
      // @ts-ignore - capabilities EIP-5792
      capabilities,
    })
  }, [writeContractAsync])

  const addSuperAdmin = useCallback((admin: Address) => {
    const capabilities = PAYMASTER_URL ? { paymasterService: { url: PAYMASTER_URL } } : undefined;
    return writeContractAsync({
      address: REGISTRY_ADDRESS as Address,
      abi: registryAbi,
      functionName: 'addSuperAdmin',
      args: [admin],
      // @ts-ignore - capabilities EIP-5792
      capabilities,
    })
  }, [writeContractAsync])

  const removeSuperAdmin = useCallback((admin: Address) => {
    const capabilities = PAYMASTER_URL ? { paymasterService: { url: PAYMASTER_URL } } : undefined;
    return writeContractAsync({
      address: REGISTRY_ADDRESS as Address,
      abi: registryAbi,
      functionName: 'removeSuperAdmin',
      args: [admin],
      // @ts-ignore - capabilities EIP-5792
      capabilities,
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

  return {
    isSuperAdmin,
    isSuperAdminLoading: isSuperAdminLoading || isSuperAdminFetching,
    superAdminAddress,
    registryAddress: REGISTRY_ADDRESS,
    userAddress,
    isConnected,
    chainId,
    createElectionForAdminWithConfig,
    addSuperAdmin,
    removeSuperAdmin,
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
