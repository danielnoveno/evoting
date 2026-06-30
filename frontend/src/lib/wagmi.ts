import { http, fallback, createConfig } from 'wagmi'
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

/**
 * Wagmi config untuk read-only operations (phase checks, hasCommitted, etc.)
 * 
 * Write operations (commit, reveal) menggunakan server-side signing melalui
 * useServerWallet hook, bukan melalui wagmi wallet client.
 * 
 * Connector Base Account DIHAPUS karena popup wallet terblokir oleh
 * Internet Positif/DPI di Indonesia. ID voting di-derive secara deterministic
 * di server menggunakan user_id + master secret.
 */
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [], // No wallet connectors needed - all signing is server-side
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
