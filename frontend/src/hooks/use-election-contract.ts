'use client'

import { useCallback } from 'react'
import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount, usePublicClient, useSendCalls, useCallsStatus } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { encodeFunctionData } from 'viem'
import { PAYMASTER_URL } from '@/lib/wagmi'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'
import { getWalletTransactionErrorMessage, isAmbiguousTransactionError, isInjectedConnector, isSuccessfulTransactionReceipt, resolveWalletTransactionSupport } from '@/lib/wallet-transaction-support'
import { useAccountScopedCapabilities } from '@/hooks/use-account-scoped-capabilities'

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
  const { address: wagmiAddress, chainId: activeChainId, connector } = useAccount()
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
  const {
    sendCalls,
    data: callsData,
    isPending: isSendCallsPending,
    error: sendCallsError,
    reset: resetSendCalls,
  } = useSendCalls()
  const accountCapabilities = useAccountScopedCapabilities(baseSepolia.id)
  const publicClient = usePublicClient({ chainId: baseSepolia.id })
  const callsStatusQuery = useCallsStatus({
    id: callsData?.id ?? '',
    query: {
      enabled: Boolean(callsData?.id),
      refetchInterval: (query) => query.state.data?.status === 'pending' ? 1500 : false,
    },
  })
  const callsReceipt = callsStatusQuery.data?.receipts?.[0]
  const callsTxHash = callsReceipt?.transactionHash
  const transactionSupport = resolveWalletTransactionSupport({
    account: wagmiAddress,
    chainId: activeChainId,
    connector,
    capabilities: accountCapabilities.capabilities,
    capabilitiesPending: Boolean(wagmiAddress && connector && activeChainId === baseSepolia.id && !isInjectedConnector(connector) && accountCapabilities.pending),
  })

  const { 
    isLoading: isConfirming, 
    data: receipt,
    error: receiptError,
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

  // ponytail: immutable reads untuk verifikasi Basescan
  const { data: registryAddress } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'registry',
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address,
    }
  })

  const { data: spaceAdminAddress } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'spaceAdmin',
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address,
    }
  })

  const { data: onChainSpaceId } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'spaceId',
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address,
    }
  })

  const { data: onChainCandidateCount } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    chainId: baseSepolia.id,
    functionName: 'candidateCount',
    query: {
      ...DEFAULT_READ_QUERY_OPTIONS,
      enabled: !!address,
    }
  })

  const callsReceipts = callsStatusQuery.data?.receipts ?? []
  const isCallsReceiptSuccessful = callsStatusQuery.data?.status === 'success'
    && callsReceipts.length > 0
    && callsReceipts.every(isSuccessfulTransactionReceipt)
  const callsFailureError = callsStatusQuery.data?.status === 'failure'
    ? new Error('Status panggilan gagal. Transaksi tidak berhasil diproses.')
    : callsStatusQuery.data?.status === 'success' && !isCallsReceiptSuccessful
      ? new Error('Bukti transaksi berhasil tidak tersedia dari dompet.')
      : null
  const receiptFailureError = receipt && !isSuccessfulTransactionReceipt(receipt)
    ? new Error('Receipt transaksi gagal atau reverted.')
    : null
  const isReceiptSuccessful = isSuccessfulTransactionReceipt(receipt)
  const transactionError = writeError ?? receiptError ?? sendCallsError ?? callsStatusQuery.error ?? receiptFailureError ?? callsFailureError
  const hasAmbiguousSubmission = isAmbiguousTransactionError(transactionError)
  const transactionSupportError = hasAmbiguousSubmission
    ? getWalletTransactionErrorMessage(transactionError)
    : transactionSupport.message

  // Write functions
  const commitVote = (commitment: `0x${string}`) => {
    if (!address || !transactionSupport.canTransact || hasAmbiguousSubmission) return
    
    // Menyiapkan capabilities untuk Paymaster (Gasless)
    const capabilities = PAYMASTER_URL ? {
      paymasterService: {
        url: PAYMASTER_URL
      }
    } : undefined;

    if (transactionSupport.mode === 'send-calls' && wagmiAddress) {
      sendCalls({
        account: wagmiAddress,
        chainId: baseSepolia.id,
        calls: [{
          to: address as `0x${string}`,
          data: encodeFunctionData({ abi: electionSpaceAbi, functionName: 'commitVote', args: [commitment] }),
        }],
        capabilities: transactionSupport.supportsPaymaster ? capabilities : undefined,
      })
      return
    }

    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'commitVote',
      args: [commitment],
    })
  }

  const revealVote = (candidateId: number, salt: `0x${string}`) => {
    if (!address || !transactionSupport.canTransact || hasAmbiguousSubmission) return

    const capabilities = PAYMASTER_URL ? {
      paymasterService: {
        url: PAYMASTER_URL
      }
    } : undefined;

    if (transactionSupport.mode === 'send-calls' && wagmiAddress) {
      sendCalls({
        account: wagmiAddress,
        chainId: baseSepolia.id,
        calls: [{
          to: address as `0x${string}`,
          data: encodeFunctionData({ abi: electionSpaceAbi, functionName: 'revealVote', args: [BigInt(candidateId), salt] }),
        }],
        capabilities: transactionSupport.supportsPaymaster ? capabilities : undefined,
      })
      return
    }

    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      chainId: baseSepolia.id,
      functionName: 'revealVote',
      args: [BigInt(candidateId), salt],
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
    const confirmedReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (!isSuccessfulTransactionReceipt(confirmedReceipt)) throw new Error('Receipt transaksi gagal atau reverted.')
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
    const confirmedReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (!isSuccessfulTransactionReceipt(confirmedReceipt)) throw new Error('Receipt transaksi gagal atau reverted.')
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
    const confirmedReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
    if (!isSuccessfulTransactionReceipt(confirmedReceipt)) throw new Error('Receipt transaksi gagal atau reverted.')
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
    // ponytail: immutable reads untuk verifikasi Basescan
    registryAddress: registryAddress as `0x${string}` | undefined,
    spaceAdminAddress: spaceAdminAddress as `0x${string}` | undefined,
    onChainSpaceId: onChainSpaceId !== undefined ? Number(onChainSpaceId) : undefined,
    onChainCandidateCount: onChainCandidateCount !== undefined ? Number(onChainCandidateCount) : undefined,
    
    // Actions
    commitVote,
    revealVote,
    registerVoters,
    registerVotersAsync,
    unregisterVoterAsync,
    setPhaseScheduleAsync,
    transitionToNextPhase,
    
    // TX Status
    hash: hash ?? callsTxHash,
    isWritePending: isWritePending || isSendCallsPending,
    isConfirming: isConfirming || callsStatusQuery.data?.status === 'pending',
    isConfirmed: isReceiptSuccessful || isCallsReceiptSuccessful,
    writeError: transactionError,
    transactionSupport,
    transactionSupportError,
    canSubmitTransaction: transactionSupport.canTransact && !hasAmbiguousSubmission,
    isTransactionSupportLoading: transactionSupport.mode === 'checking',
    hasAmbiguousSubmission,
    receipt: receipt ?? (callsReceipt ? {
      transactionHash: callsReceipt.transactionHash,
      blockNumber: callsReceipt.blockNumber,
      gasUsed: callsReceipt.gasUsed,
      effectiveGasPrice: undefined,
      status: callsReceipt.status,
    } : undefined),
    
    // Utils
    resetWrite: () => {
      resetWrite()
      resetSendCalls()
    },
    refetchPhase,
    refetchHasCommitted,
    refetchHasRevealed,
    refetchIsWhitelisted
  }
}
