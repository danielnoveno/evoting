#!/bin/bash
# setup-crons.sh — Setup periodic cron jobs on cPanel VPS
# Usage: ./setup-crons.sh [install|remove|status]
#
# Cron jobs yang di-setup:
#   1. /api/cron/send-notifications — setiap 5 menit (commit reminders, results)
#   2. /api/cron/auto-reveal — setiap 2 menit (auto-reveal votes via relayer)

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DEPLOY="${SCRIPT_DIR}/../.env.deploy"
if [ -f "$ENV_DEPLOY" ]; then
    set -a; source "$ENV_DEPLOY"; set +a
fi

VPS_HOST="${VPS_HOST:?VPS_HOST not set}"
VPS_USER="${VPS_USER:-voteinbi}"
DOMAIN="${DOMAIN:-votein.biz.id}"
CRON_SECRET="${NOTIFICATION_CRON_SECRET:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[CRON]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

# ─── Install ─────────────────────────────────────────────────────────
install_crons() {
    log "Installing cron jobs on VPS..."
    
    if [ -z "$CRON_SECRET" ]; then
        warn "NOTIFICATION_CRON_SECRET not set — cron calls won't be authenticated"
        warn "Set it in deploy/.env.deploy or export it"
    fi
    
    local auth_header=""
    if [ -n "$CRON_SECRET" ]; then
        auth_header="-H 'Authorization: Bearer ${CRON_SECRET}'"
    fi
    
    ssh "${VPS_USER}@${VPS_HOST}" << EOF
# Create log directory
mkdir -p /home/voteinbi/backups/logs

# Build cron entries
CRON_NOTIFICATION="*/5 * * * * curl -s -o /dev/null -w ''%{http_code}'' ${auth_header} https://${DOMAIN}/api/cron/send-notifications >> /home/voteinbi/backups/logs/cron-notifications.log 2>&1"
CRON_REVEAL="*/2 * * * * curl -s -o /dev/null -w ''%{http_code}'' ${auth_header} https://${DOMAIN}/api/cron/auto-reveal >> /home/voteinbi/backups/logs/cron-reveal.log 2>&1"

# Check if already exists
EXISTING=\$(crontab -l 2>/dev/null || echo "")

if echo "\$EXISTING" | grep -q "send-notifications"; then
    echo "send-notifications cron already exists"
else
    (echo "\$EXISTING"; echo "\$CRON_NOTIFICATION") | crontab -
    echo "Added send-notifications cron (every 5 min)"
fi

EXISTING=\$(crontab -l 2>/dev/null || echo "")
if echo "\$EXISTING" | grep -q "auto-reveal"; then
    echo "auto-reveal cron already exists"
else
    (echo "\$EXISTING"; echo "\$CRON_REVEAL") | crontab -
    echo "Added auto-reveal cron (every 2 min)"
fi

echo ""
echo "Current crontab:"
crontab -l 2>/dev/null || echo "(empty)"
EOF
    
    success "Cron jobs installed"
}

# ─── Remove ──────────────────────────────────────────────────────────
remove_crons() {
    log "Removing cron jobs from VPS..."
    
    ssh "${VPS_USER}@${VPS_HOST}" << 'EOF'
crontab -l 2>/dev/null | grep -v "send-notifications" | grep -v "auto-reveal" | crontab -
echo "Cron jobs removed. Current crontab:"
crontab -l 2>/dev/null || echo "(empty)"
EOF
    
    success "Cron jobs removed"
}

# ─── Status ──────────────────────────────────────────────────────────
status_crons() {
    log "Checking cron jobs on VPS..."
    
    ssh "${VPS_USER}@${VPS_HOST}" << 'EOF'
echo "=== Current Crontab ==="
crontab -l 2>/dev/null || echo "(empty)"

echo ""
echo "=== Recent Logs ==="
if [ -f /home/voteinbi/backups/logs/cron-notifications.log ]; then
    echo "--- send-notifications (last 5 lines) ---"
    tail -5 /home/voteinbi/backups/logs/cron-notifications.log
else
    echo "No send-notifications log found"
fi

if [ -f /home/voteinbi/backups/logs/cron-reveal.log ]; then
    echo "--- auto-reveal (last 5 lines) ---"
    tail -5 /home/voteinbi/backups/logs/cron-reveal.log
else
    echo "No auto-reveal log found"
fi
EOF
}

# ─── Main ────────────────────────────────────────────────────────────
main() {
    local action="${1:-install}"
    
    case "$action" in
        install)
            install_crons
            ;;
        remove)
            remove_crons
            ;;
        status)
            status_crons
            ;;
        *)
            echo "Usage: $0 [install|remove|status]"
            echo ""
            echo "Commands:"
            echo "  install - Setup cron jobs on VPS"
            echo "  remove  - Remove cron jobs from VPS"
            echo "  status  - Check cron job status"
            exit 1
            ;;
    esac
}

main "$@"
