'use client'

/**
 * use-server-wallet.ts
 *
 * Hook untuk mengakses wallet yang di-derive secara deterministic di server.
 * Menggantikan koneksi wallet MetaMask/Base Account yang terblokir ISP.
 *
 * Flow:
 * 1. User login via Supabase Auth
 * 2. Hook fetch wallet address dari /api/wallet/derive-address
 * 3. Hook provide function untuk sign commit/reveal via server
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuthSession } from './use-auth-session'

export type ServerWalletState = {
  /** Wallet address yang di-derive dari user_id */
  address: string | null
  /** Loading state saat fetch address */
  isLoading: boolean
  /** Error message */
  error: string | null
  /** Apakah wallet sudah siap digunakan */
  isReady: boolean
}

export type ServerWalletReturn = ServerWalletState & {
  /** Auth session sedang dimuat (belum bisa tentukan login/tidak) */
  isAuthLoading: boolean
  /** Auth session sudah selesai dimuat tapi tidak ada session (belum login) */
  isAuthMissing: boolean
}

export type CommitResult = {
  txHash: string
  blockNumber: number
  gasUsed: number
  relayerAddress: string
  salt: string
  commitment: string
  voterAddress: string
  candidateId: number
}

export type RevealResult = {
  txHash: string
  blockNumber: number
  gasUsed: number
  relayerAddress: string
}

/**
 * Hook untuk mengakses server-side wallet.
 *
 * @example
 * ```tsx
 * const { address, isLoading, isReady, commitVote, revealVote } = useServerWallet()
 *
 * // Saat commit:
 * const result = await commitVote(candidateId, contractAddress)
 * // result.salt dan result.commitment disimpan ke localStorage
 *
 * // Saat reveal:
 * const result = await revealVote(candidateId, salt, contractAddress)
 * ```
 */
export function useServerWallet() {
  const authSessionQuery = useAuthSession()
  const session = authSessionQuery.data
  const [state, setState] = useState<ServerWalletState>({
    address: null,
    isLoading: false,
    error: null,
    isReady: false,
  })

  const [commitState, setCommitState] = useState<{
    isPending: boolean
    isSubmitting: boolean
    isConfirmed: boolean
    isFailed: boolean
    commitResult: CommitResult | null
    commitError: string | null
  }>({
    isPending: false,
    isSubmitting: false,
    isConfirmed: false,
    isFailed: false,
    commitResult: null,
    commitError: null,
  })

  const [revealState, setRevealState] = useState<{
    isSubmitting: boolean
    isConfirmed: boolean
    isFailed: boolean
    revealResult: RevealResult | null
    revealError: string | null
  }>({
    isSubmitting: false,
    isConfirmed: false,
    isFailed: false,
    revealResult: null,
    revealError: null,
  })

  // Track auth query status for consumers
  const isAuthLoading = authSessionQuery.status === 'pending'
  const isAuthMissing = authSessionQuery.status === 'success' && !session?.access_token

  // Fetch wallet address saat session tersedia
  const fetchAddress = useCallback(async () => {
    if (!session?.access_token) {
      setState(prev => ({
        ...prev,
        address: null,
        isLoading: false,
        error: null,
        isReady: false,
      }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/wallet/derive-address', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Gagal membuat ID voting.')
      }

      setState({
        address: payload.address,
        isLoading: false,
        error: null,
        isReady: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat ID voting.'
      setState({
        address: null,
        isLoading: false,
        error: message,
        isReady: false,
      })
    }
  }, [session?.access_token])

  // Fetch address saat session berubah
  useEffect(() => {
    fetchAddress()
  }, [fetchAddress])

  // Reset commit state
  const resetCommit = useCallback(() => {
    setCommitState({
      isPending: false,
      isSubmitting: false,
      isConfirmed: false,
      isFailed: false,
      commitResult: null,
      commitError: null,
    })
  }, [])

  // Reset reveal state
  const resetReveal = useCallback(() => {
    setRevealState({
      isSubmitting: false,
      isConfirmed: false,
      isFailed: false,
      revealResult: null,
      revealError: null,
    })
  }, [])

  /**
   * Submit commit vote via server-side signing.
   *
   * @param candidateId - ID kandidat (1-based)
   * @param contractAddress - Alamat ElectionSpace contract
   * @returns CommitResult dengan salt dan commitment untuk localStorage
   */
  const commitVote = useCallback(
    async (candidateId: number, contractAddress: string): Promise<CommitResult | null> => {
      if (!session?.access_token) {
        setCommitState(prev => ({
          ...prev,
          isFailed: true,
          commitError: 'Sesi tidak tersedia. Silakan masuk kembali.',
        }))
        return null
      }

      resetCommit()
      setCommitState(prev => ({ ...prev, isPending: true }))

      try {
        // isPending = true, menunggu server sign
        setCommitState(prev => ({ ...prev, isPending: true, isSubmitting: false }))

        const response = await fetch('/api/wallet/sign-commit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ candidateId, contractAddress }),
        })

        setCommitState(prev => ({ ...prev, isPending: false, isSubmitting: true }))

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Gagal memproses commit.')
        }

        const result: CommitResult = {
          txHash: payload.txHash,
          blockNumber: payload.blockNumber,
          gasUsed: payload.gasUsed,
          relayerAddress: payload.relayerAddress,
          salt: payload.salt,
          commitment: payload.commitment,
          voterAddress: payload.voterAddress,
          candidateId: payload.candidateId,
        }

        setCommitState({
          isPending: false,
          isSubmitting: false,
          isConfirmed: true,
          isFailed: false,
          commitResult: result,
          commitError: null,
        })

        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memproses commit.'
        setCommitState(prev => ({
          isPending: false,
          isSubmitting: false,
          isConfirmed: false,
          isFailed: true,
          commitResult: null,
          commitError: message,
        }))
        return null
      }
    },
    [session?.access_token, resetCommit],
  )

  /**
   * Submit reveal vote via server-side signing.
   *
   * @param candidateId - ID kandidat (1-based)
   * @param salt - Salt hex yang digunakan saat commit
   * @param contractAddress - Alamat ElectionSpace contract
   */
  const revealVote = useCallback(
    async (
      candidateId: number,
      salt: string,
      contractAddress: string,
    ): Promise<RevealResult | null> => {
      if (!session?.access_token) {
        setRevealState(prev => ({
          ...prev,
          isFailed: true,
          revealError: 'Sesi tidak tersedia. Silakan masuk kembali.',
        }))
        return null
      }

      resetReveal()
      setRevealState(prev => ({ ...prev, isSubmitting: true }))

      try {
        const response = await fetch('/api/wallet/sign-reveal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ candidateId, salt, contractAddress }),
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Gagal memproses reveal.')
        }

        const result: RevealResult = {
          txHash: payload.txHash,
          blockNumber: payload.blockNumber,
          gasUsed: payload.gasUsed,
          relayerAddress: payload.relayerAddress,
        }

        setRevealState({
          isSubmitting: false,
          isConfirmed: true,
          isFailed: false,
          revealResult: result,
          revealError: null,
        })

        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memproses reveal.'
        setRevealState(prev => ({
          isSubmitting: false,
          isConfirmed: false,
          isFailed: true,
          revealResult: null,
          revealError: message,
        }))
        return null
      }
    },
    [session?.access_token, resetReveal],
  )

  return {
    // Wallet state (override auth flags with computed values for accuracy)
    ...state,
    isAuthLoading,
    isAuthMissing,
    // Commit state & function
    ...commitState,
    commitVote,
    resetCommit,
    // Reveal state & function
    ...revealState,
    revealVote,
    resetReveal,
    // Utility
    refetch: fetchAddress,
  }
}
