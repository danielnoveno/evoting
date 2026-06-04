import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'VoteChain',
      preference: 'smartWalletOnly',
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
