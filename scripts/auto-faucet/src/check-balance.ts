// check-balance.ts — Cek saldo ETH wallet relayer
import { createPublicClient, formatEther, http } from "viem";
import { baseSepolia } from "viem/chains";
import "dotenv/config";

const RELAYER_ADDRESS = process.env.RELAYER_ADDRESS!;

if (!RELAYER_ADDRESS) {
  console.error("❌ RELAYER_ADDRESS belum di-set di .env");
  process.exit(1);
}

async function main() {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http("https://base-sepolia-rpc.publicnode.com"),
  });

  const balance = await client.getBalance({ address: RELAYER_ADDRESS as `0x${string}` });
  const eth = formatEther(balance);

  console.log(`\n💰 Saldo Wallet Relayer`);
  console.log(`   Address: ${RELAYER_ADDRESS}`);
  console.log(`   Balance: ${eth} ETH`);
  console.log(`   Network: Base Sepolia Testnet`);

  // Estimasi berapa reveal yang bisa ditanggung
  const gasPerReveal = 0.00000054; // ~89.560 gas × 0.006 Gwei
  const revealsPossible = Math.floor(parseFloat(eth) / gasPerReveal);
  console.log(`\n   📊 Cukup untuk ~${revealsPossible} reveal transaksi\n`);
}

main();
