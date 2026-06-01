'use client'

import { ReactNode, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { baseSepolia } from 'wagmi/chains'
import { wagmiConfig } from '@/lib/wagmi'
import { DynamicPageTitle } from '@/components/ui/dynamic-page-title'
import { ToastProvider } from '@/components/ui/toast-provider'
import { LanguageProvider } from '@/lib/contexts/language-context'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={baseSepolia}
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
        >
          <LanguageProvider>
            <ToastProvider>
              <DynamicPageTitle />
              {children}
            </ToastProvider>
          </LanguageProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
