'use client'

import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'
import { REGISTRY_ADDRESS } from '@/hooks/use-registry-contract'
import VoteChainRegistryArtifact from '@/lib/abi/VoteChainRegistry.json'
import type { Abi, Address } from 'viem'

const registryAbi = VoteChainRegistryArtifact.abi as Abi

/**
 * Checks on-chain isSuperAdmin status for a list of wallet addresses.
 * Returns a Map<string, boolean> where key is lowercase wallet address.
 */
export function useSuperadminOnchainStatus(walletAddresses: string[]) {
  const contracts = useMemo(() => {
    const validAddresses = walletAddresses
      .filter((addr) => /^0x[a-fA-F0-9]{40}$/.test(addr))
      .map((addr) => addr.toLowerCase())

    return validAddresses.map((addr) => ({
      address: REGISTRY_ADDRESS as Address,
      abi: registryAbi,
      functionName: 'isSuperAdmin' as const,
      args: [addr as Address],
    }))
  }, [walletAddresses])

  const { data: results, isLoading, isFetching } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0 && REGISTRY_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  })

  const statusMap = useMemo(() => {
    const map = new Map<string, boolean>()
    const validAddresses = walletAddresses
      .filter((addr) => /^0x[a-fA-F0-9]{40}$/.test(addr))
      .map((addr) => addr.toLowerCase())

    validAddresses.forEach((addr, index) => {
      if (results && results[index]) {
        const result = results[index]
        if (result.status === 'success') {
          map.set(addr, Boolean(result.result))
        } else {
          map.set(addr, false)
        }
      } else {
        map.set(addr, false)
      }
    })

    return map
  }, [results, walletAddresses])

  return {
    statusMap,
    isLoading: isLoading || isFetching,
  }
}
