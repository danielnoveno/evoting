'use client'

import { ReactNode, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import { DynamicPageTitle } from '@/components/ui/dynamic-page-title'
import { ToastProvider } from '@/components/ui/toast-provider'
import { LanguageProvider } from '@/lib/contexts/language-context'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ToastProvider>
            <DynamicPageTitle />
            {children}
          </ToastProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
