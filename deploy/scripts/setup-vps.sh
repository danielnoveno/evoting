#!/bin/bash
# setup-vps.sh — Complete VPS setup for VoteChain backup deployment
# Usage: ./setup-vps.sh [full|frontend-only|indexer-only|db-only]

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
APP_DIR="/home/voteinbi/app"
BACKUP_DIR="/home/voteinbi/backups"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Functions ───────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

check_system() {
    log "Checking system requirements..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        log "✓ Node.js $(node -v)"
    else
        log "✗ Node.js not found — install via: nvm install 20"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        log "✓ npm $(npm -v)"
    else
        log "✗ npm not found"
        exit 1
    fi
    
    # Check git
    if command -v git &> /dev/null; then
        log "✓ git $(git --version)"
    else
        log "✗ git not found"
        exit 1
    fi
    
    # Check PostgreSQL client
    if command -v pg_dump &> /dev/null; then
        log "✓ pg_dump available"
    else
        log "⚠ pg_dump not found — database backup will fail"
    fi
    
    # Check PM2
    if command -v pm2 &> /dev/null; then
        log "✓ PM2 $(pm2 -v)"
    else
        log "⚠ PM2 not found — will install if needed"
    fi
    
    # Check disk space
    local free=$(df -h /home/voteinbi | awk 'NR==2 {print $4}')
    log "✓ Free disk space: $free"
}

install_system_deps() {
    log "Installing system dependencies..."
    
    # Install PM2
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        pm2 startup
        log "PM2 installed"
    fi
    
    # Create directories
    mkdir -p "$APP_DIR"
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/logs"
    
    log "Directories created"
}

clone_repo() {
    log "Cloning repository..."
    
    if [ -d "$APP_DIR/.git" ]; then
        log "Repository already exists, pulling latest..."
        cd "$APP_DIR"
        git pull origin main
    else
        # Replace with your actual repo URL
        git clone <YOUR_REPO_URL> "$APP_DIR"
        cd "$APP_DIR"
    fi
    
    log "Repository ready"
}

setup_frontend() {
    log "Setting up frontend..."
    
    cd "$APP_DIR"
    bash "${SCRIPT_DIR}/deploy-frontend.sh" server
    
    log "Frontend setup complete"
}

setup_indexer() {
    log "Setting up indexer..."
    
    cd "$APP_DIR"
    bash "${SCRIPT_DIR}/deploy-indexer.sh" install
    bash "${SCRIPT_DIR}/deploy-indexer.sh" setup_env
    bash "${SCRIPT_DIR}/deploy-indexer.sh" start
    
    log "Indexer setup complete"
}

setup_database_backup() {
    log "Setting up database backup..."
    
    # Create backup cron job
    local cron_line="0 2 * * * ${SCRIPT_DIR}/backup-db.sh daily >> ${BACKUP_DIR}/logs/backup.log 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "backup-db.sh"; then
        log "Backup cron job already exists"
    else
        (crontab -l 2>/dev/null; echo "$cron_line") | crontab -
        log "Backup cron job created (daily at 2 AM)"
    fi
    
    log "Database backup setup complete"
}

setup_ssl() {
    log "SSL setup instructions:"
    log "1. Go to cPanel → SSL/TLS → Let's Encrypt"
    log "2. Select votein.biz.id"
    log "3. Click 'Issue'"
    log "4. SSL will auto-renew"
}

setup_domain() {
    log "Domain setup instructions:"
    log "1. Login to your domain registrar"
    log "2. Set nameservers to your VPS nameservers"
    log "3. In cPanel → Zone Editor → Add A record:"
    log "   - Name: @ → Value: $(curl -s ifconfig.me)"
    log "   - Name: www → Value: $(curl -s ifconfig.me)"
}

# ─── Main ────────────────────────────────────────────────────────────
main() {
    local mode="${1:-full}"
    
    log "=== VoteChain VPS Setup Started (mode: $mode) ==="
    
    check_system
    
    case "$mode" in
        full)
            install_system_deps
            clone_repo
            setup_frontend
            setup_indexer
            setup_database_backup
            setup_ssl
            setup_domain
            ;;
        frontend-only)
            install_system_deps
            clone_repo
            setup_frontend
            ;;
        indexer-only)
            install_system_deps
            clone_repo
            setup_indexer
            ;;
        db-only)
            setup_database_backup
            ;;
        *)
            log "Unknown mode: $mode"
            log "Usage: $0 [full|frontend-only|indexer-only|db-only]"
            exit 1
            ;;
    esac
    
    log "=== VoteChain VPS Setup Completed ==="
    log ""
    log "Next steps:"
    log "1. Edit ${APP_DIR}/frontend/.env with production values"
    log "2. Edit ${APP_DIR}/indexer/.env with production values"
    log "3. Configure domain DNS (see logs above)"
    log "4. Setup SSL certificate in cPanel"
    log "5. Test: https://votein.biz.id"
}

main "$@"
