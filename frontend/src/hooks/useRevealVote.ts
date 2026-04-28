'use client'

import { useEffect } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { EVOTING_ABI } from '@/lib/abi'
import { clearVoteData, loadVoteData } from '@/lib/commitment'

export function useRevealVote(spaceId: string, contractAddress: `0x${string}`) {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const reveal = async () => {
    const voteData = loadVoteData(spaceId)
    if (!voteData) {
      throw new Error('Salt tidak ditemukan. Buka dari browser yang sama saat commit.')
    }

    await writeContractAsync({
      address: contractAddress,
      abi: EVOTING_ABI,
      functionName: 'revealVote',
      args: [BigInt(voteData.candidateId), voteData.salt],
    })
  }

  useEffect(() => {
    if (isSuccess) clearVoteData(spaceId)
  }, [isSuccess, spaceId])

  return { reveal, hash, isPending, isConfirming, isSuccess }
}
