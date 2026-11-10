#!/usr/bin/env bash
set -euo pipefail

: "${YUNO_API_PORT:?}"
: "${YUNO_INSTALL_ROOT:?}"

log_install() { echo "[firewall] $*"; }

configure_firewall() {
  local api_port="$YUNO_API_PORT"
  local tls_port="${TLS_PORT:-443}"

  if command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --permanent --add-port="${api_port}/tcp"
    if [[ "${ENABLE_TLS:-false}" == "true" ]]; then
      sudo firewall-cmd --permanent --add-port="${tls_port}/tcp"
    fi
    sudo firewall-cmd --reload
    log_install "firewalld: opened ${api_port}/tcp (and ${tls_port}/tcp if TLS enabled)"
    return 0
  fi

  if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow "${api_port}/tcp"
    if [[ "${ENABLE_TLS:-false}" == "true" ]]; then
      sudo ufw allow "${tls_port}/tcp"
    fi
    log_install "ufw: allowed ${api_port}/tcp"
    return 0
  fi

  log_install "No firewalld/ufw detected — configure network ACLs manually"
  log_install "Recommended: allow ${api_port} to users; block 5432 from external networks"
}

configure_firewall
