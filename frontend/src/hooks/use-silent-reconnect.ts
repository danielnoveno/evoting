'use client'

import { useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { getAddress } from 'viem'

/**
 * Silent auto-reconnect for Base Account SDK.
 *
 * Problem: `reconnectOnMount={true}` triggers a popup because Base Account
 * SDK's `connect()` requires user consent. But `reconnectOnMount={false}`
 * means the wallet state is lost on every page navigation.
 *
 * Solution: On mount, call `isAuthorized()` → `getAccounts()` → `eth_accounts`
 * which is a read-only call that does NOT open a popup. If the SDK has a
 * stored session, it returns the accounts. We then manually emit the wagmi
 * config change event to update `useAccount()` state without calling `connect()`.
 */
export function useSilentReconnect() {
  const { address } = useAccount()
  const restored = useRef(false)

  useEffect(() => {
    if (restored.current || address) return
    restored.current = true

    let cancelled = false

    async function tryRestore() {
      try {
        // Dynamic import to avoid SSR issues
        const { wagmiConfig } = await import('@/lib/wagmi')
        const connector = wagmiConfig.connectors[0]
        if (!connector) return

        const authorized = await connector.isAuthorized()
        if (!authorized || cancelled) return

        const [accounts, chainId] = await Promise.all([
          connector.getAccounts(),
          connector.getChainId(),
        ])

        if (cancelled || !accounts.length) return

        // Access internal emitter to emit account change
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = wagmiConfig as any
        if (config.emitter) {
          config.emitter.emit('change', {
            accounts: accounts.map((a: string) => getAddress(a)),
            chainId,
          })
        }
      } catch {
        // Silent fail — user will see connect button
      }
    }

    tryRestore()
    return () => { cancelled = true }
  }, [address])
}
