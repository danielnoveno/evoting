'use client'

import { ReactNode, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import { DynamicPageTitle } from '@/components/ui/dynamic-page-title'
import { ToastProvider } from '@/components/ui/toast-provider'
import { LanguageProvider } from '@/lib/contexts/language-context'
import { IdleSessionTimeout } from '@/components/auth/idle-session-timeout'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))

  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ToastProvider>
            <DynamicPageTitle />
            <IdleSessionTimeout />
            {children}
          </ToastProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
