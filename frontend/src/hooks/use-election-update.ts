'use client'

import { useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi'
import { readContract } from '@wagmi/core'
import { useToast } from '@/components/ui/toast-provider'
import RegistryArtifact from '@/lib/abi/VoteChainRegistry.json'
import { REGISTRY_ADDRESS } from './use-registry-contract'

const REGISTRY_ABI = RegistryArtifact.abi as any
const REGISTRY_ADDR = REGISTRY_ADDRESS as `0x${string}`

export function useElectionUpdate() {
  const config = useConfig()
  const { showToast } = useToast()
  
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
    status: txStatus
  } = useWaitForTransactionReceipt({
    hash,
  })

  /**
   * Mengajukan perubahan metadata untuk ruang pemilihan tertentu.
   * Hanya bisa dilakukan oleh Admin Platform atau Super Admin.
   */
  const proposeUpdate = async (spaceId: bigint, title: string, metadataURI: string) => {
    try {
      writeContract({
        address: REGISTRY_ADDR,
        abi: REGISTRY_ABI,
        functionName: 'proposeSpaceUpdate',
        args: [spaceId, title, metadataURI],
      })
      showToast({ title: 'Menunggu konfirmasi dompet...', tone: 'info' })
    } catch (err) {
      console.error('Error proposing update:', err)
      showToast({ title: 'Gagal mengajukan perubahan', tone: 'error' })
    }
  }

  /**
   * Meninjau pengajuan perubahan (Approve/Reject).
   * Hanya bisa dilakukan oleh Super Admin.
   */
  const reviewUpdate = async (changeId: bigint, approve: boolean) => {
    try {
      writeContract({
        address: REGISTRY_ADDR,
        abi: REGISTRY_ABI,
        functionName: 'reviewSpaceUpdate',
        args: [changeId, approve],
      })
      showToast({ 
        title: approve ? 'Menyetujui perubahan...' : 'Menolak perubahan...', 
        tone: 'info' 
      })
    } catch (err) {
      console.error('Error reviewing update:', err)
      showToast({ title: 'Gagal meninjau perubahan', tone: 'error' })
    }
  }

  /**
   * Mengambil data Change Proposal berdasarkan ID secara manual (on-demand).
   */
  const getChangeProposal = async (changeId: bigint) => {
    try {
      const data = await readContract(config, {
        address: REGISTRY_ADDR,
        abi: REGISTRY_ABI,
        functionName: 'changeProposals',
        args: [changeId],
      })
      return data
    } catch (err) {
      console.error('Error fetching change proposal:', err)
      return null
    }
  }

  return {
    // Actions
    proposeUpdate,
    reviewUpdate,
    getChangeProposal,
    
    // Status
    hash,
    isWritePending, // Wallet sedang terbuka
    isConfirming,   // Sedang diproses di blockchain
    isConfirmed,    // Sukses
    txStatus,
    writeError,
    
    // Utils
    resetWrite
  }
}
