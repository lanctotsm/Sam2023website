#!/usr/bin/env bash
# Provision an Ubuntu Lightsail nano as the Heron CMS runtime image.
# Installs Node.js Active LTS (24), Apache (proxy modules), pm2, certbot helpers, and app dirs.
# Pin Active LTS (not Current): native modules (better-sqlite3) need a stable prod line.
# Idempotent - safe to re-run.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

RUNTIME_USER="${RUNTIME_USER:-ubuntu}"
# Newest Active LTS as of 2026-07 (https://github.com/nodejs/Release). Override only for experiments.
NODE_MAJOR="${NODE_MAJOR:-24}"
IMAGE_VERSION="${IMAGE_VERSION:-dev}"
MARKER="/var/lib/heron-cms/.runtime-image-version"

echo "[provision] Starting Heron runtime provision (Node ${NODE_MAJOR}, version=${IMAGE_VERSION})"

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must run as root (use sudo)." >&2
  exit 1
fi

if ! id -u "$RUNTIME_USER" >/dev/null 2>&1; then
  echo "Runtime user '$RUNTIME_USER' does not exist." >&2
  exit 1
fi

echo "[provision] Enable Ubuntu universe (certbot / apt-listchanges are not in main)..."
# Lightsail Ubuntu OS blueprints often ship with only `main` enabled. No Certbot PPA
# needed - packages come from archive.ubuntu.com universe.
# https://packages.ubuntu.com/jammy/certbot
apt-get update -y
apt-get install -y software-properties-common
add-apt-repository -y universe
apt-get update -y

echo "[provision] apt install base packages..."
apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  jq \
  rsync \
  unzip \
  git \
  openssl \
  apache2 \
  certbot \
  unattended-upgrades \
  apt-listchanges

echo "[provision] Enable unattended security upgrades..."
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
EOF

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "v${NODE_MAJOR}"; then
  echo "[provision] Installing Node.js ${NODE_MAJOR} (Active LTS) from NodeSource..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

node -v
npm -v

echo "[provision] Installing pm2 for ${RUNTIME_USER}..."
sudo -u "$RUNTIME_USER" bash -c '
  export npm_config_prefix="$HOME/.local"
  mkdir -p "$HOME/.local/bin"
  npm install -g pm2
'
# Ensure pm2 is on PATH for login shells
PROFILE_SNIPPET='export PATH="$HOME/.local/bin:$PATH"'
BASHRC="/home/${RUNTIME_USER}/.bashrc"
if [ -f "$BASHRC" ] && ! grep -q '.local/bin' "$BASHRC"; then
  echo "$PROFILE_SNIPPET" >>"$BASHRC"
fi

echo "[provision] Configuring Apache modules..."
a2enmod proxy proxy_http ssl rewrite headers >/dev/null
# Disable default site so only heron vhost (written at deploy time) serves traffic
a2dissite 000-default.conf >/dev/null 2>&1 || true
systemctl enable apache2
systemctl restart apache2

echo "[provision] Creating app and data directories..."
mkdir -p /opt/heron-cms /var/lib/heron-cms/data /etc/ssl/heron-cms /var/lib/letsencrypt-webroot
chown -R "${RUNTIME_USER}:${RUNTIME_USER}" /opt/heron-cms /var/lib/heron-cms /var/lib/letsencrypt-webroot

echo "${IMAGE_VERSION}" >"$MARKER"
chown "${RUNTIME_USER}:${RUNTIME_USER}" "$MARKER"
touch /var/lib/heron-cms/.startup-done
chown "${RUNTIME_USER}:${RUNTIME_USER}" /var/lib/heron-cms/.startup-done

# Drop installer caches so the snapshot stays small
apt-get clean
rm -rf /var/lib/apt/lists/*

echo "[provision] Done. Runtime image version: $(cat "$MARKER")"
echo "[provision] node=$(command -v node) ($(node -v)) pm2=$(sudo -u "$RUNTIME_USER" bash -lc 'command -v pm2 || true')"
