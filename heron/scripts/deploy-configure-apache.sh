#!/usr/bin/env bash
# Configure Apache reverse proxy and Let's Encrypt. Requires SITE_DOMAIN (and optionally LETSENCRYPT_EMAIL) in env.
set -euo pipefail
VHOST="/opt/bitnami/apache/conf/vhosts/heron-cms-proxy.conf"
WEBROOT="/var/lib/letsencrypt-webroot"

if [ -z "${SITE_DOMAIN:-}" ]; then
  echo "SITE_DOMAIN is empty; skipping Apache reverse proxy and Let's Encrypt configuration."
  exit 0
fi

sudo mkdir -p "$WEBROOT/.well-known/acme-challenge"
sudo chown -R bitnami:bitnami "$WEBROOT"

LE_CERT="/etc/letsencrypt/live/${SITE_DOMAIN}/fullchain.pem"
LE_KEY="/etc/letsencrypt/live/${SITE_DOMAIN}/privkey.pem"
BITNAMI_CERT_DIR="/opt/bitnami/apache/conf/bitnami/certs"
BITNAMI_CERT="$BITNAMI_CERT_DIR/server.crt"
BITNAMI_KEY="$BITNAMI_CERT_DIR/server.key"
if [ -f "$LE_CERT" ] && [ -f "$LE_KEY" ]; then
  CERT_FILE="$LE_CERT"
  KEY_FILE="$LE_KEY"
else
  CERT_FILE="$BITNAMI_CERT"
  KEY_FILE="$BITNAMI_KEY"
  if [ ! -f "$BITNAMI_CERT" ] || [ ! -f "$BITNAMI_KEY" ]; then
    echo "Creating self-signed cert for Apache 443..."
    sudo mkdir -p "$BITNAMI_CERT_DIR"
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "$BITNAMI_CERT_DIR/server.key" -out "$BITNAMI_CERT_DIR/server.crt" \
      -subj "/CN=${SITE_DOMAIN}/O=Heron CMS"
    sudo chmod 644 "$BITNAMI_CERT_DIR/server.crt"
    sudo chmod 600 "$BITNAMI_CERT_DIR/server.key"
  fi
fi

sudo tee "$VHOST" > /dev/null <<APACHE
<VirtualHost *:80>
  ServerName ${SITE_DOMAIN}
  Alias /.well-known/acme-challenge $WEBROOT/.well-known/acme-challenge
  <Directory $WEBROOT/.well-known/acme-challenge>
    Require all granted
  </Directory>
  RewriteEngine On
  RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/
  RewriteRule ^(.*)$ https://%{HTTP_HOST}\$1 [R=301,L]
</VirtualHost>
<VirtualHost *:443>
  ServerName ${SITE_DOMAIN}
  SSLEngine on
  SSLCertificateFile "$CERT_FILE"
  SSLCertificateKeyFile "$KEY_FILE"
  ProxyPreserveHost On
  ProxyPass / http://127.0.0.1:3000/
  ProxyPassReverse / http://127.0.0.1:3000/
</VirtualHost>
APACHE

if [ -x /opt/bitnami/apache/bin/apachectl ]; then
  echo "--- Apache configtest ---"
  sudo /opt/bitnami/apache/bin/apachectl configtest || {
    echo "Apache config test failed. Last 30 lines of error log:"
    sudo tail -30 /opt/bitnami/apache/logs/error_log 2>/dev/null || sudo tail -30 /var/log/apache2/error.log 2>/dev/null || true
    exit 1
  }
fi
if [ -x /opt/bitnami/ctlscript.sh ]; then
  sudo /opt/bitnami/ctlscript.sh restart apache || {
    echo "Apache restart failed. Error log:"
    sudo tail -50 /opt/bitnami/apache/logs/error_log 2>/dev/null || sudo journalctl -u bitnami.apache.service -n 30 --no-pager 2>/dev/null || true
    exit 1
  }
else
  sudo systemctl restart apache2 2>/dev/null || sudo systemctl restart httpd 2>/dev/null || true
fi
echo "✓ Apache proxy configured (80 + 443 -> 3000)"

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
    sudo sed -i "s|SSLCertificateFile .*|SSLCertificateFile $LE_CERT|" "$VHOST"
    sudo sed -i "s|SSLCertificateKeyFile .*|SSLCertificateKeyFile $LE_KEY|" "$VHOST"
    if [ -x /opt/bitnami/ctlscript.sh ]; then
      sudo /opt/bitnami/ctlscript.sh restart apache
    else
      sudo systemctl restart apache2 2>/dev/null || sudo systemctl restart httpd 2>/dev/null || true
    fi
  else
    echo "⚠ Certbot did not obtain a certificate (DNS may not point here yet); using existing or self-signed cert"
  fi
  RENEW_HOOK='/opt/bitnami/ctlscript.sh restart apache 2>/dev/null || systemctl restart apache2'
  (sudo crontab -l 2>/dev/null | grep -v certbot; echo "0 0,12 * * * certbot renew -q --deploy-hook \"$RENEW_HOOK\" 2>/dev/null") | sudo crontab - 2>/dev/null || true
fi
