'use client'

import { ReactNode, useEffect, useState } from 'react'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import { DynamicPageTitle } from '@/components/ui/dynamic-page-title'
import { ToastProvider } from '@/components/ui/toast-provider'
import { IdleSessionTimeout } from '@/components/auth/idle-session-timeout'

function isAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('401') ||
    message.includes('Unauthorized') ||
    message.includes('JWT') ||
    message.includes('invalid_token') ||
    message.includes('token_expired') ||
    message.includes('not authenticated') ||
    message.includes('Sesi pengguna tidak')
  )
}

function showSessionErrorBanner() {
  if (typeof window === 'undefined') return
  if (document.getElementById('session-error-banner')) return

  const banner = document.createElement('div')
  banner.id = 'session-error-banner'
  banner.className = 'fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-3 text-[14px] text-amber-800 shadow-sm'
  banner.innerHTML = `
    <span>⏰ Sesi Anda telah berakhir. Silakan masuk kembali.</span>
    <button onclick="window.location.href='/'" class="rounded-lg bg-amber-800 px-3 py-1 text-[13px] font-semibold text-white hover:bg-amber-900">Masuk Kembali</button>
    <button onclick="document.getElementById('session-error-banner')?.remove()" class="ml-1 text-amber-600 hover:text-amber-800">✕</button>
  `
  document.body.prepend(banner)
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isAuthError(error)) return false
          return failureCount < 1
        },
      },
    },
    queryCache: new QueryCache({
      onError: (error) => {
        if (isAuthError(error)) {
          showSessionErrorBanner()
        }
      },
    }),
  })
}

function AuthErrorHandler({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'error') {
        if (isAuthError(event.query.state.error)) {
          showSessionErrorBanner()
        }
      }
    })
    return unsubscribe
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export function AppProviders({ children }: { children: ReactNode }) {
  // ponytail: global handler to absorb "Cannot set property ethereum" errors
  // from wallet SDK initialization (happens outside try/catch in minified bundles)
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (event.message && /cannot set property ethereum/i.test(event.message)) {
        event.preventDefault()
        return false
      }
    }
    window.addEventListener('error', handler)
    return () => window.removeEventListener('error', handler)
  }, [])

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <AuthErrorHandler>
        <ToastProvider>
            <DynamicPageTitle />
            <IdleSessionTimeout />
            {children}
          </ToastProvider>
      </AuthErrorHandler>
    </WagmiProvider>
  )
}
