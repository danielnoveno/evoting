#!/bin/bash
# deploy-cpanel.sh — Package VoteChain frontend for cPanel Node.js
# Output: ~/votein-deploy.tar.gz

set -e

echo "=== VoteChain cPanel Deployment ==="
echo ""

# 1. Clean previous builds
echo "[1/4] Cleaning previous builds..."
rm -rf .next

# 2. Build production
echo "[2/4] Building production..."
npm run build

# 3. Remove cache (large, not needed at runtime)
echo "[3/4] Cleaning cache..."
rm -rf .next/cache

# 4. Package
echo "[4/4] Packaging..."
DEPLOY_DIR="/tmp/votein-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp next.config.mjs "$DEPLOY_DIR/"
cp -r .next "$DEPLOY_DIR/"
cp -r public "$DEPLOY_DIR/"

# Create .env
cp .env.production "$DEPLOY_DIR/.env"

# Fix .env SITE_URL
sed -i 's|https://e-votein.netlify.app|https://votein.biz.id|g' "$DEPLOY_DIR/.env"

cd /tmp
tar -czf ~/votein-deploy.tar.gz votein-deploy/
rm -rf "$DEPLOY_DIR"

echo ""
echo "=== SELESAI ==="
echo "File: ~/votein-deploy.tar.gz"
echo "Ukuran: $(du -h ~/votein-deploy.tar.gz | cut -f1)"
echo ""
echo "Langkah selanjutnya:"
echo "1. Login cPanel Arenahost"
echo "2. File Manager → public_html → Upload votein-deploy.tar.gz → Extract"
echo "3. Terminal cPanel (atau SSH): cd /public_html/votein-deploy && npm install --omit=dev"
echo "4. Node.js App Selector → Create App → Set startup file & port"
