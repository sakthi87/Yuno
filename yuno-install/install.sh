#!/usr/bin/env bash
set -euo pipefail

INSTALL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$INSTALL_ROOT/.." && pwd)"

export INSTALL_ROOT REPO_ROOT
export CONFIG_DIR="${CONFIG_DIR:-/etc/yuno}"
export OFFLINE_INSTALL="${OFFLINE_INSTALL:-false}"

source "$INSTALL_ROOT/lib/logger.sh"
source "$INSTALL_ROOT/lib/prerequisites.sh"
source "$INSTALL_ROOT/lib/prompts.sh"
source "$INSTALL_ROOT/lib/preflight.sh"
source "$INSTALL_ROOT/lib/offline.sh"
source "$INSTALL_ROOT/postgres/setup-database.sh"

init_install_log

echo "Yugabyte Platform Production Installer"
echo "Bundle: $INSTALL_ROOT"
echo "Log:    $INSTALL_LOG_FILE"
echo

run_step "0a" "Pre-flight sizing and bundle checks" check_preflight
run_step "0b" "Validate prerequisites" check_prerequisites
run_step "0c" "Collect customer inputs" prompt_install_inputs

run_step "1a" "Install offline OS packages" install_offline_packages
run_step "1b" "Install PostgreSQL packages" install_local_postgresql
run_step "1c" "Create database and apply migrations" setup_database_and_schema
run_step "1d" "Lock PostgreSQL to local API access only" configure_local_database_only

run_step "2" "Write config and generate API tokens" write_runtime_config

run_step "3" "Test PostgreSQL connectivity" bash "$INSTALL_ROOT/scripts/test-db-connectivity.sh"

run_step "4" "Deploy Platform API" bash "$INSTALL_ROOT/api/deploy-api.sh"

retry_step "5" "API health check" 5 bash "$INSTALL_ROOT/scripts/test-api-health.sh"

run_step "6" "Validate empty read API responses" bash "$INSTALL_ROOT/scripts/validate-empty-api.sh"

run_step "7" "Deploy UI static assets" bash "$INSTALL_ROOT/ui/deploy-ui.sh"

if systemctl is-active yuno-api >/dev/null 2>&1; then
  sudo systemctl restart yuno-api
  retry_step "7b" "API health after UI deploy" 5 bash "$INSTALL_ROOT/scripts/test-api-health.sh"
fi

if [[ "${ENABLE_TLS:-Y}" =~ ^[Yy] ]]; then
  run_step "8a" "Configure TLS (nginx)" bash "$INSTALL_ROOT/scripts/configure-tls.sh"
fi

run_step "8b" "Configure host firewall" bash "$INSTALL_ROOT/scripts/configure-firewall.sh"

install_backup_cron() {
  local cron_line="0 2 * * * root ${YUNO_INSTALL_ROOT}/scripts/backup-database.sh >> ${YUNO_INSTALL_ROOT}/logs/backup.log 2>&1"
  echo "$cron_line" | sudo tee /etc/cron.d/yuno-platform-backup >/dev/null
  sudo chmod 644 /etc/cron.d/yuno-platform-backup
  mkdir -p "${YUNO_INSTALL_ROOT}/scripts"
  cp "$INSTALL_ROOT/scripts/backup-database.sh" "${YUNO_INSTALL_ROOT}/scripts/"
  chmod +x "${YUNO_INSTALL_ROOT}/scripts/backup-database.sh"
  log_success "9" "Daily backup cron installed (02:00)"
}

run_step "9" "Install daily backup cron" install_backup_cron

run_step "10" "Enable systemd services for boot" bash "$INSTALL_ROOT/scripts/enable-systemd-services.sh"

# Copy docs to install root for operators
mkdir -p "${YUNO_INSTALL_ROOT}/docs"
cp "$INSTALL_ROOT/docs/"*.md "${YUNO_INSTALL_ROOT}/docs/" 2>/dev/null || true

SECRETS_FILE="${CONFIG_DIR}/secrets.env"
if [[ -f "$SECRETS_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
fi

cat <<SUMMARY

============================================================
 Yugabyte Platform — production install complete
============================================================
 Company:       ${YUNO_COMPANY_NAME}
 Config:        ${YUNO_CONFIG_PATH}
 Secrets:       ${CONFIG_DIR}/secrets.env  (chmod 600)
 UI/API:        https://${YUNO_PUBLIC_HOST}/  (or http://${YUNO_PUBLIC_HOST}:${YUNO_API_PORT} if TLS skipped)
 Ingest API:    https://${YUNO_PUBLIC_HOST}/api/v1/ingest/*
 Database:      ${PGHOST}:${PGPORT}/${PGDATABASE}  (local only — no direct remote writes)
 Install log:   ${INSTALL_LOG_FILE}

 Agent token:   saved in secrets.env (AGENT_API_TOKEN)
 Admin token:   saved in secrets.env (ADMIN_API_TOKEN)

 Documentation:
   docs/INSTALLATION_AND_SETUP.md
   docs/API_REFERENCE.md

 Next steps:
   1. Open Platform Health → Settings to upload TLS cert and configure LDAP/SSO
   2. Distribute AGENT_API_TOKEN to node agents (HTTPS ingest only)
   3. Services auto-start on reboot (yuno-platform.target)
   4. Upgrade later: scripts/upgrade.sh
============================================================
SUMMARY

log_success "done" "Production install finished"
