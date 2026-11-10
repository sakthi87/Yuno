#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:${PORT:-8080}/api/v1}"

echo "Checking API health at ${API_BASE}/health ..."
curl -fsS "${API_BASE}/health" | python3 -m json.tool 2>/dev/null || curl -fsS "${API_BASE}/health"
echo
echo "API health check passed."
