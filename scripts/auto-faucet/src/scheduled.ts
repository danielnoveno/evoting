// scheduled.ts — Claim otomatis setiap 24 jam (untuk dijalankan sebagai long-running process)
import { CdpClient } from "@coinbase/cdp-sdk";
import "dotenv/config";

const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS!;
const NETWORK = (process.env.NETWORK as "base-sepolia") || "base-sepolia";
const CLAIMS_PER_DAY = parseInt(process.env.CLAIMS_PER_DAY || "10");
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 jam

if (!RELAYER_ADDRESS) {
  console.error("❌ RELAYER_ADDRESS belum di-set di .env");
  process.exit(1);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function claimBatch() {
  const cdp = new CdpClient();
  let success = 0;

  console.log(`\n[${new Date().toISOString()}] 🔄 Memulai batch claim...`);

  for (let i = 1; i <= CLAIMS_PER_DAY; i++) {
    try {
      const res = await cdp.evm.requestFaucet({
        address: RELAYER_ADDRESS,
        network: NETWORK,
        token: "eth",
      });
      console.log(`  ✅ [${i}/${CLAIMS_PER_DAY}] TX: ${res.transactionHash}`);
      success++;
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("rate") || msg.includes("limit") || msg.includes("429")) {
        console.log(`  ⏳ Rate limit — berhenti di ${success} klaim.`);
        break;
      }
      console.error(`  ❌ [${i}] Error: ${msg}`);
    }
    await sleep(2000);
  }

  const eth = success * 0.0001;
  console.log(`  📊 Batch selesai: ${success} klaim = ${eth} ETH`);
}

async function main() {
  console.log(`\n🚀 VoteChain Auto-Faucet Scheduler`);
  console.log(`   Relayer : ${RELAYER_ADDRESS}`);
  console.log(`   Network : ${NETWORK}`);
  console.log(`   Interval: 24 jam\n`);

  // Claim pertama kali saat start
  await claimBatch();

  // Jadwalkan ulang setiap 24 jam
  console.log(`\n⏰ Menunggu 24 jam untuk batch berikutnya...\n`);
  setInterval(async () => {
    await claimBatch();
    console.log(`\n⏰ Menunggu 24 jam untuk batch berikutnya...\n`);
  }, INTERVAL_MS);
}

main();
