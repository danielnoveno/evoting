#!/bin/bash
# deploy-indexer.sh — Deploy Ponder indexer to cPanel VPS
# Usage: ./deploy-indexer.sh [install|start|stop|restart|status|logs]

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
APP_DIR="/home/voteinbi/app"
INDEXER_DIR="${APP_DIR}/indexer"
PM2_APP_NAME="votein-indexer"

# ─── Functions ───────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

install_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2 globally..."
        npm install -g pm2
        pm2 startup
    fi
}

install() {
    log "Installing indexer dependencies..."
    
    cd "$INDEXER_DIR"
    
    # Install Node.js dependencies
    npm ci
    
    # Run codegen
    npm run codegen
    
    log "Indexer installation complete"
}

start() {
    log "Starting indexer..."
    
    install_pm2
    
    cd "$INDEXER_DIR"
    
    # Stop existing process
    pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
    
    # Start with PM2
    pm2 start npm \
        --name "$PM2_APP_NAME" \
        -- start
    
    pm2 save
    
    log "Indexer started. Check status with: pm2 status"
}

stop() {
    log "Stopping indexer..."
    pm2 stop "$PM2_APP_NAME" 2>/dev/null || log "Indexer not running"
}

restart() {
    log "Restarting indexer..."
    pm2 restart "$PM2_APP_NAME" 2>/dev/null || start
}

status() {
    log "Indexer status:"
    pm2 status "$PM2_APP_NAME" 2>/dev/null || log "Indexer not found in PM2"
}

logs() {
    pm2 logs "$PM2_APP_NAME" --lines 50
}

setup_env() {
    log "Setting up environment variables..."
    
    if [ ! -f "${INDEXER_DIR}/.env" ]; then
        cat > "${INDEXER_DIR}/.env" << 'EOF'
# Ponder Indexer Environment
# Copy from .env.example and fill in values

PONDER_RPC_URL_84532=https://sepolia.base.org
NEXT_PUBLIC_REGISTRY_ADDRESS=0xd1d48796FB21cB1D66C48930a6905C46fE270277
PONDER_START_BLOCK=42387749
PONDER_MAX_REQUESTS_PER_SECOND=3
PONDER_POLLING_INTERVAL_MS=5000
EOF
        log "Created .env template — edit with actual values"
    else
        log ".env already exists"
    fi
}

# ─── Main ────────────────────────────────────────────────────────────
main() {
    local action="${1:-status}"
    
    log "=== Indexer Management (action: $action) ==="
    
    case "$action" in
        install)
            install
            setup_env
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            status
            ;;
        logs)
            logs
            ;;
        *)
            log "Unknown action: $action"
            log "Usage: $0 [install|start|stop|restart|status|logs]"
            exit 1
            ;;
    esac
    
    log "=== Done ==="
}

main "$@"
