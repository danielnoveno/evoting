#!/bin/bash
# backup-db.sh — Automated PostgreSQL backup from Supabase to local VPS
# Usage: ./backup-db.sh [daily|manual]
# Cron: 0 2 * * * /home/voteinbi/app/deploy/scripts/backup-db.sh daily

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
# Load .env.deploy if present (git-ignored, never committed)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DEPLOY="${SCRIPT_DIR}/../.env.deploy"
if [ -f "$ENV_DEPLOY" ]; then
    set -a; source "$ENV_DEPLOY"; set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/home/voteinbi/backups/database}"
SUPABASE_HOST="${SUPABASE_HOST:?SUPABASE_HOST not set — export it or create deploy/.env.deploy}"
SUPABASE_USER="${SUPABASE_USER:-postgres}"
SUPABASE_DB="${SUPABASE_DB:-postgres}"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/supabase_${DATE}.sql.gz"

# ─── Functions ───────────────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

ensure_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

cleanup_old() {
    local count=$(find "$BACKUP_DIR" -name "supabase_*.sql.gz" -mtime +${RETENTION_DAYS} | wc -l)
    if [ "$count" -gt 0 ]; then
        find "$BACKUP_DIR" -name "supabase_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
        log "Cleaned up $count old backups (>${RETENTION_DAYS} days)"
    fi
}

backup() {
    log "Starting backup from ${SUPABASE_HOST}..."
    
    # Check if pg_dump is available
    if ! command -v pg_dump &> /dev/null; then
        log "ERROR: pg_dump not found. Install postgresql-client first."
        exit 1
    fi
    
    # Perform backup
    PGPASSWORD="${SUPABASE_PASSWORD:-}" pg_dump \
        -h "$SUPABASE_HOST" \
        -U "$SUPABASE_USER" \
        -d "$SUPABASE_DB" \
        --no-owner \
        --no-privileges \
        2>/dev/null | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        local size=$(du -h "$BACKUP_FILE" | cut -f1)
        log "SUCCESS: Backup created — $BACKUP_FILE ($size)"
    else
        log "ERROR: Backup failed"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
}

verify() {
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        log "Verification: Backup file exists and is not empty"
        return 0
    else
        log "ERROR: Verification failed"
        return 1
    fi
}

# ─── Main ────────────────────────────────────────────────────────────
main() {
    local mode="${1:-manual}"
    
    log "=== Database Backup Started (mode: $mode) ==="
    
    ensure_dir
    backup
    verify
    cleanup_old
    
    log "=== Database Backup Completed ==="
}

main "$@"
