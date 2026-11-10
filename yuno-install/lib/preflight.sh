#!/usr/bin/env bash

check_preflight() {
  local min_mem_mb=4096
  local min_disk_gb=20
  local min_cpus=2

  log_install "INFO" "Running production pre-flight checks"

  if command -v nproc >/dev/null 2>&1; then
    local cpus
    cpus="$(nproc)"
    if [[ "$cpus" -lt "$min_cpus" ]]; then
      log_failure "0" "CPU check failed: ${cpus} cores (minimum ${min_cpus})"
      return 1
    fi
    log_success "0" "CPU check passed: ${cpus} cores"
  fi

  if command -v free >/dev/null 2>&1; then
    local mem_mb
    mem_mb="$(free -m | awk '/^Mem:/{print $2}')"
    if [[ "$mem_mb" -lt "$min_mem_mb" ]]; then
      log_failure "0" "Memory check failed: ${mem_mb}MB (minimum ${min_mem_mb}MB)"
      return 1
    fi
    log_success "0" "Memory check passed: ${mem_mb}MB"
  fi

  local install_root="${YUNO_INSTALL_ROOT:-/opt/yuno}"
  local avail_kb
  avail_kb="$(df -Pk "$install_root" 2>/dev/null | awk 'NR==2 {print $4}' || df -Pk / | awk 'NR==2 {print $4}')"
  local avail_gb=$((avail_kb / 1024 / 1024))
  if [[ "$avail_gb" -lt "$min_disk_gb" ]]; then
    log_failure "0" "Disk check failed: ${avail_gb}GB free (minimum ${min_disk_gb}GB)"
    return 1
  fi
  log_success "0" "Disk check passed: ${avail_gb}GB free"

  if [[ "${OFFLINE_INSTALL:-false}" == "true" ]]; then
    if [[ ! -d "$INSTALL_ROOT/bundle/backend/node_modules" ]]; then
      log_failure "0" "Offline bundle missing at $INSTALL_ROOT/bundle — run scripts/build-offline-bundle.sh on build machine"
      return 1
    fi
    log_success "0" "Offline bundle detected"
  fi

  log_success "0" "Pre-flight checks passed"
}

generate_api_tokens() {
  if command -v openssl >/dev/null 2>&1; then
    AGENT_API_TOKEN="$(openssl rand -hex 32)"
    ADMIN_API_TOKEN="$(openssl rand -hex 32)"
  else
    AGENT_API_TOKEN="$(date +%s | shasum -a 256 | cut -c1-64)"
    ADMIN_API_TOKEN="$(date +%s | shasum -a 256 | cut -c1-64)"
  fi
  export AGENT_API_TOKEN ADMIN_API_TOKEN
  log_success "2" "Generated AGENT_API_TOKEN and ADMIN_API_TOKEN"
}

secure_config_permissions() {
  local config_file="${YUNO_CONFIG_PATH:-/etc/yuno/yuno.env}"
  local secrets_file="${CONFIG_DIR:-/etc/yuno}/secrets.env"

  if [[ -f "$config_file" ]]; then
    chmod 640 "$config_file" 2>/dev/null || sudo chmod 640 "$config_file"
  fi
  if [[ -f "$secrets_file" ]]; then
    chmod 600 "$secrets_file" 2>/dev/null || sudo chmod 600 "$secrets_file"
  fi

  log_success "2" "Secured config file permissions (640/600)"
}
