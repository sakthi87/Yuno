#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file.sql.gz>" >&2
  echo "Restores database and restarts API — use before failed upgrade." >&2
  exit 1
fi

INSTALL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="$1"

if [[ -f /etc/yuno/yuno.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/yuno/yuno.env
  set +a
fi

bash "$INSTALL_ROOT/scripts/restore-database.sh" "$FILE"
sudo systemctl restart yuno-api 2>/dev/null || true
echo "Rollback complete from $FILE"
