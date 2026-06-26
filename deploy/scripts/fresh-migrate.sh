#!/bin/bash
# fresh-migrate.sh — Fresh migrate Supabase (hosted) + MySQL (cPanel VPS)
# Usage: ./fresh-migrate.sh [supabase|mysql|all]
#
# Prasyarat:
# - psql terinstall (apt install postgresql-client)
# - SSH key sudah di-setup ke VPS
# - File deploy/.env.deploy sudah benar (termasuk SUPABASE_DB_URL)
# - File deploy/mysql-backup/.env sudah benar

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/../.."

# Safe .env reader — avoids `source` which breaks on special chars like ' in passwords
read_env() {
    local file="$1" key="$2"
    grep "^${key}=" "$file" 2>/dev/null | head -1 | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

# Load .env.deploy (VPS connection)
ENV_DEPLOY="${SCRIPT_DIR}/../.env.deploy"
[ -f "$ENV_DEPLOY" ] || fail ".env.deploy not found: $ENV_DEPLOY"

VPS_HOST="$(read_env "$ENV_DEPLOY" VPS_HOST)"
VPS_USER="$(read_env "$ENV_DEPLOY" VPS_USER)"
[ -n "$VPS_HOST" ] || fail "VPS_HOST not set in $ENV_DEPLOY"
[ -n "$VPS_USER" ] || VPS_USER="voteinbi"

# Load mysql-backup .env
ENV_MYSQL="${SCRIPT_DIR}/../mysql-backup/.env"
[ -f "$ENV_MYSQL" ] || fail "MySQL .env not found: $ENV_MYSQL"

MYSQL_USER="$(read_env "$ENV_MYSQL" MYSQL_USER)"
MYSQL_PASSWORD="$(read_env "$ENV_MYSQL" MYSQL_PASSWORD)"
MYSQL_DATABASE="$(read_env "$ENV_MYSQL" MYSQL_DATABASE)"

[ -n "$MYSQL_USER" ]     || fail "MYSQL_USER not set in $ENV_MYSQL"
[ -n "$MYSQL_PASSWORD" ] || fail "MYSQL_PASSWORD not set in $ENV_MYSQL"
[ -n "$MYSQL_DATABASE" ] || fail "MYSQL_DATABASE not set in $ENV_MYSQL"

# SQL files
DROP_ALL="${SCRIPT_DIR}/../mysql-backup/drop-all.sql"
SCHEMA="${SCRIPT_DIR}/../mysql-backup/schema.sql"
SEED="${SCRIPT_DIR}/../mysql-backup/seed.sql"
SUPABASE_DROP="${REPO_ROOT}/supabase/scripts/drop_all_tables.sql"
SUPABASE_MIGRATION="${REPO_ROOT}/supabase/migrations/00000000000000_consolidated_migration.sql"
SUPABASE_SEED="${REPO_ROOT}/supabase/seed/seed.sql"

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

# ─── Supabase Fresh Migrate (via psql ke hosted DB) ──────────────────
migrate_supabase() {
    info "Fresh migrate Supabase (hosted)..."

    # Baca DB URL dari .env.deploy
    local DB_URL
    DB_URL="$(read_env "$ENV_DEPLOY" SUPABASE_DB_URL)"
    if [ -z "$DB_URL" ]; then
        fail "SUPABASE_DB_URL not set in $ENV_DEPLOY

  Dapatkan dari: Supabase Dashboard > Settings > Database > Connection string > URI

  Contoh:
    SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
    fi

    # Pastikan psql ada
    command -v psql >/dev/null 2>&1 || fail "psql not found. Install: sudo apt install postgresql-client"

    # Pastikan SQL files ada
    for f in "$SUPABASE_DROP" "$SUPABASE_MIGRATION" "$SUPABASE_SEED"; do
        [ -f "$f" ] || fail "File tidak ditemukan: $f"
    done

    info "[1/3] Drop all tables..."
    psql "$DB_URL" -f "$SUPABASE_DROP" 2>&1 | tail -1

    info "[2/3] Apply migration..."
    psql "$DB_URL" -f "$SUPABASE_MIGRATION" 2>&1 | tail -1

    info "[3/3] Apply seed data..."
    psql "$DB_URL" -f "$SUPABASE_SEED" 2>&1 | tail -1

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

    # Upload SQL files ke VPS
    local REMOTE_DIR="/tmp/votechain-migrate"
    ssh "${VPS_USER}@${VPS_HOST}" "mkdir -p ${REMOTE_DIR}"
    scp "$DROP_ALL" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/drop-all.sql"
    scp "$SCHEMA" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/schema.sql"
    scp "$SEED" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/seed.sql"

    # Pakai --defaults-extra-file supaya password aman dari shell escaping
    ssh "${VPS_USER}@${VPS_HOST}" bash <<REMOTE_SCRIPT
        cat > ${REMOTE_DIR}/mysql.conf <<MYCNF
[client]
user=${MYSQL_USER}
password=${MYSQL_PASSWORD}
database=${MYSQL_DATABASE}
MYCNF

        echo "[1/3] Drop all tables..."
        mysql --defaults-extra-file=${REMOTE_DIR}/mysql.conf < ${REMOTE_DIR}/drop-all.sql
        echo "  -> Done."

        echo "[2/3] Apply schema..."
        mysql --defaults-extra-file=${REMOTE_DIR}/mysql.conf < ${REMOTE_DIR}/schema.sql
        echo "  -> Done."

        echo "[3/3] Apply seed data..."
        mysql --defaults-extra-file=${REMOTE_DIR}/mysql.conf < ${REMOTE_DIR}/seed.sql
        echo "  -> Done."

        rm -rf ${REMOTE_DIR}
        echo "MySQL migrate selesai."
REMOTE_SCRIPT

    ok "MySQL selesai."
}

# ─── Main ────────────────────────────────────────────────────────────
TARGET="${1:-all}"

case "$TARGET" in
    supabase)
        confirm "Supabase (hosted PostgreSQL)"
        migrate_supabase
        ;;
    mysql)
        confirm "MySQL (${MYSQL_DATABASE}@${VPS_HOST})"
        migrate_mysql
        ;;
    all)
        confirm "Supabase (hosted) + MySQL (${VPS_HOST})"
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
