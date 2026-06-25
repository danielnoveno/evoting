#!/bin/bash
# setup-indexer.sh — Setup Ponder indexer di cPanel VPS
# Jalankan dari LOCAL laptop, bukan dari VPS

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
VPS_HOST="195.88.211.190"
VPS_USER="voteinbi"
VPS_DIR="/home/voteinbi/app"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INDEXER]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

# ─── Check Connection ────────────────────────────────────────────────
check_connection() {
    log "Testing VPS connection..."
    if ssh -o ConnectTimeout=5 "${VPS_USER}@${VPS_HOST}" "echo ok" &>/dev/null; then
        success "VPS connection: OK"
    else
        error "VPS connection: FAILED"
        error "Pastikan SSH key sudah ter-setup"
        exit 1
    fi
}

# ─── Check Current Status ───────────────────────────────────────────
check_status() {
    log "Checking current indexer status..."
    
    # Check if PM2 is running
    local pm2_status=$(ssh "${VPS_USER}@${VPS_HOST}" "pm2 status 2>/dev/null || echo 'PM2 not found'")
    echo "$pm2_status"
    
    # Check if indexer is in PM2 list
    local has_indexer=$(ssh "${VPS_USER}@${VPS_HOST}" "pm2 list | grep -c votein-indexer || echo 0")
    
    if [ "$has_indexer" = "1" ]; then
        success "Indexer found in PM2"
        
        # Get PM2 details
        ssh "${VPS_USER}@${VPS_HOST}" "pm2 show votein-indexer 2>/dev/null | head -20"
    else
        warn "Indexer NOT in PM2 list"
    fi
}

# ─── Setup Environment ──────────────────────────────────────────────
setup_env() {
    log "Setting up indexer environment..."
    
    # Create .env for indexer on VPS
    cat << 'EOF' > /tmp/indexer.env
# Ponder Indexer Environment
# Base Sepolia RPC (public)
PONDER_RPC_URL_84532=https://sepolia.base.org

# Supabase
SUPABASE_URL=https://yswroopfcokpqjvewbvv.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzd3Jvb3BmY29rcXBqdmV3YnZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEzMjYyMiwiZXhwIjoyMDY1NzA4NjIyfQ.Nv046iWCpK8JW4hBk8IaKvQXG4BqFy3Xv4B5N6M7P8Q

# Node environment
NODE_ENV=production
EOF
    
    # Upload to VPS
    scp /tmp/indexer.env "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/indexer/.env"
    
    success "Indexer .env uploaded"
}

# ─── Install & Build ────────────────────────────────────────────────
install() {
    log "Installing indexer dependencies..."
    
    ssh "${VPS_USER}@${VPS_HOST}" << 'EOF'
cd /home/voteinbi/app/indexer

# Install dependencies
npm install

# Build if needed
npm run build 2>/dev/null || true

EOF
    
    success "Indexer dependencies installed"
}

# ─── Start with PM2 ────────────────────────────────────────────────
start_pm2() {
    log "Starting indexer with PM2..."
    
    ssh "${VPS_USER}@${VPS_HOST}" << 'EOF'
cd /home/voteinbi/app/indexer

# Stop if already running
pm2 stop votein-indexer 2>/dev/null || true
pm2 delete votein-indexer 2>/dev/null || true

# Start with PM2
pm2 start npm --name "votein-indexer" -- start

# Save PM2 config
pm2 save

# Check status
pm2 status votein-indexer

EOF
    
    success "Indexer started with PM2"
}

# ─── Setup Auto-start ──────────────────────────────────────────────
setup_autostart() {
    log "Setting up PM2 auto-start..."
    
    ssh "${VPS_USER}@${VPS_HOST}" << 'EOF'
# Create start script
cat > /home/voteinbi/start-pm2.sh << 'SCRIPT'
#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /home/voteinbi/app/indexer
pm2 resurrect
SCRIPT

chmod +x /home/voteinbi/start-pm2.sh

# Add to crontab if not exists
(crontab -l 2>/dev/null | grep -v "start-pm2.sh"; echo "@reboot /home/voteinbi/start-pm2.sh") | crontab -

EOF
    
    success "Auto-start configured"
}

# ─── Main ────────────────────────────────────────────────────────────
main() {
    echo ""
    echo "=== PONDER INDEXER SETUP FOR VPS ==="
    echo ""
    
    check_connection
    check_status
    setup_env
    install
    start_pm2
    setup_autostart
    
    echo ""
    echo "=== SUMMARY ==="
    echo ""
    success "Indexer should now be running on VPS"
    echo ""
    log "Check status: pm2 status votein-indexer"
    log "View logs: pm2 logs votein-indexer"
    log "Restart: pm2 restart votein-indexer"
    echo ""
}

main "$@"
