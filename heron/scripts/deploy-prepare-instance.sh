#!/usr/bin/env bash
# Prepare instance: wait for cloud-init/startup, ensure dirs and rsync.
set -euo pipefail

command -v cloud-init >/dev/null 2>&1 && sudo cloud-init status --wait >/dev/null 2>&1 || true
for i in $(seq 1 36); do
  if test -f /var/lib/heron-cms/.startup-done || test -x /opt/bitnami/node/bin/node 2>/dev/null; then
    break
  fi
  echo "Waiting for startup ($i/36)..."; sleep 10
done
sudo mkdir -p /opt/heron-cms /var/lib/heron-cms/data
sudo chown -R bitnami:bitnami /opt/heron-cms /var/lib/heron-cms
command -v rsync >/dev/null 2>&1 || { sudo apt-get update -y && sudo apt-get install -y rsync; }
echo "✓ Instance ready"
