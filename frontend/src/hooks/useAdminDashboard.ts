'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  AdminAuditLog,
  AdminPhase,
  AdminSpaceState,
  createAdminDemoState,
  getPhaseLabel,
  getNextPhase,
} from '@/lib/admin-demo-data'

function generateTxHash(): `0x${string}` {
  const charset = 'abcdef0123456789'
  let body = ''

  for (let index = 0; index < 64; index += 1) {
    body += charset[Math.floor(Math.random() * charset.length)]
  }

  return `0x${body}`
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function createLocalBlockLabel(): string {
  const base = 14800000
  const random = Math.floor(Math.random() * 9000)
  return Intl.NumberFormat('id-ID').format(base + random)
}

export function useAdminDashboard(spaceId: string) {
  const [spaceState, setSpaceState] = useState<AdminSpaceState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await delay(600)
      setSpaceState(createAdminDemoState(spaceId))
    } catch {
      setError('Tidak dapat memuat data admin. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }, [spaceId])

  useEffect(() => {
    void load()
  }, [load])

  const participationRate = useMemo(() => {
    if (!spaceState || spaceState.registeredCount === 0) return 0
    return (spaceState.committedCount / spaceState.registeredCount) * 100
  }, [spaceState])

  const appendAuditLog = useCallback(
    (payload: Omit<AdminAuditLog, 'id' | 'timeLabel'>) => {
      setSpaceState((previous) => {
        if (!previous) return previous

        const now = new Date()
        const nextEntry: AdminAuditLog = {
          id: `${spaceId}-log-${now.getTime()}`,
          timeLabel: now.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          ...payload,
        }

        return {
          ...previous,
          auditLogs: [nextEntry, ...previous.auditLogs].slice(0, 20),
        }
      })
    },
    [spaceId],
  )

  const transitionPhase = async (): Promise<`0x${string}`> => {
    if (!spaceState) {
      throw new Error('Data space belum siap.')
    }

    const nextPhase = getNextPhase(spaceState.phase)
    if (!nextPhase) {
      throw new Error('WrongPhase')
    }

    await delay(900)
    const txHash = generateTxHash()

    setSpaceState((previous) => {
      if (!previous) return previous

      return {
        ...previous,
        phase: nextPhase,
      }
    })

    appendAuditLog({
      actorLabel: 'Admin',
      blockLabel: createLocalBlockLabel(),
      eventLabel: `Transisi fase ke ${getPhaseLabel(nextPhase)}`,
      status: 'confirmed',
      txHash,
    })

    return txHash
  }

  const addVoter = async (address: `0x${string}`): Promise<`0x${string}`> => {
    if (!spaceState) {
      throw new Error('Data space belum siap.')
    }

    if (spaceState.phase !== 'registration') {
      throw new Error('WrongPhase')
    }

    const exists = spaceState.voters.some(
      (voter) => voter.address.toLowerCase() === address.toLowerCase(),
    )
    if (exists) {
      throw new Error('AlreadyRegistered')
    }

    await delay(700)
    const txHash = generateTxHash()

    setSpaceState((previous) => {
      if (!previous) return previous

      return {
        ...previous,
        registeredCount: previous.registeredCount + 1,
        voters: [
          {
            address,
            status: 'pending',
            addedAt: 'Baru saja',
          },
          ...previous.voters,
        ],
      }
    })

    appendAuditLog({
      actorLabel: 'Admin',
      blockLabel: createLocalBlockLabel(),
      eventLabel: 'Whitelist diperbarui (tambah pemilih)',
      status: 'confirmed',
      txHash,
    })

    return txHash
  }

  const removeVoter = async (address: `0x${string}`): Promise<`0x${string}`> => {
    if (!spaceState) {
      throw new Error('Data space belum siap.')
    }

    if (spaceState.phase !== 'registration') {
      throw new Error('WrongPhase')
    }

    await delay(600)
    const txHash = generateTxHash()

    setSpaceState((previous) => {
      if (!previous) return previous

      const nextVoters = previous.voters.filter(
        (voter) => voter.address.toLowerCase() !== address.toLowerCase(),
      )

      return {
        ...previous,
        registeredCount:
          previous.registeredCount > 0 ? previous.registeredCount - 1 : 0,
        voters: nextVoters,
      }
    })

    appendAuditLog({
      actorLabel: 'Admin',
      blockLabel: createLocalBlockLabel(),
      eventLabel: 'Whitelist diperbarui (hapus pemilih)',
      status: 'confirmed',
      txHash,
    })

    return txHash
  }

  const addCandidate = async (
    payload: Omit<AdminSpaceState['candidates'][number], 'id' | 'votes'>,
  ): Promise<`0x${string}`> => {
    if (!spaceState) {
      throw new Error('Data space belum siap.')
    }

    if (!spaceState.candidateMutableOnChain) {
      throw new Error(
        'Fitur kandidat dikunci setelah deploy pada versi kontrak saat ini.',
      )
    }

    if (spaceState.phase !== 'registration') {
      throw new Error('WrongPhase')
    }

    await delay(650)
    const txHash = generateTxHash()

    setSpaceState((previous) => {
      if (!previous) return previous
      const highestId = previous.candidates.reduce(
        (maxId, candidate) => Math.max(maxId, candidate.id),
        0,
      )

      return {
        ...previous,
        candidates: [
          ...previous.candidates,
          {
            id: highestId + 1,
            ...payload,
            votes: 0,
          },
        ],
      }
    })

    appendAuditLog({
      actorLabel: 'Admin',
      blockLabel: createLocalBlockLabel(),
      eventLabel: 'Kandidat ditambahkan',
      status: 'confirmed',
      txHash,
    })

    return txHash
  }

  const removeCandidate = async (candidateId: number): Promise<`0x${string}`> => {
    if (!spaceState) {
      throw new Error('Data space belum siap.')
    }

    if (!spaceState.candidateMutableOnChain) {
      throw new Error(
        'Fitur kandidat dikunci setelah deploy pada versi kontrak saat ini.',
      )
    }

    if (spaceState.phase !== 'registration') {
      throw new Error('WrongPhase')
    }

    await delay(500)
    const txHash = generateTxHash()

    setSpaceState((previous) => {
      if (!previous) return previous

      return {
        ...previous,
        candidates: previous.candidates.filter(
          (candidate) => candidate.id !== candidateId,
        ),
      }
    })

    appendAuditLog({
      actorLabel: 'Admin',
      blockLabel: createLocalBlockLabel(),
      eventLabel: 'Kandidat dihapus',
      status: 'confirmed',
      txHash,
    })

    return txHash
  }

  return {
    addCandidate,
    addVoter,
    error,
    auditLogs: spaceState?.auditLogs ?? [],
    load,
    loading,
    participationRate,
    removeCandidate,
    removeVoter,
    spaceState,
    transitionPhase,
  }
}
