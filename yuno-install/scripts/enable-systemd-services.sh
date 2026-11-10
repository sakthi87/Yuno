#!/usr/bin/env bash
set -euo pipefail

: "${YUNO_INSTALL_ROOT:?}"
: "${INSTALL_ROOT:?}"

log_install() { echo "[systemd] $*"; }

enable_systemd_services() {
  local units=(yuno-api nginx postgresql)

  if [[ -f "$INSTALL_ROOT/api/yuno-platform.target" ]]; then
    sed "s|@YUNO_INSTALL_ROOT@|${YUNO_INSTALL_ROOT}|g" \
      "$INSTALL_ROOT/api/yuno-platform.target" | sudo tee /etc/systemd/system/yuno-platform.target >/dev/null
    units+=(yuno-platform.target)
  fi

  for unit in "${units[@]}"; do
    if systemctl list-unit-files "${unit}.service" >/dev/null 2>&1 || [[ "$unit" == *.target ]]; then
      sudo systemctl enable "$unit" 2>/dev/null || true
      log_install "Enabled ${unit}"
    else
      log_install "Unit ${unit} not found — skip enable (may use postgresql-15 naming)"
      if [[ "$unit" == "postgresql" ]]; then
        for alt in postgresql-15 postgresql-16; do
          if systemctl list-unit-files "${alt}.service" >/dev/null 2>&1; then
            sudo systemctl enable "$alt"
            log_install "Enabled ${alt}"
          fi
        done
      fi
    fi
  done

  sudo systemctl daemon-reload
  sudo systemctl start yuno-platform.target 2>/dev/null || {
    sudo systemctl start postgresql 2>/dev/null || sudo systemctl start postgresql-15 2>/dev/null || true
    sudo systemctl start yuno-api 2>/dev/null || true
    sudo systemctl start nginx 2>/dev/null || true
  }

  log_install "All platform services enabled for boot (RHEL systemd)"
}

enable_systemd_services
