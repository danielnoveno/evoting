// claim-loop.ts — Claim berkali-kali sampai batas harian tercapai
// CDP limit: 1000 claims × 0.0001 ETH = 0.1 ETH per 24 jam
import { CdpClient } from "@coinbase/cdp-sdk";
import "dotenv/config";

const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS!;
const NETWORK = (process.env.NETWORK as "base-sepolia") || "base-sepolia";
const MAX_CLAIMS = parseInt(process.env.MAX_CLAIMS || "10"); // Default: 10x (0.001 ETH)
const DELAY_MS = 2000; // 2 detik antar claim

if (!RELAYER_ADDRESS) {
  console.error("❌ RELAYER_ADDRESS belum di-set di .env");
  process.exit(1);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function claimOnce(cdp: CdpClient, attempt: number): Promise<boolean> {
  try {
    const res = await cdp.evm.requestFaucet({
      address: RELAYER_ADDRESS,
      network: NETWORK,
      token: "eth",
    });
    console.log(
      `  ✅ [${attempt}] TX: https://sepolia.basescan.org/tx/${res.transactionHash}`
    );
    return true;
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes("rate") || msg.includes("limit") || msg.includes("429")) {
      console.log(`  ⏳ [${attempt}] Rate limit tercapai.`);
      return false;
    }
    console.error(`  ❌ [${attempt}] Gagal: ${msg}`);
    return false;
  }
}

async function main() {
  const cdp = new CdpClient();
  let success = 0;
  let failed = 0;

  console.log(`\n💧 Auto-Faucet Loop — ${MAX_CLAIMS} klaim目标`);
  console.log(`   Target : ${RELAYER_ADDRESS}`);
  console.log(`   Network: ${NETWORK}\n`);

  for (let i = 1; i <= MAX_CLAIMS; i++) {
    const ok = await claimOnce(cdp, i);
    if (ok) {
      success++;
    } else {
      failed++;
      break; // Stop kalau rate limit
    }
    if (i < MAX_CLAIMS) await sleep(DELAY_MS);
  }

  const ethReceived = success * 0.0001;
  console.log(`\n📊 Ringkasan:`);
  console.log(`   Berhasil : ${success} klaim`);
  console.log(`   Gagal    : ${failed}`);
  console.log(`   Total ETH: ${ethReceived} ETH`);
  console.log(`   Target   : ${RELAYER_ADDRESS}\n`);
}

main();
