#!/bin/bash
set -euo pipefail

# ── Rollback script for Carguinée ──────────────────────────────────────────
# Switches traffic back to the previous deployment slot.

PROD_PATH="/var/www/carguinee"
ACTIVE_SLOT_FILE="$PROD_PATH/active-slot.txt"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[ROLLBACK]${NC} $1"; }
warn() { echo -e "${YELLOW}[ROLLBACK]${NC} $1"; }
err()  { echo -e "${RED}[ROLLBACK]${NC} $1"; }

# ── 1. Determine current and previous slot ──
CURRENT_SLOT=$(cat "$ACTIVE_SLOT_FILE" 2>/dev/null || echo "blue")

if [ "$CURRENT_SLOT" = "blue" ]; then
  PREVIOUS_SLOT="green"
  PREVIOUS_PORT=3002
else
  PREVIOUS_SLOT="blue"
  PREVIOUS_PORT=3001
fi

log "Current slot: $CURRENT_SLOT → Rolling back to: $PREVIOUS_SLOT"

# ── 2. Verify previous slot exists and is runnable ──
if [ ! -d "$PROD_PATH/$PREVIOUS_SLOT/backend/dist" ]; then
  err "Previous slot ($PREVIOUS_SLOT) has no build artifacts!"
  err "Cannot rollback. Manual intervention required."
  exit 1
fi

# ── 3. Start previous slot if not running ──
if ! pm2 list | grep -q "carguinee-$PREVIOUS_SLOT.*online"; then
  log "Starting previous slot: $PREVIOUS_SLOT"
  cd "$PROD_PATH/$PREVIOUS_SLOT"
  pm2 start ecosystem.config.cjs \
    --name "carguinee-$PREVIOUS_SLOT" \
    --env production \
    --cwd .
  sleep 3
fi

# ── 4. Health check on previous slot ──
log "Health checking previous slot on port $PREVIOUS_PORT..."
for i in $(seq 1 5); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PREVIOUS_PORT/api/health" || true)
  if [ "$STATUS" = "200" ]; then
    log "Previous slot is healthy ✅"
    break
  fi
  if [ "$i" = "5" ]; then
    err "Previous slot health check FAILED ❌"
    err "Aborting rollback to prevent downtime"
    exit 1
  fi
  sleep 2
done

# ── 5. Switch traffic ──
log "Switching nginx to port $PREVIOUS_PORT..."
sudo sed -i "s/server 127.0.0.1:[0-9]*/server 127.0.0.1:$PREVIOUS_PORT/g" \
  /etc/nginx/sites-available/carguinee-api.conf
sudo nginx -t
sudo systemctl reload nginx

# ── 6. Update active slot file ──
echo "$PREVIOUS_SLOT" > "$ACTIVE_SLOT_FILE"

# ── 7. Stop failed slot ──
pm2 stop "carguinee-$CURRENT_SLOT" 2>/dev/null || true

# ── 8. Final health check ──
sleep 2
FINAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://carguinee.com/api/health" || true)
if [ "$FINAL_STATUS" = "200" ]; then
  log "Rollback complete ✅ — Production is healthy on slot: $PREVIOUS_SLOT"
else
  err "⚠️  Rollback completed but final health check returned: $FINAL_STATUS"
  err "Manual verification recommended"
fi
