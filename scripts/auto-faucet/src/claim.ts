// claim.ts — Single claim dari CDP Faucet ke wallet relayer
import { CdpClient } from "@coinbase/cdp-sdk";
import "dotenv/config";

const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS!;
const NETWORK = (process.env.NETWORK as "base-sepolia") || "base-sepolia";

if (!RELAYER_ADDRESS) {
  console.error("❌ RELAYER_ADDRESS belum di-set di .env");
  process.exit(1);
}

async function claim() {
  const cdp = new CdpClient();

  console.log(`\n💧 Claiming ETH dari CDP Faucet...`);
  console.log(`   Target : ${RELAYER_ADDRESS}`);
  console.log(`   Network: ${NETWORK}`);

  try {
    const res = await cdp.evm.requestFaucet({
      address: RELAYER_ADDRESS,
      network: NETWORK,
      token: "eth",
    });

    console.log(`\n✅ Berhasil!`);
    console.log(`   TX Hash: ${res.transactionHash}`);
    console.log(`   Link   : https://sepolia.basescan.org/tx/${res.transactionHash}`);
    return true;
  } catch (err: any) {
    const msg = err?.message || String(err);

    if (msg.includes("rate") || msg.includes("limit") || msg.includes("429")) {
      console.log(`\n⏳ Rate limit — sudah capai batas 24 jam. Coba lagi nanti.`);
    } else {
      console.error(`\n❌ Gagal: ${msg}`);
    }
    return false;
  }
}

claim();
