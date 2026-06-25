#!/bin/bash
# status-indexer.sh — Cek status Ponder indexer di VPS
# Jalankan dari LOCAL laptop

set -euo pipefail

VPS_HOST="195.88.211.190"
VPS_USER="voteinbi"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "=== PONDER INDEXER STATUS ==="
echo ""

# 1. Test connection
echo -e "${BLUE}[1/4]${NC} Testing VPS connection..."
if ssh -o ConnectTimeout=5 "${VPS_USER}@${VPS_HOST}" "echo ok" &>/dev/null; then
    echo -e "${GREEN}[✓]${NC} VPS connection: OK"
else
    echo -e "${RED}[✗]${NC} VPS connection: FAILED"
    exit 1
fi

# 2. Check PM2 status
echo ""
echo -e "${BLUE}[2/4]${NC} Checking PM2 status..."
ssh "${VPS_USER}@${VPS_HOST}" "pm2 list 2>/dev/null || echo 'PM2 not installed'"

# 3. Check if indexer is in PM2
echo ""
echo -e "${BLUE}[3/4]${NC} Checking indexer process..."
HAS_INDEXER=$(ssh "${VPS_USER}@${VPS_HOST}" "pm2 list | grep -c votein-indexer || echo 0")

if [ "$HAS_INDEXER" = "1" ]; then
    echo -e "${GREEN}[✓]${NC} Indexer found in PM2"
    
    # Get uptime and restart count
    ssh "${VPS_USER}@${VPS_HOST}" << 'EOF'
pm2 show votein-indexer 2>/dev/null | grep -E "(name|status|uptime|restarts|script path|exec mode|exec cwd)" || true
EOF
else
    echo -e "${YELLOW}[!]${NC} Indexer NOT in PM2 list"
fi

# 4. Test if indexer port is responding (if applicable)
echo ""
echo -e "${BLUE}[4/4]${NC} Checking indexer HTTP..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://votein.biz.id" 2>/dev/null || echo "000")
echo -e "Website HTTP: ${HTTP_CODE}"

echo ""
echo "=== SUMMARY ==="
echo ""
if [ "$HAS_INDEXER" = "1" ]; then
    echo -e "${GREEN}[✓]${NC} Indexer is running"
else
    echo -e "${YELLOW}[!]${NC} Indexer needs setup"
    echo "Run: ./deploy/scripts/setup-indexer.sh"
fi
echo ""
