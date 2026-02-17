#!/usr/bin/env bash
# Restart heron-cms via pm2 (install pm2 if needed, startup, restart/start, save).
set -euo pipefail
cd /opt/heron-cms
export PATH="/opt/bitnami/node/bin:/usr/local/bin:/usr/bin:$HOME/.local/bin:$PATH"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing pm2..."
  NPM_CMD="$(command -v npm 2>/dev/null || echo /opt/bitnami/node/bin/npm)"
  export npm_config_prefix="$HOME/.local"
  mkdir -p "$HOME/.local/bin"
  "$NPM_CMD" install -g pm2
fi

if [ ! -f .env ]; then
  echo "Error: .env file not found. Cannot load environment variables."
  exit 1
fi
set -a; . ./.env; set +a
sudo -n env PATH=$PATH pm2 startup systemd -u bitnami --hp /home/bitnami 2>/dev/null || true

if pm2 show heron-cms > /dev/null 2>&1; then
  pm2 restart heron-cms --update-env
else
  pm2 start server.js --name heron-cms
fi
pm2 save
echo "✓ Services running"
