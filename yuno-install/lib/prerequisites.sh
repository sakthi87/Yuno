#!/usr/bin/env bash

detect_offline_mode() {
  if [[ "${OFFLINE_INSTALL:-}" == "true" ]]; then
    log_install "INFO" "Offline install mode enabled (OFFLINE_INSTALL=true)"
    return 0
  fi
  if [[ -d "$INSTALL_ROOT/bundle/backend/node_modules" ]]; then
    export OFFLINE_INSTALL=true
    log_install "INFO" "Offline bundle detected — enabling offline install mode"
  fi
}

check_prerequisites() {
  local missing=0
  detect_offline_mode

  for cmd in bash curl psql; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
      log_failure "0" "Missing prerequisite command: $cmd"
      missing=1
    else
      log_success "0" "Found prerequisite: $cmd"
    fi
  done

  if [[ "$OFFLINE_INSTALL" != "true" ]]; then
    for cmd in node npm; do
      if ! command -v "$cmd" >/dev/null 2>&1; then
        log_failure "0" "Missing prerequisite command: $cmd (or use offline bundle)"
        missing=1
      else
        log_success "0" "Found prerequisite: $cmd"
      fi
    done
  else
    if [[ ! -d "$INSTALL_ROOT/bundle/backend/node_modules" || ! -d "$INSTALL_ROOT/bundle/ui/dist" ]]; then
      log_failure "0" "Offline bundle incomplete — run scripts/build-offline-bundle.sh on build machine"
      missing=1
    else
      log_success "0" "Offline bundle backend + UI present"
    fi
  fi

  if [[ ! -d "$REPO_ROOT/backend/src" ]]; then
    log_failure "0" "Backend source missing under $REPO_ROOT"
    missing=1
  fi

  if [[ $missing -ne 0 ]]; then
    echo "Install prerequisites not met. Review log: $INSTALL_LOG_FILE" >&2
    return 1
  fi

  log_success "0" "All prerequisites validated"
}
