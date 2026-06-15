'use client'

import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { PAYMASTER_URL } from '@/lib/wagmi'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'

const electionSpaceAbi = ElectionSpaceArtifact.abi

export function useElectionContract(address?: string) {
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
  const { data: currentPhase, refetch: refetchPhase } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    functionName: 'currentPhase',
    query: {
      enabled: !!address,
    }
  })

  const { data: hasCommittedOnChain, refetch: refetchHasCommitted } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    functionName: 'hasCommitted',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!address && !!userAddress,
    }
  })

  const { data: hasRevealedOnChain, refetch: refetchHasRevealed } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    functionName: 'hasRevealed',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!address && !!userAddress,
    }
  })

  const { data: isWhitelistedOnChain, refetch: refetchIsWhitelisted } = useReadContract({
    address: address as `0x${string}`,
    abi: electionSpaceAbi,
    functionName: 'isWhitelisted',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!address && !!userAddress,
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
      functionName: 'registerVoters',
      args: [voters],
    })
  }

  const transitionToNextPhase = () => {
    if (!address) return
    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      functionName: 'transitionToNextPhase',
    })
  }

  return {
    // State
    currentPhase,
    hasCommittedOnChain,
    hasRevealedOnChain,
    isWhitelistedOnChain,
    
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
