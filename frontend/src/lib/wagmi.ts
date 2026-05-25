import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: 'Votein',
      preference: 'smartWalletOnly',
    }),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(),
  },
})

// Gasless capabilities for Smart Wallets
export const capabilities = {
  paymasterService: {
    [baseSepolia.id]: {
      url: `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}`,
    },
  },
}

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
