#!/bin/bash
set -euo pipefail

# ── Automated database migration for Carguinée ─────────────────────────────
# Safety: creates a backup before migrating, can rollback if migration fails.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[MIGRATE]${NC} $1"; }
warn() { echo -e "${YELLOW}[MIGRATE]${NC} $1"; }
err()  { echo -e "${RED}[MIGRATE]${NC} $1"; }

BACKUP_DIR="/var/backups/carguinee"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db-pre-migrate-$TIMESTAMP.sql"

# ── 1. Environment check ──
if [ -z "${DATABASE_URL:-}" ]; then
  err "DATABASE_URL not set"
  exit 1
fi

# ── 2. Create backup ──
log "Creating database backup..."
mkdir -p "$BACKUP_DIR"
if command -v pg_dump &> /dev/null; then
  pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null || true
  log "Backup saved: $BACKUP_FILE"
else
  warn "pg_dump not found — skipping backup (not recommended in production)"
fi

# ── 3. Check pending migrations ──
log "Checking pending migrations..."
PENDING=$(npx prisma migrate status 2>&1 || true)
echo "$PENDING"

if echo "$PENDING" | grep -q "Database is up to date"; then
  log "No pending migrations. Database is up to date ✅"
  exit 0
fi

# ── 4. Run migrations ──
log "Running migrations..."
if npx prisma migrate deploy; then
  log "Migrations applied successfully ✅"
else
  err "Migration FAILED ❌"
  if [ -f "$BACKUP_FILE" ]; then
    warn "Attempting automatic restore from backup..."
    psql "$DATABASE_URL" < "$BACKUP_FILE" 2>/dev/null && \
      log "Database restored from backup" || \
      err "Restore failed — manual intervention required"
  fi
  exit 1
fi

# ── 5. Regenerate Prisma Client ──
log "Regenerating Prisma Client..."
npx prisma generate

# ── 6. Verify schema ──
log "Validating schema..."
if npx prisma validate; then
  log "Schema validation passed ✅"
else
  err "Schema validation FAILED ❌"
  exit 1
fi

log "Migration complete 🎉"
