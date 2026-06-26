#!/bin/bash
# deploy-cpanel.sh — Build frontend & upload ke cPanel VPS
# Usage: ./deploy-cpanel.sh [build|upload|restart|full]
# 
# Prasyarat:
# - SSH key sudah di-setup ke VPS (agar tidak perlu password tiap kali)
# - File .env sudah benar di laptop

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
# Load .env.deploy if present (git-ignored, never committed)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DEPLOY="${SCRIPT_DIR}/../.env.deploy"
if [ -f "$ENV_DEPLOY" ]; then
    set -a; source "$ENV_DEPLOY"; set +a
fi

VPS_HOST="${VPS_HOST:?VPS_HOST not set — export it or create deploy/.env.deploy}"
VPS_USER="${VPS_USER:-voteinbi}"
VPS_DIR="${VPS_DIR:-/home/voteinbi/app/frontend}"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../frontend" && pwd)"
DOMAIN="${DOMAIN:-votein.biz.id}"

# ─── Colors ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── Functions ───────────────────────────────────────────────────────
log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

check_deps() {
    local missing=()
    for cmd in node npm git scp ssh; do
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$cmd")
        fi
    done
    if [ ${#missing[@]} -gt 0 ]; then
        error "Missing commands: ${missing[*]}"
        exit 1
    fi
}

check_env() {
    if [ ! -f "$LOCAL_DIR/.env" ]; then
        warn ".env not found, copying from .env.production"
        cp "$LOCAL_DIR/.env.production" "$LOCAL_DIR/.env"
    fi
}

build() {
    log "Building frontend..."
    cd "$LOCAL_DIR"
    
    # Pull latest
    git pull origin deploy/cpanel-backup
    
    # Install deps
    npm install
    
    # Build
    npm run build
    
    success "Build complete!"
}

upload() {
    log "Uploading .next to VPS..."
    
    # Upload .next folder
    scp -r "$LOCAL_DIR/.next" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/"
    
    # Upload server.js
    scp "$LOCAL_DIR/server.js" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/"
    
    # Upload package.json & next.config.mjs
    scp "$LOCAL_DIR/package.json" "$LOCAL_DIR/next.config.mjs" "${VPS_USER}@${VPS_HOST}:${VPS_DIR}/"
    
    success "Upload complete!"
}

restart() {
    log "Restarting app on cPanel..."
    
    # Note: cPanel restart via SSH is tricky
    # Best to use cPanel UI or ask user to restart manually
    warn "Please restart manually via cPanel:"
    warn "  1. Login to https://${VPS_HOST}:2083"
    warn "  2. Setup Node.js App → Click RESTART"
    warn ""
    warn "Or if you have cPanel API access:"
    warn "  curl -H 'Authorization: cpanel user:token' https://${VPS_HOST}:2083/execute/Nodejs/restart"
    
    success "Done!"
}

status() {
    log "Checking deployment status..."
    
    # Check if website is accessible
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" 2>/dev/null || echo "000")
    
    if [ "$http_code" = "200" ]; then
        success "Website is LIVE at https://${DOMAIN} (HTTP ${http_code})"
    else
        warn "Website returned HTTP ${http_code}"
    fi
    
    # Check VPS connection
    if ssh -o ConnectTimeout=5 "${VPS_USER}@${VPS_HOST}" "echo ok" &>/dev/null; then
        success "VPS connection: OK"
    else
        warn "VPS connection: FAILED"
    fi
}

full() {
    check_deps
    check_env
    build
    upload
    restart
    # Setup cron jobs (send-notifications + auto-reveal)
    bash "${SCRIPT_DIR}/setup-crons.sh" install 2>/dev/null || warn "Cron setup skipped — run setup-crons.sh manually"
    status
}

# ─── Main ────────────────────────────────────────────────────────────
main() {
    local action="${1:-full}"
    
    case "$action" in
        build)
            check_deps
            check_env
            build
            ;;
        upload)
            upload
            ;;
        restart)
            restart
            ;;
        status)
            status
            ;;
        full)
            full
            ;;
        *)
            echo "Usage: $0 [build|upload|restart|status|full]"
            echo ""
            echo "Commands:"
            echo "  build   - Build frontend locally"
            echo "  upload  - Upload .next to VPS"
            echo "  restart - Show restart instructions"
            echo "  status  - Check deployment status"
            echo "  full    - Build + Upload + Restart (default)"
            exit 1
            ;;
    esac
}

main "$@"
