#!/usr/bin/env bash

install_local_postgresql() {
  if [[ ! "$INSTALL_LOCAL_PG" =~ ^[Yy] ]]; then
    log_install "INFO" "Skipping local PostgreSQL package install (using existing server)"
    return 0
  fi

  if command -v psql >/dev/null 2>&1 && pg_isready -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1; then
    log_success "1" "PostgreSQL already running on ${PGHOST}:${PGPORT}"
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y postgresql postgresql-contrib
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y postgresql-server postgresql
    sudo postgresql-setup --initdb 2>/dev/null || true
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y postgresql-server postgresql
    sudo postgresql-setup initdb 2>/dev/null || true
  elif command -v brew >/dev/null 2>&1; then
    brew install postgresql@15 || brew install postgresql
    brew services start postgresql@15 2>/dev/null || brew services start postgresql
  else
    log_failure "1" "Unsupported OS for automatic PostgreSQL install"
    return 1
  fi

  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
  fi

  log_success "1" "Local PostgreSQL packages installed"
}

setup_database_and_schema() {
  export PGPASSWORD

  if [[ "$INSTALL_LOCAL_PG" =~ ^[Yy] ]] && [[ "$PGHOST" == "127.0.0.1" || "$PGHOST" == "localhost" ]]; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${PGUSER}') THEN CREATE ROLE ${PGUSER} LOGIN PASSWORD '${PGPASSWORD}'; END IF; END \$\$;" 2>/dev/null \
      || psql -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${PGUSER}') THEN CREATE ROLE ${PGUSER} LOGIN PASSWORD '${PGPASSWORD}'; END IF; END \$\$;"
    sudo -u postgres psql -v ON_ERROR_STOP=1 -c "SELECT 'CREATE DATABASE ${PGDATABASE} OWNER ${PGUSER}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${PGDATABASE}')\gexec" 2>/dev/null \
      || psql -v ON_ERROR_STOP=1 -c "SELECT 'CREATE DATABASE ${PGDATABASE} OWNER ${PGUSER}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${PGDATABASE}')\gexec"
  fi

  for migration in "$INSTALL_ROOT/migrations/"*.sql; do
    log_install "INFO" "Applying migration $(basename "$migration")"
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -f "$migration"
  done

  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -c \
    "UPDATE app_config SET value_json = to_json('${YUNO_COMPANY_NAME}'::text)::text WHERE key = 'companyName';"

  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -c \
    "UPDATE platform_settings SET value_json = '{\"companyName\":\"'||replace('${YUNO_COMPANY_NAME}','\"','\\\"')||'\",\"awaitingAgents\":true,\"configuredVia\":\"install\"}', updated_at = NOW() WHERE key = 'install';"

  log_success "1" "Database ${PGDATABASE} created and migrations applied"
}

configure_local_database_only() {
  log_install "INFO" "PostgreSQL accepts local connections only — agents must use HTTPS ingest API"
  if [[ -d /etc/postgresql ]]; then
    local pg_hba
    pg_hba="$(find /etc/postgresql -name pg_hba.conf | head -1)"
    if [[ -n "$pg_hba" ]]; then
      if ! grep -q "yuno-local-api-only" "$pg_hba" 2>/dev/null; then
        echo "# yuno-local-api-only" | sudo tee -a "$pg_hba" >/dev/null
        echo "host    ${PGDATABASE}    ${PGUSER}    127.0.0.1/32    scram-sha-256" | sudo tee -a "$pg_hba" >/dev/null
        sudo systemctl restart postgresql
      fi
    fi
  fi
  log_success "1" "Database restricted to localhost (API is the only ingestion path)"
}

configure_remote_database_access() {
  log_install "INFO" "Skipped — production installs do not expose PostgreSQL to remote nodes"
}
