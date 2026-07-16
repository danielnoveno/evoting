#!/bin/bash
# faucet-cron.sh — Wrapper script untuk cron job
# Usage: jalankan dari cron atau manual
#
# Cron example (tiap 6 jam):
# 0 */6 * * * /home/voteinbi/auto-faucet/faucet-cron.sh >> /home/voteinbi/auto-faucet/logs/faucet.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
LOG_FILE="${LOG_DIR}/faucet-$(date +%Y%m%d).log"

# Buat direktori log jika belum ada
mkdir -p "$LOG_DIR"

# Load environment
if [ -f "${SCRIPT_DIR}/.env" ]; then
  set -a
  source "${SCRIPT_DIR}/.env"
  set +a
else
  echo "❌ File .env tidak ditemukan di ${SCRIPT_DIR}" >> "$LOG_FILE"
  exit 1
fi

echo "" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
echo "🕐 $(date '+%Y-%m-%d %H:%M:%S') — Auto-Faucet Run" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Jalankan claim (10x = 0.001 ETH)
cd "$SCRIPT_DIR"
npx tsx src/claim-loop.ts >> "$LOG_FILE" 2>&1

# Cek saldo setelah claim
npx tsx src/check-balance.ts >> "$LOG_FILE" 2>&1

echo "✅ Selesai" >> "$LOG_FILE"
