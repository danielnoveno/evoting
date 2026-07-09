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
  /** Override wallet address for on-chain checks. Falls back to the connected wallet address. */
  voterAddress?: `0x${string}` | string | null
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
  const { address: wagmiAddress } = useAccount()
  const voterAddress = options.voterAddress || wagmiAddress || undefined
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

  const { data: commitEndsAt } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'commitEndsAt',
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

  const { data: revealEndsAt } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'revealEndsAt',
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
    args: voterAddress ? [voterAddress as `0x${string}`] : undefined,
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && !!voterAddress && enabledChecks.has('hasCommitted'),
    }
  })

  const { data: hasRevealedOnChain, refetch: refetchHasRevealed, error: hasRevealedError, isFetching: isHasRevealedFetching } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'hasRevealed',
    args: voterAddress ? [voterAddress as `0x${string}`] : undefined,
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && !!voterAddress && enabledChecks.has('hasRevealed'),
    }
  })

  const { data: isWhitelistedOnChain, refetch: refetchIsWhitelisted, error: whitelistError, isFetching: isWhitelistedFetching } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'isWhitelisted',
    args: voterAddress ? [voterAddress as `0x${string}`] : undefined,
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address && !!voterAddress && enabledChecks.has('isWhitelisted'),
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
    const capabilities = PAYMASTER_URL ? { paymasterService: { url: PAYMASTER_URL } } : undefined;
    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'registerVoters',
      args: [voters],
      // @ts-ignore - capabilities EIP-5792
      capabilities,
    })
  }

  const registerVotersAsync = useCallback(async (targetAddress: string, voters: string[]) => {
    if (!targetAddress) throw new Error('Alamat kontrak pemilihan belum tersedia.')
    if (voters.length === 0) throw new Error('Daftar wallet whitelist kosong.')
    if (!publicClient) throw new Error('Koneksi Base Sepolia belum siap.')

    const capabilities = PAYMASTER_URL ? { paymasterService: { url: PAYMASTER_URL } } : undefined;
    const txHash = await writeContractAsync({
      address: targetAddress as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'registerVoters',
      args: [voters],
      // @ts-ignore - capabilities EIP-5792
      capabilities,
    })
    await publicClient.waitForTransactionReceipt({ hash: txHash })
    return txHash
  }, [publicClient, writeContractAsync])

  const unregisterVoterAsync = useCallback(async (targetAddress: string, voter: string) => {
    if (!targetAddress) throw new Error('Alamat kontrak pemilihan belum tersedia.')
    if (!/^0x[a-fA-F0-9]{40}$/.test(voter)) throw new Error('Alamat wallet pemilih tidak valid.')
    if (!publicClient) throw new Error('Koneksi Base Sepolia belum siap.')

    const capabilities = PAYMASTER_URL ? { paymasterService: { url: PAYMASTER_URL } } : undefined;
    const txHash = await writeContractAsync({
      address: targetAddress as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'unregisterVoter',
      args: [voter as `0x${string}`],
      // @ts-ignore - capabilities EIP-5792
      capabilities,
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

    const capabilities = PAYMASTER_URL ? { paymasterService: { url: PAYMASTER_URL } } : undefined;
    const txHash = await writeContractAsync({
      address: targetAddress as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'setPhaseSchedule',
      args: [commitStartsAt, commitEndsAt, revealStartsAt, revealEndsAt],
      // @ts-ignore - capabilities EIP-5792
      capabilities,
    })
    await publicClient.waitForTransactionReceipt({ hash: txHash })
    return txHash
  }, [publicClient, writeContractAsync])

  const transitionToNextPhase = () => {
    if (!address) return
    const capabilities = PAYMASTER_URL ? { paymasterService: { url: PAYMASTER_URL } } : undefined;
    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'transitionToNextPhase',
      // @ts-ignore - capabilities EIP-5792
      capabilities,
    })
  }

  return {
    // State
    currentPhase,
    commitStartsAt,
    commitEndsAt,
    revealStartsAt,
    revealEndsAt,
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
    unregisterVoterAsync,
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
