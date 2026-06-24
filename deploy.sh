#!/bin/bash
# deploy.sh — Runs on cPanel server after git pull
# Location: ~/votein-deploy/deploy.sh (or wherever cPanel clones the repo)

set -e

echo "=== VoteChain Auto Deploy ==="
echo "Time: $(date)"

# 1. Navigate to frontend directory
cd "$(dirname "$0")/frontend" || cd "$(dirname "$0")"
echo "Working dir: $(pwd)"

# 2. Install dependencies (only if package.json changed)
if git diff HEAD@{1} --name-only 2>/dev/null | grep -q "frontend/package.json\|package.json"; then
  echo "Dependencies changed, running npm install..."
  npm install --omit=dev
else
  echo "No dependency changes, skipping npm install"
fi

# 3. Build
echo "Building..."
npm run build

# 4. Clean cache
rm -rf .next/cache

# 5. Restart app
# Option A: pm2 (if available)
if command -v pm2 &> /dev/null; then
  echo "Restarting with pm2..."
  pm2 restart votein 2>/dev/null || pm2 start npm --name votein -- start
# Option B: kill old process + start
else
  echo "Restarting Node.js..."
  # Kill old process on port 3000
  pkill -f "next start" 2>/dev/null || true
  sleep 1
  nohup npm start > /tmp/votein.log 2>&1 &
  echo "Started, PID: $!"
fi

echo "=== Deploy selesai ==="
