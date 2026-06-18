'use client'

import { useCallback } from 'react'
import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { PAYMASTER_URL } from '@/lib/wagmi'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'

const electionSpaceAbi = ElectionSpaceArtifact.abi

type ElectionReadCheck = 'phase' | 'hasCommitted' | 'hasRevealed' | 'isWhitelisted'

type UseElectionContractOptions = {
  checks?: ElectionReadCheck[]
}

const DEFAULT_READ_QUERY_OPTIONS = {
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1500 * 2 ** attemptIndex, 8_000),
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: false,
} as const

export function useElectionContract(address?: string, options: UseElectionContractOptions = {}) {
  const { address: userAddress } = useAccount()
  const enabledChecks = new Set<ElectionReadCheck>(
    options.checks ?? ['phase', 'hasCommitted', 'hasRevealed', 'isWhitelisted']
  )

  const { 
    writeContract,
    writeContractAsync,
    data: hash, 
    isPending: isWritePending, 
    error: writeError,
    reset: resetWrite
  } = useWriteContract()
  const publicClient = usePublicClient({ chainId: baseSepolia.id })

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Read functions — include isFetching to detect stuck/loading state.
  // Prefer phase() because it accounts for the on-chain phase schedule.
  // Fall back to currentPhase() for older deployed ElectionSpace contracts
  // that do not expose phase().
  const {
    data: scheduledPhase,
    refetch: refetchScheduledPhase,
    error: scheduledPhaseError,
    isFetching: isScheduledPhaseFetching,
  } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'phase',
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && enabledChecks.has('phase'),
    }
  })

  const {
    data: storedPhase,
    refetch: refetchStoredPhase,
    error: storedPhaseError,
    isFetching: isStoredPhaseFetching,
  } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'currentPhase',
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && enabledChecks.has('phase'),
    }
  })

  const currentPhase = scheduledPhase ?? storedPhase
  const phaseError = scheduledPhase === undefined && storedPhase === undefined
    ? (scheduledPhaseError ?? storedPhaseError)
    : null
  const isPhaseFetching = currentPhase === undefined
    ? isScheduledPhaseFetching || isStoredPhaseFetching
    : false
  const refetchPhase = async () => {
    const [scheduledResult, storedResult] = await Promise.all([
      refetchScheduledPhase(),
      refetchStoredPhase(),
    ])
    return scheduledResult.data !== undefined ? scheduledResult : storedResult
  }

  const { data: commitStartsAt } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'commitStartsAt',
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && enabledChecks.has('phase'),
    }
  })

  const { data: revealStartsAt } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'revealStartsAt',
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && enabledChecks.has('phase'),
    }
  })

  const { data: hasCommittedOnChain, refetch: refetchHasCommitted, error: hasCommittedError, isFetching: isHasCommittedFetching } = useReadContract({
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

  const { data: hasRevealedOnChain, refetch: refetchHasRevealed, error: hasRevealedError, isFetching: isHasRevealedFetching } = useReadContract({
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

  const { data: isWhitelistedOnChain, refetch: refetchIsWhitelisted, error: whitelistError, isFetching: isWhitelistedFetching } = useReadContract({
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

  const registerVotersAsync = useCallback(async (targetAddress: string, voters: string[]) => {
    if (!targetAddress) throw new Error('Alamat kontrak pemilihan belum tersedia.')
    if (voters.length === 0) throw new Error('Daftar wallet whitelist kosong.')
    if (!publicClient) throw new Error('Koneksi Base Sepolia belum siap.')

    const txHash = await writeContractAsync({
      address: targetAddress as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'registerVoters',
      args: [voters],
    })
    await publicClient.waitForTransactionReceipt({ hash: txHash })
    return txHash
  }, [publicClient, writeContractAsync])

  const setPhaseScheduleAsync = useCallback(async (
    targetAddress: string,
    commitStartsAt: bigint,
    commitEndsAt: bigint,
    revealStartsAt: bigint,
    revealEndsAt: bigint,
  ) => {
    if (!targetAddress) throw new Error('Alamat kontrak pemilihan belum tersedia.')
    if (!publicClient) throw new Error('Koneksi Base Sepolia belum siap.')

    const txHash = await writeContractAsync({
      address: targetAddress as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'setPhaseSchedule',
      args: [commitStartsAt, commitEndsAt, revealStartsAt, revealEndsAt],
    })
    await publicClient.waitForTransactionReceipt({ hash: txHash })
    return txHash
  }, [publicClient, writeContractAsync])

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
    commitStartsAt,
    revealStartsAt,
    hasCommittedOnChain,
    hasRevealedOnChain,
    isWhitelistedOnChain,
    phaseError,
    hasCommittedError,
    hasRevealedError,
    whitelistError,
    isPhaseFetching,
    isHasCommittedFetching,
    isHasRevealedFetching,
    isWhitelistedFetching,
    
    // Actions
    commitVote,
    revealVote,
    registerVoters,
    registerVotersAsync,
    setPhaseScheduleAsync,
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
