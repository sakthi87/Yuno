#!/usr/bin/env bash
set -euo pipefail

echo "Yugabyte Platform uninstall"
read -r -p "Stop and remove yuno-api service? [y/N]: " STOP_SERVICE
read -r -p "Remove install root /opt/yuno? [y/N]: " REMOVE_ROOT
read -r -p "Drop PostgreSQL database (destructive)? [y/N]: " DROP_DB

if [[ "$STOP_SERVICE" =~ ^[Yy] ]]; then
  sudo systemctl stop yuno-api 2>/dev/null || true
  sudo systemctl disable yuno-api 2>/dev/null || true
  sudo rm -f /etc/systemd/system/yuno-api.service
  sudo systemctl daemon-reload
  echo "Removed systemd service"
fi

if [[ "$REMOVE_ROOT" =~ ^[Yy] ]]; then
  sudo rm -rf /opt/yuno
  echo "Removed /opt/yuno"
fi

if [[ "$DROP_DB" =~ ^[Yy] ]]; then
  if [[ -f /etc/yuno/yuno.env ]]; then
    set -a
    # shellcheck disable=SC1091
    source /etc/yuno/yuno.env
    set +a
  fi
  export PGPASSWORD="${PGPASSWORD:-}"
  sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${PGDATABASE:-yuno_platform};" 2>/dev/null || true
  echo "Database dropped (if existed)"
fi

echo "Uninstall finished. Config preserved at /etc/yuno unless removed manually."
