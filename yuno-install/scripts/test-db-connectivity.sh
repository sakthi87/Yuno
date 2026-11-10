#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:?}"
: "${PGPORT:?}"
: "${PGDATABASE:?}"
: "${PGUSER:?}"
: "${PGPASSWORD:?}"

export PGPASSWORD

echo "Testing PostgreSQL connectivity to ${PGHOST}:${PGPORT}/${PGDATABASE} as ${PGUSER}..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -c "SELECT 1 AS connectivity_ok;"

echo "Running sample metadata queries..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) AS universes FROM universes;"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -c "SELECT key FROM app_config ORDER BY key LIMIT 5;"
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1 -c "SELECT key FROM platform_settings ORDER BY key;"

echo "Database connectivity validation passed."
