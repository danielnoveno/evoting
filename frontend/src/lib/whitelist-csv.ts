export interface ParsedWhitelistCsvEntry {
  walletAddress: string
  voterName?: string
}

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/

/**
 * Robust CSV parser that handles:
 * 1. Quoted values (e.g. "Budi, S.T.", 0x123...)
 * 2. Mixed line endings (\n, \r\n)
 * 3. Empty lines
 */
export function parseWhitelistCsv(raw: string): ParsedWhitelistCsvEntry[] {
  const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
  const results: ParsedWhitelistCsvEntry[] = [];

  for (const line of lines) {
    // Simple regex for CSV that handles optional quotes
    // Match: "value",value, "value with , comma"
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    
    if (!matches) continue;

    const values = matches.map(v => v.replace(/^"|"$/g, '').trim());
    
    // Logic: First valid 0x... address found is the wallet
    const walletIndex = values.findIndex(v => WALLET_REGEX.test(v));
    
    if (walletIndex !== -1) {
      results.push({
        walletAddress: values[walletIndex],
        voterName: values[walletIndex === 0 ? 1 : 0] || undefined
      });
    }
  }

  return results;
}

export function countInvalidWhitelistCsvRows(raw: string): number {
  const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
  const parsedCount = parseWhitelistCsv(raw).length;
  return Math.max(0, lines.length - parsedCount);
}
