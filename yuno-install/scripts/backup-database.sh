#!/usr/bin/env bash
set -euo pipefail

: "${PGHOST:?}"
: "${PGPORT:?}"
: "${PGDATABASE:?}"
: "${PGUSER:?}"
: "${PGPASSWORD:?}"

BACKUP_ROOT="${YUNO_INSTALL_ROOT:-/opt/yuno}/backups"
mkdir -p "$BACKUP_ROOT"
export PGPASSWORD

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="${BACKUP_ROOT}/${PGDATABASE}-${STAMP}.sql.gz"

pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" | gzip > "$FILE"
echo "Backup written: $FILE"

# Retain last 14 backups
ls -1t "${BACKUP_ROOT}/${PGDATABASE}-"*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
