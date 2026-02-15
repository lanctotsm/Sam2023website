#!/bin/bash
# Lightsail instance startup: install all dependencies for Heron CMS (Ubuntu path).
# Used when NodePreinstalled=false (e.g. ubuntu_22_04). For Bitnami, CloudFormation
# UserData in lightsail-cms.yaml runs the conditional path. Keep in sync with that.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "[startup] Installing base system packages..."
apt-get update -y
apt-get install -y ca-certificates curl gnupg

echo "[startup] Installing Node.js 20 (NodeSource)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "[startup] Installing pm2..."
# Use full path; do not assume npm is in PATH
/usr/bin/npm install -g pm2

echo "[startup] Installing utilities..."
apt-get install -y \
  rsync \
  git \
  unzip \
  jq \
  wget \
  vim \
  net-tools \
  htop \
  ufw

echo "[startup] Creating app and data directories..."
mkdir -p /opt/heron-cms
chown -R ubuntu:ubuntu /opt/heron-cms
mkdir -p /var/lib/heron-cms/data
chown -R ubuntu:ubuntu /var/lib/heron-cms

# Signal startup complete (deploy workflow polls for this)
touch /var/lib/heron-cms/.startup-done

echo "[startup] Done."
