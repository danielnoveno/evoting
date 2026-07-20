import { http, fallback, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { baseAccount } from 'wagmi/connectors'

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

export const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL || ''

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  multiInjectedProviderDiscovery: false,
  connectors: [
    baseAccount({
      appName: 'Votein',
      preference: { options: 'smartWalletOnly' },
      paymasterUrls: PAYMASTER_URL ? { [baseSepolia.id]: PAYMASTER_URL } : undefined,
    }),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: fallback(baseSepoliaTransports),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
