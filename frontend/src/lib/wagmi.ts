import { createConfig, http } from 'wagmi'
import { coinbaseWallet, injected } from 'wagmi/connectors'
import { baseSepolia } from 'wagmi/chains'

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || baseSepolia.rpcUrls.default.http[0]

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'Votein',
    }),
  ],
  transports: {
    [baseSepolia.id]: http(rpcUrl),
  },
  ssr: true,
})
