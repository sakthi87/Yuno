#!/usr/bin/env bash
set -euo pipefail

INSTALL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${INSTALL_ROOT}/lib/logger.sh"
source "${INSTALL_ROOT}/postgres/setup-database.sh"

init_install_log

if [[ -f /etc/yuno/yuno.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/yuno/yuno.env
  set +a
fi

: "${PGHOST:?Set PG* vars or install yuno.env first}"
: "${PGPORT:?}"
: "${PGDATABASE:?}"
: "${PGUSER:?}"
: "${PGPASSWORD:?}"

BACKUP="${YUNO_INSTALL_ROOT:-/opt/yuno}/backups/pre-upgrade-$(date +%Y%m%d-%H%M%S).sql.gz"
run_step "U1" "Pre-upgrade backup" bash "$INSTALL_ROOT/scripts/backup-database.sh"

run_step "U2" "Apply migrations" setup_database_and_schema

if systemctl is-active yuno-api >/dev/null 2>&1; then
  run_step "U3" "Restart API" sudo systemctl restart yuno-api
fi

log_success "done" "Upgrade complete. Backup: ${BACKUP}"
