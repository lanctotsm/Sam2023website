#!/usr/bin/env bash
# Prepare instance: wait for cloud-init/startup, ensure dirs and rsync.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy-runtime.sh
source "$SCRIPT_DIR/deploy-runtime.sh"
deploy_runtime_detect

command -v cloud-init >/dev/null 2>&1 && sudo cloud-init status --wait >/dev/null 2>&1 || true
ready=0
for i in $(seq 1 36); do
  if deploy_runtime_node_ready; then
    ready=1
    break
  fi
  echo "Waiting for startup ($i/36)..."; sleep 10
done
if [ "$ready" -ne 1 ]; then
  echo "✗ Runtime not ready after waiting (no Node / runtime markers on $DEPLOY_VENDOR)" >&2
  exit 1
fi

sudo mkdir -p /opt/heron-cms /var/lib/heron-cms/data
sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" /opt/heron-cms /var/lib/heron-cms
command -v rsync >/dev/null 2>&1 || { sudo apt-get update -y && sudo apt-get install -y rsync; }
sudo touch /var/lib/heron-cms/.startup-done
sudo chown "$DEPLOY_USER:$DEPLOY_USER" /var/lib/heron-cms/.startup-done
echo "✓ Instance ready ($DEPLOY_VENDOR stack, user=$DEPLOY_USER)"
