#!/usr/bin/env bash
# Detect Bitnami vs Ubuntu/custom Heron runtime image and export deploy paths.
# Primary path: Ubuntu nano launched from heron-runtime-* Lightsail snapshots.
# Bitnami detection remains for cutover from deprecated blueprints.
# Source from other deploy scripts: source "$(dirname "$0")/deploy-runtime.sh" && deploy_runtime_detect
set -euo pipefail

deploy_runtime_detect() {
  if [ -x /opt/bitnami/node/bin/node ]; then
    DEPLOY_VENDOR=bitnami
    DEPLOY_USER="${LIGHTSAIL_DEPLOY_USER:-bitnami}"
    DEPLOY_NODE_BIN_DIR=/opt/bitnami/node/bin
    DEPLOY_VHOST_PATH=/opt/bitnami/apache/conf/vhosts/heron-cms-proxy.conf
    DEPLOY_APACHE_CTL=/opt/bitnami/apache/bin/apachectl
    DEPLOY_APACHE_RESTART=(sudo /opt/bitnami/ctlscript.sh restart apache)
    DEPLOY_APACHE_CERT_DIR=/opt/bitnami/apache/conf/bitnami/certs
    DEPLOY_APACHE_ERROR_LOG=/opt/bitnami/apache/logs/error_log
  else
    # Ubuntu OS / custom heron-runtime snapshot (system Apache + Node on PATH)
    DEPLOY_VENDOR=ubuntu
    DEPLOY_USER="${LIGHTSAIL_DEPLOY_USER:-ubuntu}"
    if command -v node >/dev/null 2>&1; then
      DEPLOY_NODE_BIN_DIR="$(dirname "$(command -v node)")"
    elif [ -x /usr/local/bin/node ]; then
      DEPLOY_NODE_BIN_DIR=/usr/local/bin
    else
      DEPLOY_NODE_BIN_DIR=/usr/bin
    fi
    DEPLOY_VHOST_PATH=/etc/apache2/sites-available/heron-cms-proxy.conf
    DEPLOY_APACHE_CTL=/usr/sbin/apache2ctl
    DEPLOY_APACHE_RESTART=(sudo systemctl reload apache2)
    DEPLOY_APACHE_CERT_DIR=/etc/ssl/heron-cms
    DEPLOY_APACHE_ERROR_LOG=/var/log/apache2/error.log
  fi

  # Keep home aligned with DEPLOY_USER (override with DEPLOY_HOME if needed).
  DEPLOY_HOME="${DEPLOY_HOME:-/home/${DEPLOY_USER}}"

  export DEPLOY_VENDOR DEPLOY_USER DEPLOY_HOME DEPLOY_NODE_BIN_DIR
  export DEPLOY_VHOST_PATH DEPLOY_APACHE_CTL DEPLOY_APACHE_CERT_DIR DEPLOY_APACHE_ERROR_LOG
  export PATH="${DEPLOY_NODE_BIN_DIR}:/usr/local/bin:/usr/bin:${DEPLOY_HOME}/.local/bin:${PATH}"
}

deploy_runtime_node_ready() {
  # Require a real node binary — markers alone must not short-circuit a broken host.
  if [ -n "${DEPLOY_NODE_BIN_DIR:-}" ] && [ -x "${DEPLOY_NODE_BIN_DIR}/node" ]; then
    return 0
  fi
  if [ -x /opt/bitnami/node/bin/node ] || [ -x /usr/local/bin/node ] || [ -x /usr/bin/node ]; then
    return 0
  fi
  if command -v node >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

deploy_runtime_restart_apache() {
  if [ "$DEPLOY_VENDOR" = bitnami ] && [ -x /opt/bitnami/ctlscript.sh ]; then
    sudo /opt/bitnami/ctlscript.sh restart apache
    return
  fi
  # ubuntu / custom runtime image
  sudo a2enmod proxy proxy_http ssl rewrite headers 2>/dev/null || true
  sudo a2ensite heron-cms-proxy.conf 2>/dev/null || true
  sudo "${DEPLOY_APACHE_CTL}" configtest
  sudo systemctl reload apache2
}
