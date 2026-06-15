import { http, fallback, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { baseAccountConnector } from '@/lib/base-account-connector'

const BASE_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
const baseSepoliaRpcUrls = Array.from(new Set([
  'https://sepolia.base.org',
  'https://base-sepolia-rpc.publicnode.com',
  BASE_SEPOLIA_RPC_URL,
].filter(Boolean)))

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
    // Injected connector (MetaMask, Rabby, dll.) — diperlukan untuk
    // superadmin yang wallet EOA-nya terdaftar di on-chain registry.
    injected({ shimDisconnect: true }),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: fallback(baseSepoliaRpcUrls.map((url) => http(url))),
  },
})

// Konfigurasi Paymaster (URL ini didapat dari Coinbase Developer Platform atau Alchemy)
export const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL || '';

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
