#!/usr/bin/env bash
# Restart heron-cms via pm2 (install/repair pm2 if needed, startup, restart/start, save).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy-runtime.sh
source "$SCRIPT_DIR/deploy-runtime.sh"
deploy_runtime_detect

cd /opt/heron-cms

ensure_pm2() {
  local npm_cmd
  npm_cmd="$(command -v npm 2>/dev/null || echo "${DEPLOY_NODE_BIN_DIR}/npm")"
  # Always use the deploy user's home (not a mismatched $HOME).
  export npm_config_prefix="${DEPLOY_HOME}/.local"
  mkdir -p "${DEPLOY_HOME}/.local/bin"
  export PATH="${DEPLOY_HOME}/.local/bin:${PATH}"

  # Binary on PATH is not enough — Node 24 rejects a corrupt pm2 package.json.
  if command -v pm2 >/dev/null 2>&1 && pm2 -v >/dev/null 2>&1; then
    return 0
  fi

  echo "Installing/repairing pm2 under ${DEPLOY_HOME}/.local ..."
  rm -rf \
    "${DEPLOY_HOME}/.local/lib/node_modules/pm2" \
    "${DEPLOY_HOME}/.local/lib/node_modules/.pm2-"* \
    "${DEPLOY_HOME}/.local/bin/pm2" \
    "${DEPLOY_HOME}/.local/bin/pm2-"* \
    2>/dev/null || true
  "$npm_cmd" install -g pm2
  command -v pm2 >/dev/null 2>&1
  pm2 -v
}

ensure_pm2

if [ ! -f .env ]; then
  echo "Error: .env file not found. Cannot load environment variables."
  exit 1
fi
set -a; . ./.env; set +a

sudo -n env PATH="$PATH" pm2 startup systemd -u "$DEPLOY_USER" --hp "$DEPLOY_HOME" 2>/dev/null || true

if pm2 show heron-cms > /dev/null 2>&1; then
  pm2 restart heron-cms --update-env
else
  pm2 start server.js --name heron-cms
fi
pm2 save
echo "✓ Services running ($DEPLOY_VENDOR stack)"
