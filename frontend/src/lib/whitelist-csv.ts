export interface ParsedWhitelistCsvEntry {
  walletAddress: string
  voterName?: string
}

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/

export function parseWhitelistCsv(raw: string): ParsedWhitelistCsvEntry[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [walletAddress, voterName] = line.split(',').map((value) => value.trim())
      return {
        walletAddress,
        voterName,
      }
    })
    .filter((entry) => WALLET_REGEX.test(entry.walletAddress))
}

export function countInvalidWhitelistCsvRows(raw: string): number {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const [walletAddress] = line.split(',').map((value) => value.trim())
      return !WALLET_REGEX.test(walletAddress)
    }).length
}
