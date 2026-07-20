#!/usr/bin/env bash
# Mount the Lightsail attached data disk at /var/lib/heron-cms/data (CMS_DB_PATH).
# Idempotent: safe on every deploy. One-time: formats a new disk and migrates
# existing SQLite files off the root filesystem onto the block disk.
set -euo pipefail

DATA_DIR="${HERON_DATA_DIR:-/var/lib/heron-cms/data}"
MARKER="${HERON_DATA_DISK_MARKER:-/var/lib/heron-cms/.data-on-block-disk}"
FSTAB_TAG="heron-cms-data-disk"
LABEL="HERONCMS"

log() { echo "[mount-cms-data-disk] $*"; }

if [ "$(id -u)" -ne 0 ]; then
  exec sudo -E bash "$0" "$@"
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

find_device() {
  if [ -n "${HERON_DATA_DEVICE:-}" ] && [ -b "$HERON_DATA_DEVICE" ]; then
    echo "$HERON_DATA_DEVICE"
    return 0
  fi
  if [ -b /dev/disk/by-label/"$LABEL" ]; then
    readlink -f /dev/disk/by-label/"$LABEL"
    return 0
  fi
  # Prefer classic Lightsail attach path, then NVMe secondary disk
  for cand in /dev/xvdf /dev/nvme1n1 /dev/sdf; do
    if [ -b "$cand" ]; then
      echo "$cand"
      return 0
    fi
  done
  # Fallback: first disk that is not the root disk
  local root_src root_pk
  root_src="$(findmnt -n -o SOURCE / || true)"
  root_pk="$(lsblk -no PKNAME "$root_src" 2>/dev/null || true)"
  while read -r name typ; do
    [ "$typ" = "disk" ] || continue
    [ "$name" = "$root_pk" ] && continue
    if [ -b "/dev/$name" ]; then
      echo "/dev/$name"
      return 0
    fi
  done < <(lsblk -dn -o NAME,TYPE)
  return 1
}

already_mounted_ok() {
  findmnt -n "$DATA_DIR" >/dev/null 2>&1 && [ -f "$MARKER" ]
}

if already_mounted_ok; then
  log "Already mounted: $(findmnt -n -o SOURCE,TARGET,FSTYPE "$DATA_DIR")"
  exit 0
fi

if ! DEVICE="$(find_device)"; then
  log "ERROR: No data disk device found. Is the Lightsail disk attached?"
  lsblk -o NAME,SIZE,TYPE,MOUNTPOINT || true
  exit 1
fi
log "Using device $DEVICE"

# Stop app briefly if migrating (best-effort)
if command -v pm2 >/dev/null 2>&1; then
  sudo -u "$OWNER" bash -lc 'pm2 stop heron-cms' 2>/dev/null || true
elif [ -n "${SUDO_USER:-}" ]; then
  sudo -u "$SUDO_USER" bash -lc 'pm2 stop heron-cms' 2>/dev/null || true
fi

NEED_FORMAT=0
if ! blkid "$DEVICE" >/dev/null 2>&1; then
  NEED_FORMAT=1
fi

if [ "$NEED_FORMAT" -eq 1 ]; then
  log "Formatting $DEVICE (ext4, label $LABEL) — one-time"
  mkfs.ext4 -F -L "$LABEL" "$DEVICE"
fi

UUID="$(blkid -s UUID -o value "$DEVICE")"
if [ -z "$UUID" ]; then
  log "ERROR: could not read UUID from $DEVICE"
  exit 1
fi

TMP_MOUNT="/mnt/heron-cms-data-setup"
mkdir -p "$TMP_MOUNT" "$DATA_DIR"

# If DATA_DIR is already a mount of this UUID, just ensure marker/fstab
if findmnt -n "$DATA_DIR" >/dev/null 2>&1; then
  SRC="$(findmnt -n -o SOURCE "$DATA_DIR")"
  if [ "$(blkid -s UUID -o value "$SRC" 2>/dev/null || true)" = "$UUID" ] || [ "$SRC" = "$DEVICE" ]; then
    touch "$MARKER"
    chown -R "${OWNER}:${OWNER}" /var/lib/heron-cms
    log "Data dir already on block disk"
    exit 0
  fi
  log "ERROR: $DATA_DIR is mounted from unexpected source: $SRC"
  exit 1
fi

mount "$DEVICE" "$TMP_MOUNT"

# One-time migrate: copy rootfs data onto the disk if disk looks empty of cms.db
if [ -f "$DATA_DIR/cms.db" ] && [ ! -f "$TMP_MOUNT/cms.db" ]; then
  log "Migrating existing CMS data from $DATA_DIR → block disk (one-time)"
  rsync -a "$DATA_DIR"/ "$TMP_MOUNT"/
  BACKUP_DIR="/var/lib/heron-cms/data.rootfs-bak-$(date -u +%Y%m%d%H%M%S)"
  mv "$DATA_DIR" "$BACKUP_DIR"
  mkdir -p "$DATA_DIR"
  log "Rootfs copy kept at $BACKUP_DIR (delete after you confirm the site works)"
elif [ -f "$TMP_MOUNT/cms.db" ]; then
  log "Block disk already has cms.db; skipping migrate"
  mkdir -p "$DATA_DIR"
else
  log "No cms.db on rootfs or disk yet (fresh install); empty disk will be used"
  mkdir -p "$DATA_DIR"
fi

umount "$TMP_MOUNT"
rmdir "$TMP_MOUNT" 2>/dev/null || true

# fstab (idempotent)
FSTAB_LINE="UUID=${UUID} ${DATA_DIR} ext4 defaults,nofail 0 2"
if grep -q "$FSTAB_TAG\|${DATA_DIR}" /etc/fstab 2>/dev/null; then
  # Replace any prior heron data mount lines
  grep -v "$FSTAB_TAG" /etc/fstab | grep -v " ${DATA_DIR} " >/etc/fstab.tmp || true
  mv /etc/fstab.tmp /etc/fstab
fi
echo "${FSTAB_LINE}  # ${FSTAB_TAG}" >>/etc/fstab

mkdir -p "$DATA_DIR"
mount "$DATA_DIR"
touch "$MARKER"
chown -R "${OWNER}:${OWNER}" /var/lib/heron-cms

log "Mounted $(findmnt -n -o SOURCE,TARGET,FSTYPE "$DATA_DIR")"
log "Done. Future VM cutovers: detach disk '${LABEL}' / Lightsail disk and attach to the new instance, then re-run this script (no DB copy)."
