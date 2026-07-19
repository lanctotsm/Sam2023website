#!/usr/bin/env bash
# Configure Apache reverse proxy and Let's Encrypt. Requires SITE_DOMAIN (and optionally LETSENCRYPT_EMAIL) in env.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy-runtime.sh
source "$SCRIPT_DIR/deploy-runtime.sh"
deploy_runtime_detect

WEBROOT="/var/lib/letsencrypt-webroot"

if [ -z "${SITE_DOMAIN:-}" ]; then
  echo "SITE_DOMAIN is empty; skipping Apache reverse proxy and Let's Encrypt configuration."
  exit 0
fi

if [ "$DEPLOY_VENDOR" != bitnami ]; then
  if ! command -v apache2 >/dev/null 2>&1; then
    echo "Installing apache2..."
    sudo apt-get update -qq -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq apache2
  fi
  sudo a2enmod proxy proxy_http ssl rewrite headers 2>/dev/null || true
fi

sudo mkdir -p "$WEBROOT/.well-known/acme-challenge"
sudo chown -R "$DEPLOY_USER:$DEPLOY_USER" "$WEBROOT"

LE_CERT="/etc/letsencrypt/live/${SITE_DOMAIN}/fullchain.pem"
LE_KEY="/etc/letsencrypt/live/${SITE_DOMAIN}/privkey.pem"
FALLBACK_CERT="$DEPLOY_APACHE_CERT_DIR/server.crt"
FALLBACK_KEY="$DEPLOY_APACHE_CERT_DIR/server.key"

if [ -f "$LE_CERT" ] && [ -f "$LE_KEY" ]; then
  CERT_FILE="$LE_CERT"
  KEY_FILE="$LE_KEY"
else
  CERT_FILE="$FALLBACK_CERT"
  KEY_FILE="$FALLBACK_KEY"
  if [ ! -f "$FALLBACK_CERT" ] || [ ! -f "$FALLBACK_KEY" ]; then
    echo "Creating self-signed cert for Apache 443..."
    sudo mkdir -p "$DEPLOY_APACHE_CERT_DIR"
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "$FALLBACK_KEY" -out "$FALLBACK_CERT" \
      -subj "/CN=${SITE_DOMAIN}/O=Heron CMS"
    sudo chmod 644 "$FALLBACK_CERT"
    sudo chmod 600 "$FALLBACK_KEY"
  fi
fi

sudo tee "$DEPLOY_VHOST_PATH" > /dev/null <<APACHE
<VirtualHost *:80>
  ServerName ${SITE_DOMAIN}
  Alias /.well-known/acme-challenge ${WEBROOT}/.well-known/acme-challenge
  <Directory ${WEBROOT}/.well-known/acme-challenge>
    Require all granted
  </Directory>
  RewriteEngine On
  RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/
  RewriteRule ^(.*)$ https://%{HTTP_HOST}\$1 [R=301,L]
</VirtualHost>
<VirtualHost *:443>
  ServerName ${SITE_DOMAIN}
  SSLEngine on
  SSLCertificateFile "${CERT_FILE}"
  SSLCertificateKeyFile "${KEY_FILE}"
  ProxyPreserveHost On
  ProxyPass / http://127.0.0.1:3000/
  ProxyPassReverse / http://127.0.0.1:3000/
</VirtualHost>
APACHE

if [ "$DEPLOY_VENDOR" != bitnami ]; then
  sudo ln -sf "$DEPLOY_VHOST_PATH" /etc/apache2/sites-enabled/heron-cms-proxy.conf
fi

if [ -x "$DEPLOY_APACHE_CTL" ]; then
  echo "--- Apache configtest ---"
  sudo "$DEPLOY_APACHE_CTL" configtest || {
    echo "Apache config test failed. Last 30 lines of error log:"
    sudo tail -30 "$DEPLOY_APACHE_ERROR_LOG" 2>/dev/null || true
    exit 1
  }
fi

deploy_runtime_restart_apache
echo "✓ Apache proxy configured (80 + 443 -> 3000, $DEPLOY_VENDOR)"

if [ -n "${LETSENCRYPT_EMAIL:-}" ]; then
  if ! command -v certbot >/dev/null 2>&1; then
    echo "Installing certbot..."
    sudo apt-get update -qq -y
    sudo apt-get install -y -qq certbot
  fi
  if sudo certbot certonly --webroot -w "$WEBROOT" -d "$SITE_DOMAIN" \
    --non-interactive --agree-tos --email "$LETSENCRYPT_EMAIL" \
    --keep-until-expiring 2>/dev/null; then
    echo "✓ Let's Encrypt certificate obtained or already valid"
    sudo sed -i "s|SSLCertificateFile .*|SSLCertificateFile $LE_CERT|" "$DEPLOY_VHOST_PATH"
    sudo sed -i "s|SSLCertificateKeyFile .*|SSLCertificateKeyFile $LE_KEY|" "$DEPLOY_VHOST_PATH"
    deploy_runtime_restart_apache
  else
    echo "⚠ Certbot did not obtain a certificate (DNS may not point here yet); using existing or self-signed cert"
  fi
  if [ "$DEPLOY_VENDOR" = bitnami ]; then
    RENEW_HOOK='/opt/bitnami/ctlscript.sh restart apache 2>/dev/null || systemctl restart apache2'
  else
    RENEW_HOOK='systemctl reload apache2'
  fi
  (sudo crontab -l 2>/dev/null | grep -v certbot; echo "0 0,12 * * * certbot renew -q --deploy-hook \"$RENEW_HOOK\" 2>/dev/null") | sudo crontab - 2>/dev/null || true
fi
