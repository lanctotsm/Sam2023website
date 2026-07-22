#!/usr/bin/env bash
# Disable apt-daily / unattended-upgrades on the live host.
# OS updates land only via the Lightsail runtime bake + host rebuild pipeline.
# Safe / idempotent — also applied at image provision time.
set -euo pipefail

echo "[deploy] Disable apt-daily / unattended upgrades..."

sudo tee /etc/apt/apt.conf.d/20auto-upgrades >/dev/null <<'EOF'
APT::Periodic::Update-Package-Lists "0";
APT::Periodic::Unattended-Upgrade "0";
APT::Periodic::Download-Upgradeable-Packages "0";
APT::Periodic::AutocleanInterval "0";
EOF

sudo systemctl stop apt-daily.timer apt-daily-upgrade.timer apt-daily.service apt-daily-upgrade.service unattended-upgrades.service 2>/dev/null || true
sudo systemctl disable apt-daily.timer apt-daily-upgrade.timer unattended-upgrades.service 2>/dev/null || true
sudo systemctl mask apt-daily.timer apt-daily-upgrade.timer unattended-upgrades.service 2>/dev/null || true

# Best-effort remove; may already be absent on newer runtime images.
sudo env DEBIAN_FRONTEND=noninteractive apt-get -o Dpkg::Lock::Timeout=60 remove -y unattended-upgrades apt-listchanges 2>/dev/null || true

echo "✓ apt-daily / unattended upgrades disabled (OS updates via host rebuild pipeline)"
