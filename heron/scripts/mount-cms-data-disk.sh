#!/usr/bin/env bash
# Mount the Lightsail attached data disk at /var/lib/heron-cms/data (CMS_DB_PATH).
# Idempotent: safe on every deploy. One-time: formats a new disk and migrates
# existing SQLite files off the root filesystem onto the block disk.
set -euo pipefail

APP_DIR="${HERON_APP_DIR:-/opt/heron-cms}"
DATA_DIR="${HERON_DATA_DIR:-/var/lib/heron-cms/data}"
MARKER="${HERON_DATA_DISK_MARKER:-/var/lib/heron-cms/.data-on-block-disk}"
FSTAB_TAG="heron-cms-data-disk"
LABEL="HERONCMS"
# Only these devices may be formatted (never "first random disk").
ALLOW_FORMAT_DEVICES="${HERON_ALLOW_FORMAT_DEVICES:-/dev/xvdf /dev/nvme1n1 /dev/sdf}"

log() { echo "[mount-cms-data-disk] $*"; }
die() { log "ERROR: $*"; exit 1; }

if [ "$(id -u)" -ne 0 ]; then
  if ! sudo -n true 2>/dev/null; then
    die "passwordless sudo is required (deploy SSH user must run sudo without a password)"
  fi
  exec sudo -E bash "$0" "$@"
fi

# Prefer CMS_DB_PATH from existing app .env when present
if [ -f "${APP_DIR}/.env" ]; then
  # shellcheck disable=SC1091
  set -a
  # Only pull CMS_DB_PATH; ignore rest / errors from odd lines
  CMS_DB_PATH_FROM_ENV="$(grep -E '^CMS_DB_PATH=' "${APP_DIR}/.env" | tail -1 | cut -d= -f2- | tr -d '\r' || true)"
  set +a
  if [ -n "${CMS_DB_PATH_FROM_ENV:-}" ]; then
    DATA_DIR="$(dirname "$CMS_DB_PATH_FROM_ENV")"
    log "Using data dir from ${APP_DIR}/.env → $DATA_DIR"
  fi
fi

resolve_owner() {
  if id -u bitnami >/dev/null 2>&1; then
    echo "bitnami"
  elif id -u ubuntu >/dev/null 2>&1; then
    echo "ubuntu"
  else
    echo "root"
  fi
}

OWNER="$(resolve_owner)"

device_is_allowlisted_for_format() {
  local dev="$1"
  local real
  real="$(readlink -f "$dev" 2>/dev/null || echo "$dev")"
  local cand
  for cand in $ALLOW_FORMAT_DEVICES; do
    if [ "$dev" = "$cand" ] || [ "$real" = "$(readlink -f "$cand" 2>/dev/null || echo "$cand")" ]; then
      return 0
    fi
  done
  return 1
}

find_device() {
  if [ -n "${HERON_DATA_DEVICE:-}" ]; then
    [ -b "$HERON_DATA_DEVICE" ] || die "HERON_DATA_DEVICE=$HERON_DATA_DEVICE is not a block device"
    echo "$HERON_DATA_DEVICE"
    return 0
  fi
  if [ -b /dev/disk/by-label/"$LABEL" ]; then
    readlink -f /dev/disk/by-label/"$LABEL"
    return 0
  fi
  local cand
  for cand in /dev/xvdf /dev/nvme1n1 /dev/sdf; do
    if [ -b "$cand" ]; then
      echo "$cand"
      return 0
    fi
  done
  return 1
}

stop_heron_app() {
  log "Stopping heron-cms to keep SQLite consistent during migrate..."
  local stopped=0
  # pm2 may live under the deploy user's ~/.local or Bitnami node path
  if sudo -u "$OWNER" bash -lc 'command -v pm2 >/dev/null && pm2 stop heron-cms' 2>/dev/null; then
    stopped=1
  fi
  if sudo -u "$OWNER" env PATH="/opt/bitnami/node/bin:/usr/local/bin:/usr/bin:$PATH" \
    bash -lc 'export PATH="$HOME/.local/bin:$PATH"; command -v pm2 >/dev/null && pm2 stop heron-cms' 2>/dev/null; then
    stopped=1
  fi
  # Kill standalone Next server if still listening on 3000
  if ss -lptn 2>/dev/null | grep -q ':3000'; then
    log "Port 3000 still in use; sending SIGTERM to node server.js processes"
    pkill -f '/opt/heron-cms/server.js' 2>/dev/null || true
    pkill -f 'node server.js' 2>/dev/null || true
    sleep 2
  fi
  if ss -lptn 2>/dev/null | grep -q ':3000'; then
    die "heron still listening on :3000 after stop attempts — refuse to migrate live DB"
  fi
  if [ "$stopped" -eq 1 ]; then
    log "App stopped"
  else
    log "pm2 stop not confirmed (may already be down); port 3000 is clear"
  fi
  # Brief settle so SQLite releases WAL
  sleep 1
  sync
}

ensure_fstab() {
  local uuid="$1"
  if [ -z "$uuid" ]; then
    log "WARN: skipping fstab update (empty UUID)"
    return 0
  fi
  local line="UUID=${uuid} ${DATA_DIR} ext4 defaults,nofail 0 2  # ${FSTAB_TAG}"
  if grep -qF "$FSTAB_TAG" /etc/fstab 2>/dev/null; then
    grep -vF "$FSTAB_TAG" /etc/fstab >/etc/fstab.tmp
    mv /etc/fstab.tmp /etc/fstab
  fi
  echo "$line" >>/etc/fstab
}

# --- already done? ---
if findmnt -n "$DATA_DIR" >/dev/null 2>&1; then
  SRC="$(findmnt -n -o SOURCE "$DATA_DIR")"
  log "Data dir already mounted from $SRC"
  touch "$MARKER"
  chown -R "${OWNER}:${OWNER}" /var/lib/heron-cms || true
  ensure_fstab "$(blkid -s UUID -o value "$SRC" 2>/dev/null || true)"
  exit 0
fi

if ! DEVICE="$(find_device)"; then
  log "ERROR: No data disk device found. Is the Lightsail disk attached?"
  log "Expected one of: /dev/xvdf, /dev/nvme1n1, /dev/sdf, or label $LABEL"
  lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,LABEL || true
  exit 1
fi
log "Using device $DEVICE"

NEED_MIGRATE=0
if [ -f "${DATA_DIR}/cms.db" ]; then
  NEED_MIGRATE=1
fi

if [ "$NEED_MIGRATE" -eq 1 ]; then
  stop_heron_app
fi

NEED_FORMAT=0
if ! blkid "$DEVICE" >/dev/null 2>&1; then
  NEED_FORMAT=1
fi

if [ "$NEED_FORMAT" -eq 1 ]; then
  device_is_allowlisted_for_format "$DEVICE" \
    || die "refusing to format $DEVICE (not in allow-list: $ALLOW_FORMAT_DEVICES). Set HERON_DATA_DEVICE if needed."
  log "Formatting $DEVICE (ext4, label $LABEL) — one-time"
  mkfs.ext4 -F -L "$LABEL" "$DEVICE"
fi

UUID="$(blkid -s UUID -o value "$DEVICE")"
[ -n "$UUID" ] || die "could not read UUID from $DEVICE"

TMP_MOUNT="/mnt/heron-cms-data-setup"
mkdir -p "$TMP_MOUNT" "$(dirname "$DATA_DIR")"

mount "$DEVICE" "$TMP_MOUNT"

# One-time migrate: copy rootfs data onto the disk if disk has no cms.db yet
if [ -f "${DATA_DIR}/cms.db" ] && [ ! -f "${TMP_MOUNT}/cms.db" ]; then
  SRC_SIZE="$(stat -c%s "${DATA_DIR}/cms.db" 2>/dev/null || stat -f%z "${DATA_DIR}/cms.db")"
  [ "${SRC_SIZE:-0}" -gt 100 ] || die "source cms.db is missing or too small (${SRC_SIZE:-0} bytes)"
  log "Migrating existing CMS data from $DATA_DIR → block disk (one-time), size=${SRC_SIZE}"
  rsync -a --delete "${DATA_DIR}/" "${TMP_MOUNT}/"
  DEST_SIZE="$(stat -c%s "${TMP_MOUNT}/cms.db" 2>/dev/null || stat -f%z "${TMP_MOUNT}/cms.db")"
  [ "$DEST_SIZE" -eq "$SRC_SIZE" ] || die "migrate size mismatch: source=$SRC_SIZE dest=$DEST_SIZE"
  BACKUP_DIR="/var/lib/heron-cms/data.rootfs-bak-$(date -u +%Y%m%d%H%M%S)"
  mv "$DATA_DIR" "$BACKUP_DIR"
  mkdir -p "$DATA_DIR"
  log "Rootfs copy kept at $BACKUP_DIR (delete after you confirm the site works)"
elif [ -f "${TMP_MOUNT}/cms.db" ]; then
  log "Block disk already has cms.db; skipping migrate"
  mkdir -p "$DATA_DIR"
elif [ "$NEED_MIGRATE" -eq 1 ]; then
  umount "$TMP_MOUNT" || true
  die "expected to migrate cms.db but disk still has no cms.db after copy"
else
  log "No cms.db on rootfs or disk yet (fresh install); empty disk will be used"
  # Refuse silent empty mount if HERON_REQUIRE_EXISTING_DB=1 (set by deploy for prod)
  if [ "${HERON_REQUIRE_EXISTING_DB:-0}" = "1" ]; then
    umount "$TMP_MOUNT" || true
    die "HERON_REQUIRE_EXISTING_DB=1 but no cms.db at ${DATA_DIR}/cms.db — aborting to avoid empty DB"
  fi
  mkdir -p "$DATA_DIR"
fi

umount "$TMP_MOUNT"
rmdir "$TMP_MOUNT" 2>/dev/null || true

ensure_fstab "$UUID"

mkdir -p "$DATA_DIR"
mount "$DATA_DIR" || die "mount $DATA_DIR failed — data may be in data.rootfs-bak-* and on the block disk; inspect before re-running"
[ -f "$MARKER" ] || touch "$MARKER"

if [ -f "${DATA_DIR}/cms.db" ]; then
  FINAL_SIZE="$(stat -c%s "${DATA_DIR}/cms.db" 2>/dev/null || stat -f%z "${DATA_DIR}/cms.db")"
  log "cms.db on mounted disk: ${FINAL_SIZE} bytes"
  [ "${FINAL_SIZE:-0}" -gt 100 ] || die "mounted cms.db looks empty/corrupt"
elif [ "${HERON_REQUIRE_EXISTING_DB:-0}" = "1" ]; then
  die "after mount, ${DATA_DIR}/cms.db is missing"
fi

chown -R "${OWNER}:${OWNER}" /var/lib/heron-cms

log "Mounted $(findmnt -n -o SOURCE,TARGET,FSTYPE "$DATA_DIR")"
log "Done. Future VM cutovers: detach Lightsail disk and attach to the new instance, then re-run this script."
