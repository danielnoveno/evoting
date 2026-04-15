const BASE_SEPOLIA_EXPLORER = 'https://sepolia.basescan.org'

export const basescan = {
  tx: (hash: string) => `${BASE_SEPOLIA_EXPLORER}/tx/${hash}`,
  address: (address: string) => `${BASE_SEPOLIA_EXPLORER}/address/${address}`,
  block: (blockNumber: number) => `${BASE_SEPOLIA_EXPLORER}/block/${blockNumber}`,
}
