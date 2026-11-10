#!/usr/bin/env bash
# Mac local development — first-time setup
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "==> Yugabyte Platform — Mac setup"
echo "    Repo: $ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required. Install Node 20+ (brew install node)" >&2
  exit 1
fi

echo "==> Node $(node -v)"
echo "==> Installing dependencies..."
npm install
npm run install:all

mkdir -p backend/data
echo "==> Mac config: packaging/mac/config/yuno.env (SQLite + demo seed)"

cat <<EOF

Setup complete.

Start the platform:
  ./packaging/mac/start.sh

Or from repo root:
  npm run dev:mac

  UI:  http://localhost:5173
  API: http://localhost:3001/api/v1/health

EOF
