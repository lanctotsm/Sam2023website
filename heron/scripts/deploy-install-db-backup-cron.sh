#!/usr/bin/env bash
# Install weekly SQLite → S3 backup cron (Sunday 03:15 UTC).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy-runtime.sh
source "$SCRIPT_DIR/deploy-runtime.sh"
deploy_runtime_detect

APP_DIR="/opt/heron-cms"
LOG_FILE="/var/log/heron-cms-db-backup.log"
CRON_MARK="# heron-cms-db-backup"
CRON_LINE="15 3 * * 0 cd ${APP_DIR} && set -a && [ -f .env ] && . ./.env && set +a && export PATH=\"${DEPLOY_NODE_BIN_DIR}:/usr/local/bin:/usr/bin:\$HOME/.local/bin:\$PATH\" && /usr/bin/env node scripts/backup-cms-db.cjs >> ${LOG_FILE} 2>&1 ${CRON_MARK}"

sudo touch "$LOG_FILE"
sudo chown "$DEPLOY_USER:$DEPLOY_USER" "$LOG_FILE"

( crontab -l 2>/dev/null | grep -v "$CRON_MARK" || true
  echo "$CRON_LINE"
) | crontab -

echo "✓ Weekly DB backup cron installed (Sun 03:15 UTC, retain \${CMS_DB_BACKUP_RETAIN_WEEKS:-8} weeks via backup-cms-db.cjs)"
crontab -l | grep "$CRON_MARK" || true
