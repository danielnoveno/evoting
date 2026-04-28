'use client'

import { OnchainKitProvider } from '@coinbase/onchainkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'

import { wagmiConfig } from '@/lib/wagmi'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient())
  const onchainkitApiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {onchainkitApiKey ? (
          <OnchainKitProvider apiKey={onchainkitApiKey} chain={baseSepolia}>
            {children}
          </OnchainKitProvider>
        ) : (
          children
        )}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
