'use client'

import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { EVOTING_ABI } from '@/lib/abi'
import { generateCommitment, generateSalt, saveVoteData } from '@/lib/commitment'

export function useCommitVote(spaceId: string, contractAddress: `0x${string}`) {
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const commit = async (candidateId: number) => {
    const salt = generateSalt()
    const commitment = generateCommitment(BigInt(candidateId), salt)

    // Simpan data lokal sebelum kirim transaksi.
    saveVoteData(spaceId, candidateId, salt)

    await writeContractAsync({
      address: contractAddress,
      abi: EVOTING_ABI,
      functionName: 'commitVote',
      args: [commitment],
    })
  }

  return { commit, hash, isPending, isConfirming, isSuccess }
}
