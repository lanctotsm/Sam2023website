#!/usr/bin/env bash
# Provision an Ubuntu Lightsail nano as the Heron CMS runtime image.
# Installs Node 24, Apache (proxy modules), pm2, certbot helpers, and app dirs.
# Idempotent - safe to re-run.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

RUNTIME_USER="${RUNTIME_USER:-ubuntu}"
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

echo "[provision] Enable Ubuntu universe (certbot is not in main)..."
# Lightsail Ubuntu OS blueprints often ship with only main enabled. No Certbot PPA
# needed - packages come from archive.ubuntu.com universe.
# https://packages.ubuntu.com/jammy/certbot
#
# Minimal images often fail apt-get update after enabling universe because the
# command-not-found post-invoke hook looks for missing */universe_cnf_Commands-*
# files. Disable that hook for provisioning (not needed on a server image).
printf 'APT::Update::Post-Invoke-Success {};\n' >/etc/apt/apt.conf.d/99disable-cnf-update

apt-get update -y
apt-get install -y software-properties-common
add-apt-repository -y universe
# Fresh lists after component change (avoids partial/stale index races)
rm -rf /var/lib/apt/lists/*
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
  certbot

# OS package updates come only from rebuilding the runtime image / host via GitHub
# Actions. apt-daily on a 512MB nano can OOM the guest and take the site down.
echo "[provision] Disable apt-daily / unattended upgrades (updates via host rebuild pipeline)..."
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "0";
APT::Periodic::Unattended-Upgrade "0";
APT::Periodic::Download-Upgradeable-Packages "0";
APT::Periodic::AutocleanInterval "0";
EOF
systemctl stop apt-daily.service apt-daily-upgrade.service 2>/dev/null || true
systemctl stop apt-daily.timer apt-daily-upgrade.timer unattended-upgrades.service 2>/dev/null || true
systemctl disable apt-daily.timer apt-daily-upgrade.timer unattended-upgrades.service 2>/dev/null || true
systemctl mask apt-daily.timer apt-daily-upgrade.timer unattended-upgrades.service 2>/dev/null || true
apt-get remove -y unattended-upgrades apt-listchanges 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -q "v${NODE_MAJOR}"; then
  echo "[provision] Installing Node.js ${NODE_MAJOR} from NodeSource..."
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
