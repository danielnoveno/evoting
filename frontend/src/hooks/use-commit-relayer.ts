'use client'

import { useState, useCallback } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { signMessage } from 'viem/actions'

export type CommitRelayerResult = {
  txHash: string
  blockNumber: number
  gasUsed: number
  relayerAddress: string
}

export type CommitRelayerState = {
  isPending: boolean  // waiting for wallet signature
  isSubmitting: boolean  // relayer is submitting
  isConfirmed: boolean
  isFailed: boolean
  result: CommitRelayerResult | null
  error: string | null
}

/**
 * Hook to submit a commit vote through the relayer API.
 *
 * Flow:
 * 1. Voter signs a message proving intent to commit
 * 2. Frontend sends { voter, commitment, contractAddress, signature } to relayer
 * 3. Relayer calls commitFor() on-chain via EOA
 * 4. Transaction appears in Basescan's "Transactions" tab for the contract
 */
export function useCommitRelayer() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [state, setState] = useState<CommitRelayerState>({
    isPending: false,
    isSubmitting: false,
    isConfirmed: false,
    isFailed: false,
    result: null,
    error: null,
  })

  const reset = useCallback(() => {
    setState({
      isPending: false,
      isSubmitting: false,
      isConfirmed: false,
      isFailed: false,
      result: null,
      error: null,
    })
  }, [])

  const submitCommit = useCallback(async (params: {
    commitment: `0x${string}`
    contractAddress: string
  }) => {
    if (!address || !walletClient) {
      setState(prev => ({ ...prev, error: 'Dompet belum tersambung.', isFailed: true }))
      return
    }

    const { commitment, contractAddress } = params
    reset()

    try {
      // Step 1: Sign message to prove voter intent
      setState(prev => ({ ...prev, isPending: true }))
      const message = `VoteChain commit: ${commitment} for ${contractAddress}`
      const signature = await signMessage(walletClient, { message })

      // Step 2: Send to relayer
      setState(prev => ({ ...prev, isPending: false, isSubmitting: true }))
      const response = await fetch('/api/relayer/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voter: address,
          commitment,
          contractAddress,
          signature,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        const errorMsg = payload?.error || 'Relayer gagal memproses commit.'
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          isFailed: true,
          error: errorMsg,
        }))
        return
      }

      // Step 3: Success
      setState({
        isPending: false,
        isSubmitting: false,
        isConfirmed: true,
        isFailed: false,
        result: {
          txHash: payload.txHash,
          blockNumber: payload.blockNumber,
          gasUsed: payload.gasUsed,
          relayerAddress: payload.relayerAddress,
        },
        error: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.'
      setState(prev => ({
        ...prev,
        isPending: false,
        isSubmitting: false,
        isFailed: true,
        error: message.includes('User rejected') || message.includes('user denied')
          ? 'Anda membatalkan persetujuan tanda tangan.'
          : `Gagal mengirim ke relayer: ${message}`,
      }))
    }
  }, [address, walletClient, reset])

  return {
    ...state,
    submitCommit,
    reset,
  }
}
