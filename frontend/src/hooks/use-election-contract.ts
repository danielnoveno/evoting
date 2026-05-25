'use client'

import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import ElectionSpaceArtifact from '@/lib/abi/ElectionSpace.json'
import { readContract } from '@wagmi/core'
import { wagmiConfig } from '@/lib/wagmi'

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

  // Write functions
  const registerVotersBatch = (voters: string[]) => {
    if (!address) return
    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      functionName: 'registerVotersBatch',
      args: [voters],
      capabilities,
    })
  }

  const commitVote = (commitment: `0x${string}`) => {
    if (!address) return
    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      functionName: 'commitVote',
      args: [commitment],
      capabilities,
    })
  }

  const revealVote = (candidateId: number, salt: `0x${string}`) => {
    if (!address) return
    writeContract({
      address: address as `0x${string}`,
      abi: electionSpaceAbi,
      functionName: 'revealVote',
      args: [BigInt(candidateId), salt],
      capabilities,
    })
  }

  // Multi-read helper for results
  const getResults = async (candidateCount: number) => {
    if (!address) return []
    const results = []
    for (let i = 1; i <= candidateCount; i++) {
      const count = await readContract(wagmiConfig, {
        address: address as `0x${string}`,
        abi: electionSpaceAbi,
        functionName: 'voteCount',
        args: [BigInt(i)],
      })
      results.push({ candidateId: i, votes: Number(count) })
    }
    return results
  }

  return {
    // State
    currentPhase,
    hasCommittedOnChain,
    hasRevealedOnChain,
    
    // Actions
    registerVotersBatch,
    commitVote,
    revealVote,
    getResults,
    
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
    refetchHasRevealed
  }
}
