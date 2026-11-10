#!/usr/bin/env bash
# Mac local development — run API + UI
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export YUNO_CONFIG_PATH="$ROOT/packaging/mac/config/yuno.env"
export OFFLINE_INSTALL=false
export DB_PATH="$ROOT/backend/data/platform.db"

if [[ ! -d "$ROOT/node_modules" ]] || [[ ! -d "$ROOT/backend/node_modules" ]]; then
  echo "First run — executing setup..."
  "$ROOT/packaging/mac/setup.sh"
fi

echo "Starting Yugabyte Platform (Mac / SQLite)..."
echo "  Config: $YUNO_CONFIG_PATH"
echo "  UI:     http://localhost:5173"
echo "  API:    http://localhost:3001"

npm run dev
