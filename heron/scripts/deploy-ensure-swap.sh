#!/usr/bin/env bash
# Ensure a small swapfile on the root disk for RAM spillover during image
# processing. Idempotent — safe on every deploy. Does not use the CMS data disk.
set -euo pipefail

SWAPFILE="${HERON_SWAPFILE:-/swapfile}"
SWAP_SIZE_MB="${HERON_SWAP_SIZE_MB:-1024}"
FSTAB_TAG="heron-cms-swap"
SWAPPINESS="${HERON_SWAPPINESS:-10}"

log() { echo "[deploy-ensure-swap] $*"; }

desired_bytes=$((SWAP_SIZE_MB * 1024 * 1024))

ensure_fstab() {
  if grep -q "$FSTAB_TAG" /etc/fstab 2>/dev/null; then
    return 0
  fi
  # Remove any prior plain entry for this path, then add tagged line.
  sudo sed -i "\#^${SWAPFILE}[[:space:]]#d" /etc/fstab
  echo "${SWAPFILE} none swap sw 0 0  # ${FSTAB_TAG}" | sudo tee -a /etc/fstab >/dev/null
}

ensure_swappiness() {
  local current
  current="$(cat /proc/sys/vm/swappiness)"
  if [ "$current" != "$SWAPPINESS" ]; then
    echo "vm.swappiness=${SWAPPINESS}" | sudo tee /etc/sysctl.d/99-heron-cms-swappiness.conf >/dev/null
    sudo sysctl -w "vm.swappiness=${SWAPPINESS}" >/dev/null
  fi
}

if swapon --show=NAME --noheadings 2>/dev/null | grep -qx "$SWAPFILE"; then
  actual_bytes="$(stat -c%s "$SWAPFILE" 2>/dev/null || echo 0)"
  if [ "$actual_bytes" -eq "$desired_bytes" ]; then
    ensure_fstab
    ensure_swappiness
    log "Already active: ${SWAPFILE} (${SWAP_SIZE_MB}MB), swappiness=$(cat /proc/sys/vm/swappiness)"
    exit 0
  fi
  log "Size mismatch (have ${actual_bytes}, want ${desired_bytes}); recreating"
  sudo swapoff "$SWAPFILE" || true
fi

if [ -f "$SWAPFILE" ]; then
  # Not active or wrong size — replace cleanly.
  sudo swapoff "$SWAPFILE" 2>/dev/null || true
  sudo rm -f "$SWAPFILE"
fi

log "Creating ${SWAP_SIZE_MB}MB swapfile at ${SWAPFILE}"
# fallocate is fast on ext4; dd fallback if the filesystem rejects it for swap.
if ! sudo fallocate -l "${SWAP_SIZE_MB}M" "$SWAPFILE" 2>/dev/null; then
  sudo dd if=/dev/zero of="$SWAPFILE" bs=1M count="$SWAP_SIZE_MB" status=none
fi
sudo chmod 600 "$SWAPFILE"
sudo mkswap "$SWAPFILE" >/dev/null
sudo swapon "$SWAPFILE"
ensure_fstab
ensure_swappiness

log "Done. $(free -h | awk '/^Swap:/ {print "Swap:", $2, "total,", $3, "used"}')"
swapon --show
