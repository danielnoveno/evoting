import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { baseAccountConnector } from '@/lib/base-account-connector'

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    baseAccountConnector({
      appName: 'Votein',
      appLogoUrl: null,
      preference: {
        options: 'smartWalletOnly',
      },
    }),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
  },
})

// Konfigurasi Paymaster (URL ini didapat dari Coinbase Developer Platform atau Alchemy)
export const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL || '';

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
