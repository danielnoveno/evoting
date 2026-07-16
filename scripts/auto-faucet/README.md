# VoteChain Auto-Faucet

Otomatisasi pengisian Sepolia ETH untuk wallet relayer VoteChain.

## Mengapa Ini Diperlukan?

Relayer VoteChain membutuhkan Sepolia ETH untuk membayar gas fee saat
menjalankan `revealFor()` (auto-reveal). Dengan auto-faucet, wallet
relayer otomatis terisi tanpa perlu claim manual.

## Arsitektur

```
Cron Job (tiap 6-24 jam)
    ↓
CDP Faucet API
    ↓
Kirim 0.0001 ETH × 10 = 0.001 ETH ke wallet relayer
    ↓
Relayer punya cukup ETH untuk reveal 500+ voter
```

## Setup

### 1. Daftar Coinbase Developer Platform

1. Buka https://portal.cdp.coinbase.com/
2. Daftar / Login
3. Buat API Key:
   - Klik "API Keys" di sidebar
   - Klik "Create API Key"
   - Beri nama: `votein-faucet`
   - Copy: **API Key ID**, **API Key Secret**, **Wallet Secret**

### 2. Upload ke VPS

```bash
# Dari lokal, upload folder auto-faucet ke VPS
scp -r scripts/auto-faucet voteinbi@195.88.211.190:/home/voteinbi/
```

### 3. Setup di VPS

```bash
# SSH ke VPS
ssh voteinbi@195.88.211.190

# Masuk folder
cd /home/voteinbi/auto-faucet

# Install dependencies
npm install

# Buat file .env
cp .env.example .env
nano .env
# Isi dengan credentials CDP dan alamat wallet relayer

# Test manual
npx tsx src/claim.ts
npx tsx src/check-balance.ts
```

### 4. Setup Cron Job

```bash
# Buka crontab editor
crontab -e

# Tambahkan baris ini (tiap 6 jam):
0 */6 * * * /home/voteinbi/auto-faucet/faucet-cron.sh

# Atau tiap 12 jam:
0 */12 * * * /home/voteinbi/auto-faucet/faucet-cron.sh

# Atau sekali sehari (tengah malam):
0 0 * * * /home/voteinbi/auto-faucet/faucet-cron.sh
```

### 5. Verifikasi

```bash
# Cek apakah cron sudah jalan
crontab -l

# Cek log terakhir
tail -20 /home/voteinbi/auto-faucet/logs/faucet-$(date +%Y%m%d).log

# Cek saldo relayer
cd /home/voteinbi/auto-faucet && npx tsx src/check-balance.ts
```

## File Structure

```
auto-faucet/
├── .env.example          # Template konfigurasi
├── .env                  # Konfigurasi (jangan di-commit!)
├── package.json          # Dependencies
├── faucet-cron.sh        # Shell wrapper untuk cron
├── README.md             # Dokumentasi ini
└── src/
    ├── claim.ts          # Claim sekali (0.0001 ETH)
    ├── claim-loop.ts     # Claim berkali-kali
    ├── scheduled.ts      # Long-running scheduler
    └── check-balance.ts  # Cek saldo wallet relayer
```

## Limit CDP Faucet

| Token | Per Claim | Max per 24 jam | Total per Hari |
|-------|-----------|----------------|----------------|
| ETH   | 0.0001    | 1,000 claims   | 0.1 ETH        |

## Kebutuhan Gas Reveal

Berdasarkan pengukuran di laporan skripsi:

| Fungsi | Gas Used | Biaya (ETH) |
|--------|----------|-------------|
| revealVote | 72,460 - 89,560 | ~0.00000054 |

Untuk 500 voter: 500 × 0.00000054 = **0.000270 ETH**
→ Cukup dari **3 klaim CDP** (0.0003 ETH)

## Troubleshooting

### "Rate limit exceeded"
- Tunggu 24 jam atau kurangi jumlah klaim
- Cek di `.env`: kurangi `CLAIMS_PER_DAY`

### "Invalid API key"
- Pastikan API key benar di `.env`
- Pastikan wallet secret benar

### Log tidak ada
- Cek apakah cron sudah terdaftar: `crontab -l`
- Cek apakah script executable: `chmod +x faucet-cron.sh`
