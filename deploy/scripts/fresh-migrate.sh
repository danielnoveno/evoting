#!/bin/bash
# fresh-migrate.sh — Fresh migrate Supabase (local) + MySQL (cPanel VPS)
# Usage: ./fresh-migrate.sh [supabase|mysql|all]
#
# Prasyarat:
# - Supabase CLI terinstall (npx supabase)
# - SSH key sudah di-setup ke VPS
# - File deploy/.env.deploy sudah benar
# - File deploy/mysql-backup/.env sudah benar

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/../.."

# Load .env.deploy (VPS connection)
ENV_DEPLOY="${SCRIPT_DIR}/../.env.deploy"
if [ -f "$ENV_DEPLOY" ]; then
    set -a; source "$ENV_DEPLOY"; set +a
fi

# Load mysql-backup .env (MySQL credentials)
ENV_MYSQL="${SCRIPT_DIR}/../mysql-backup/.env"
if [ -f "$ENV_MYSQL" ]; then
    set -a; source "$ENV_MYSQL"; set +a
fi

VPS_HOST="${VPS_HOST:?VPS_HOST not set}"
VPS_USER="${VPS_USER:-voteinbi}"

MYSQL_USER="${MYSQL_USER:?MYSQL_USER not set}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:?MYSQL_PASSWORD not set}"
MYSQL_DATABASE="${MYSQL_DATABASE:?MYSQL_DATABASE not set}"

# SQL files
DROP_ALL="${SCRIPT_DIR}/../mysql-backup/drop-all.sql"
SCHEMA="${SCRIPT_DIR}/../mysql-backup/schema.sql"
SEED="${SCRIPT_DIR}/../mysql-backup/seed.sql"

# ─── Colors ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail()  { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

# ─── Confirmation ────────────────────────────────────────────────────
confirm() {
    local target="$1"
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  WARNING: DESTRUKTIF — SEMUA DATA AKAN HAPUS    ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Target: ${YELLOW}${target}${NC}"
    echo ""
    read -p "  Ketik 'YA' untuk konfirmasi: " answer
    if [ "$answer" != "YA" ]; then
        echo "  Dibatalkan."
        exit 0
    fi
}

# ─── Supabase Fresh Migrate ──────────────────────────────────────────
migrate_supabase() {
    info "Fresh migrate Supabase (local)..."
    cd "$REPO_ROOT"
    npx supabase db reset
    ok "Supabase selesai."
}

# ─── MySQL Fresh Migrate (via SSH) ──────────────────────────────────
migrate_mysql() {
    info "Fresh migrate MySQL di cPanel VPS..."

    # Pastikan file SQL ada
    for f in "$DROP_ALL" "$SCHEMA" "$SEED"; do
        [ -f "$f" ] || fail "File tidak ditemukan: $f"
    done

    info "SSH ke ${VPS_HOST}..."

    # Upload SQL files ke VPS dulu
    local REMOTE_DIR="/tmp/votechain-migrate"
    ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p ${REMOTE_DIR}"
    scp "$DROP_ALL" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/drop-all.sql"
    scp "$SCHEMA" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/schema.sql"
    scp "$SEED" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/seed.sql"

    # Jalankan migrate via SSH
    ssh "${VPS_USER}@${VPS_HOST}" bash <<REMOTE_SCRIPT
        set -euo pipefail

        echo "[1/3] Drop all tables..."
        mysql -u${MYSQL_USER} -p'${MYSQL_PASSWORD}' ${MYSQL_DATABASE} < ${REMOTE_DIR}/drop-all.sql
        echo "  -> Done."

        echo "[2/3] Apply schema..."
        mysql -u${MYSQL_USER} -p'${MYSQL_PASSWORD}' ${MYSQL_DATABASE} < ${REMOTE_DIR}/schema.sql
        echo "  -> Done."

        echo "[3/3] Apply seed data..."
        mysql -u${MYSQL_USER} -p'${MYSQL_PASSWORD}' ${MYSQL_DATABASE} < ${REMOTE_DIR}/seed.sql
        echo "  -> Done."

        # Cleanup
        rm -rf ${REMOTE_DIR}

        echo "MySQL migrate selesai."
REMOTE_SCRIPT

    ok "MySQL selesai."
}

# ─── Main ────────────────────────────────────────────────────────────
TARGET="${1:-all}"

case "$TARGET" in
    supabase)
        confirm "Supabase (local PostgreSQL)"
        migrate_supabase
        ;;
    mysql)
        confirm "MySQL (${MYSQL_DATABASE}@${VPS_HOST})"
        migrate_mysql
        ;;
    all)
        confirm "Supabase (local) + MySQL (${VPS_HOST})"
        migrate_supabase
        migrate_mysql
        ;;
    *)
        echo "Usage: $0 [supabase|mysql|all]"
        exit 1
        ;;
esac

echo ""
ok "Fresh migrate selesai!"
