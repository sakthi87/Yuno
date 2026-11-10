#!/usr/bin/env bash
# Run Yuno from prebuilt runtime + frontend/dist (no Docker, no npm, no compile).
# Same pattern as ODP360 scripts/start-prebuilt.sh.
#
# Prerequisites:
#   1. Source cloned from GitHub
#   2. ./scripts/download-prebuilt.sh   # runtime Node + backend/node_modules (+ UI if needed)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p logs backend/data

PORT="${PORT:-3001}"
NODE_BIN=""

resolve_node() {
  if [[ -x "$ROOT/runtime/bin/node" ]]; then
    NODE_BIN="$ROOT/runtime/bin/node"
  elif command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
  else
    echo "ERROR: Node runtime not found."
    echo "Run: ./scripts/download-prebuilt.sh"
    echo "Or install Node 20+ and re-run download so backend/node_modules is present."
    exit 1
  fi
  echo "Using Node: $NODE_BIN ($("$NODE_BIN" -v 2>/dev/null || true))"
}

need_artifacts() {
  if [[ ! -d "$ROOT/backend/node_modules" ]]; then
    echo "ERROR: Missing backend/node_modules"
    echo "Run: ./scripts/download-prebuilt.sh"
    exit 1
  fi
  if [[ ! -f "$ROOT/frontend/dist/index.html" ]]; then
    echo "ERROR: Missing frontend/dist (prebuilt UI)"
    echo "Run: ./scripts/download-prebuilt.sh"
    exit 1
  fi
  if [[ ! -f "$ROOT/backend/src/index.js" ]]; then
    echo "ERROR: Missing backend/src — clone the full repository first."
    exit 1
  fi
}

start_api() {
  local name="yuno-api"
  if [[ -f "logs/${name}.pid" ]]; then
    local old
    old="$(cat "logs/${name}.pid" 2>/dev/null || true)"
    if [[ -n "${old:-}" ]] && kill -0 "$old" 2>/dev/null; then
      echo "Already running: $name (pid $old)"
      return 0
    fi
    rm -f "logs/${name}.pid"
  fi

  echo "Starting $name on :${PORT}"
  # Express serves API + frontend/dist (STATIC_DIR) — one process, like JARs + UI combined.
  nohup env \
    HOST="0.0.0.0" \
    PORT="$PORT" \
    DB_DRIVER="${DB_DRIVER:-sqlite}" \
    DB_PATH="${DB_PATH:-$ROOT/backend/data/platform.db}" \
    AUTO_SEED="${AUTO_SEED:-true}" \
    DEMO_MODE="${DEMO_MODE:-true}" \
    STATIC_DIR="${STATIC_DIR:-$ROOT/frontend/dist}" \
    YUNO_CONFIG_PATH="${YUNO_CONFIG_PATH:-$ROOT/packaging/mac/config/yuno.env}" \
    YUNO_COMPANY_NAME="${YUNO_COMPANY_NAME:-Yuno Platform}" \
    SESSION_SECRET="${SESSION_SECRET:-yuno-demo-session}" \
    "$NODE_BIN" "$ROOT/backend/src/index.js" \
    >"logs/${name}.log" 2>&1 &
  echo $! >"logs/${name}.pid"
}

resolve_node
need_artifacts
start_api

sleep 2
if [[ -f logs/yuno-api.pid ]] && kill -0 "$(cat logs/yuno-api.pid)" 2>/dev/null; then
  echo ""
  echo "Yuno started (prebuilt — no Docker, no npm)."
  echo "  UI + API:  http://localhost:${PORT}"
  echo "  Login:     admin / admin"
  echo "  Health:    http://localhost:${PORT}/api/v1/health"
  echo ""
  echo "Stop with: ./scripts/stop-prebuilt.sh"
  echo "Logs:      logs/yuno-api.log"
else
  echo "ERROR: yuno-api failed to start. See logs/yuno-api.log"
  tail -n 40 logs/yuno-api.log 2>/dev/null || true
  exit 1
fi
