'use client'

import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { PAYMASTER_URL } from '@/lib/wagmi'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'

const electionSpaceAbi = ElectionSpaceArtifact.abi

type ElectionReadCheck = 'phase' | 'hasCommitted' | 'hasRevealed' | 'isWhitelisted'

type UseElectionContractOptions = {
  checks?: ElectionReadCheck[]
}

const DEFAULT_READ_QUERY_OPTIONS = {
  retry: 1,
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
} as const

export function useElectionContract(address?: string, options: UseElectionContractOptions = {}) {
  const { address: userAddress } = useAccount()
  const enabledChecks = new Set<ElectionReadCheck>(
    options.checks ?? ['phase', 'hasCommitted', 'hasRevealed', 'isWhitelisted']
  )

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
  const { data: currentPhase, refetch: refetchPhase, error: phaseError } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'currentPhase',
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && enabledChecks.has('phase'),
    }
  })

  const { data: hasCommittedOnChain, refetch: refetchHasCommitted, error: hasCommittedError } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'hasCommitted',
    args: userAddress ? [userAddress] : undefined,
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && !!userAddress && enabledChecks.has('hasCommitted'),
    }
  })

  const { data: hasRevealedOnChain, refetch: refetchHasRevealed, error: hasRevealedError } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'hasRevealed',
    args: userAddress ? [userAddress] : undefined,
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && !!userAddress && enabledChecks.has('hasRevealed'),
    }
  })

  const { data: isWhitelistedOnChain, refetch: refetchIsWhitelisted, error: whitelistError } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'isWhitelisted',
    args: userAddress ? [userAddress] : undefined,
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && !!userAddress && enabledChecks.has('isWhitelisted'),
    }
  })

  // Write functions
  const commitVote = (commitment: `0x${string}`) => {
    if (!address) return
    
    // Menyiapkan capabilities untuk Paymaster (Gasless)
    const capabilities = PAYMASTER_URL ? {
      paymasterService: {
        url: PAYMASTER_URL
      }
    } : undefined;

    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'commitVote',
      args: [commitment],
      // @ts-ignore - capabilities adalah fitur baru wagmi/viem untuk EIP-5792
      capabilities,
    })
  }

  const revealVote = (candidateId: number, salt: `0x${string}`) => {
    if (!address) return

    const capabilities = PAYMASTER_URL ? {
      paymasterService: {
        url: PAYMASTER_URL
      }
    } : undefined;

    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'revealVote',
      args: [BigInt(candidateId), salt],
      // @ts-ignore
      capabilities,
    })
  }

  const registerVoters = (voters: string[]) => {
    if (!address) return
    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'registerVoters',
      args: [voters],
    })
  }

  const transitionToNextPhase = () => {
    if (!address) return
    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'transitionToNextPhase',
    })
  }

  return {
    // State
    currentPhase,
    hasCommittedOnChain,
    hasRevealedOnChain,
    isWhitelistedOnChain,
    phaseError,
    hasCommittedError,
    hasRevealedError,
    whitelistError,
    
    // Actions
    commitVote,
    revealVote,
    registerVoters,
    transitionToNextPhase,
    
    // TX Status
    hash,
    isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    receipt,
    
    // Utils
    resetWrite,
    refetchPhase,
    refetchHasCommitted,
    refetchHasRevealed,
    refetchIsWhitelisted
  }
}
