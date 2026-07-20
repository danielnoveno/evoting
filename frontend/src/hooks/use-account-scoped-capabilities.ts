'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAccount, useCapabilities } from 'wagmi'

const SECRET_KEY = /(authorization|credential|password|secret|signature|token|url)/i

function sanitizeDiagnosticValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeDiagnosticValue)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
    key,
    SECRET_KEY.test(key) ? '[disembunyikan]' : sanitizeDiagnosticValue(nested),
  ]))
}

export function getProviderErrorCode(error: unknown): string | null {
  let current = error
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
    if ('code' in current && (typeof current.code === 'string' || typeof current.code === 'number')) {
      return String(current.code)
    }
    current = 'cause' in current ? current.cause : null
  }
  return null
}

function getSafeErrorMessage(error: unknown): string | null {
  const message = error instanceof Error ? error.message : null
  if (!message) return null
  return message
    .replace(/(bearer\s+)[^\s]+/gi, '$1[disembunyikan]')
    .replace(/([?&](?:api_?key|key|secret|token)=)[^&\s]+/gi, '$1[disembunyikan]')
}

export function useAccountScopedCapabilities(chainId: number) {
  const { address, connector } = useAccount()
  const queryClient = useQueryClient()
  const account = address?.toLowerCase()
  const identity = account && connector
    ? `${connector.uid}:${account}:${chainId}`
    : null
  const previousAccount = useRef<string | undefined>()
  const [blockedAccount, setBlockedAccount] = useState<string | null>(null)
  const enabled = Boolean(address && connector)

  const query = useCapabilities({
    account: address,
    chainId,
    connector,
    scopeKey: identity ?? 'disconnected',
    query: {
      enabled,
      gcTime: 0,
      refetchOnMount: 'always',
      retry: false,
      staleTime: 0,
    },
  })

  useEffect(() => {
    if (previousAccount.current === account) return
    if (previousAccount.current && account) setBlockedAccount(account)
    if (!account) setBlockedAccount(null)
    previousAccount.current = account

    // Capabilities are account-specific. Drop inactive account results and
    // force the active account to prove support again before enabling writes.
    queryClient.removeQueries({ queryKey: ['capabilities'], type: 'inactive' })
    void queryClient.invalidateQueries({ queryKey: ['capabilities'], type: 'active' })
  }, [account, queryClient])

  const sessionBlocked = Boolean(account && blockedAccount === account)
  const capabilities = enabled && !sessionBlocked && query.isFetchedAfterMount && query.isSuccess && !query.isFetching
    ? query.data
    : undefined
  const pending = enabled && !sessionBlocked && (!query.isFetchedAfterMount || query.isFetching)
  const diagnostics = useMemo(() => ({
    connector: connector ? {
      id: connector.id,
      name: connector.name,
      type: connector.type,
      uid: connector.uid,
    } : null,
    account: address ?? null,
    chainId,
    capabilities: sanitizeDiagnosticValue(capabilities),
    providerErrorCode: sessionBlocked ? 'ACCOUNT_CHANGED_RECONNECT_REQUIRED' : getProviderErrorCode(query.error),
    providerErrorMessage: sessionBlocked
      ? 'Akun berubah dalam sesi provider yang sama. Putuskan koneksi sebelum memeriksa akun baru.'
      : getSafeErrorMessage(query.error),
  }), [address, capabilities, chainId, connector, query.error, sessionBlocked])

  useEffect(() => {
    if (!enabled || pending) return
    console.info('[wallet-capabilities] account-scoped result', diagnostics)
  }, [diagnostics, enabled, pending])

  return { capabilities, diagnostics, error: query.error, pending }
}
