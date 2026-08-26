#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# CarGuinée — Script de backup PostgreSQL
# ══════════════════════════════════════════════════════════════════════════════
#
# Usage:
#   ./scripts/backup-db.sh                    # Backup classique
#   ./scripts/backup-db.sh --cron             # Mode cron (pas de sortie interactive)
#   ./scripts/backup-db.sh --retention 30     # Garder 30 jours de backups
#
# Cron example (backup quotidien à 3h du matin):
#   0 3 * * * /var/www/carguinee/scripts/backup-db.sh --cron --retention 30
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/carguinee}"
DATABASE_URL="${DATABASE_URL:-}"
RETENTION_DAYS="${1:-30}"
CRON_MODE=false

# Parser les arguments
for arg in "$@"; do
  case $arg in
    --cron) CRON_MODE=true ;;
    --retention) shift; RETENTION_DAYS="$1" ;;
  esac
done

# Vérifier que pg_dump est disponible
if ! command -v pg_dump &> /dev/null; then
  echo "❌ pg_dump n'est pas installé."
  exit 1
fi

# Vérifier DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL n'est pas défini."
  exit 1
fi

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"

# ── Générer le nom de fichier ─────────────────────────────────────────────
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/carguinee-${TIMESTAMP}.sql.gz"

# ── Exécuter le backup ────────────────────────────────────────────────────
if [ "$CRON_MODE" = false ]; then
  echo "📦 Début du backup de la base de données..."
fi

pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  if [ "$CRON_MODE" = false ]; then
    echo "✅ Backup créé : $BACKUP_FILE ($FILE_SIZE)"
  fi
else
  echo "❌ Erreur lors du backup."
  exit 1
fi

# ── Rotation : supprimer les backups plus anciens que RETENTION_DAYS ──────
DELETED=$(find "$BACKUP_DIR" -name "carguinee-*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "$CRON_MODE" = false ] && [ "$DELETED" -gt 0 ]; then
  echo "🗑️  $DELETED ancien(s) backup(s) supprimé(s) (> ${RETENTION_DAYS} jours)"
fi

# ── Résumé ────────────────────────────────────────────────────────────────
if [ "$CRON_MODE" = false ]; then
  TOTAL=$(ls "$BACKUP_DIR"/carguinee-*.sql.gz 2>/dev/null | wc -l)
  TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
  echo "📊 Total : $TOTAL backup(s), $TOTAL_SIZE d'espace utilisé"
fi
