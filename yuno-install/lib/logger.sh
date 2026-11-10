#!/usr/bin/env bash
# Structured install logging — SUCCESS | RETRY | FAILURE

INSTALL_LOG_DIR="${INSTALL_LOG_DIR:-${YUNO_INSTALL_ROOT:-/opt/yuno}/logs}"
INSTALL_LOG_FILE="${INSTALL_LOG_FILE:-}"

init_install_log() {
  mkdir -p "$INSTALL_LOG_DIR"
  if [[ -z "$INSTALL_LOG_FILE" ]]; then
    INSTALL_LOG_FILE="${INSTALL_LOG_DIR}/install-$(date +%Y%m%d-%H%M%S).log"
  fi
  touch "$INSTALL_LOG_FILE"
  log_install "INFO" "Install log: $INSTALL_LOG_FILE"
}

_log_line() {
  local level="$1"
  local step="$2"
  local message="$3"
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  printf '[%s] [%s] [step:%s] %s\n' "$ts" "$level" "$step" "$message" | tee -a "$INSTALL_LOG_FILE"
}

log_install() {
  _log_line "$1" "${CURRENT_STEP:-0}" "$2"
}

log_success() {
  _log_line "SUCCESS" "$1" "$2"
}

log_retry() {
  _log_line "RETRY" "$1" "$2"
}

log_failure() {
  _log_line "FAILURE" "$1" "$2" >&2
}

run_step() {
  local step="$1"
  local title="$2"
  shift 2
  CURRENT_STEP="$step"
  log_install "INFO" "BEGIN $title"
  if "$@"; then
    log_success "$step" "COMPLETED $title"
    return 0
  fi
  log_failure "$step" "FAILED $title"
  return 1
}

retry_step() {
  local step="$1"
  local title="$2"
  local attempts="$3"
  shift 3
  local n=1
  while [[ $n -le $attempts ]]; do
    if "$@"; then
      log_success "$step" "COMPLETED $title"
      return 0
    fi
    log_retry "$step" "Attempt $n/$attempts failed for $title"
    n=$((n + 1))
    sleep 2
  done
  log_failure "$step" "FAILED $title after $attempts attempts"
  return 1
}
