#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.sql.gz>" >&2
  exit 1
fi

: "${PGHOST:?}"
: "${PGPORT:?}"
: "${PGDATABASE:?}"
: "${PGUSER:?}"
: "${PGPASSWORD:?}"

FILE="$1"
[[ -f "$FILE" ]] || { echo "Backup file not found: $FILE" >&2; exit 1; }

export PGPASSWORD
echo "Restoring ${PGDATABASE} from ${FILE}..."
gunzip -c "$FILE" | psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1
echo "Restore complete."
