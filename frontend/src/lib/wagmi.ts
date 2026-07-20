import { http, fallback, createConfig } from 'wagmi'
import { coinbaseWallet, injected } from 'wagmi/connectors'
import { baseSepolia } from 'wagmi/chains'

const BASE_SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim()
const baseSepoliaRpcUrls = Array.from(new Set([
  // Utamakan proxy same-origin agar browser tidak langsung terkena CORS,
  // rate-limit, atau ERR_EMPTY_RESPONSE dari endpoint publik Base Sepolia.
  '/api/rpc/base-sepolia',
  'https://base-sepolia-rpc.publicnode.com',
  'https://sepolia.base.org',
  BASE_SEPOLIA_RPC_URL,
].filter(Boolean)))

const baseSepoliaTransports = baseSepoliaRpcUrls.map((url) => http(url, {
  retryCount: 3,
  retryDelay: 1500,
  timeout: 15_000,
}))

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  // Keep EIP-6963 discovery enabled so voters can explicitly choose a compatible
  // injected account instead of being forced through Coinbase Smart Wallet.
  multiInjectedProviderDiscovery: true,
  connectors: [
    coinbaseWallet({
      appName: 'Votein',
      preference: 'smartWalletOnly',
    }),
    injected({ shimDisconnect: true }),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: fallback(baseSepoliaTransports),
  },
})

// Konfigurasi Paymaster (URL ini didapat dari Coinbase Developer Platform atau Alchemy)
export const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL || '';

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
