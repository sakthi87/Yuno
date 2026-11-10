#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:${PORT:-8080}/api/v1}"

if [[ -z "${AGENT_API_TOKEN:-}" && -f /etc/yuno/secrets.env ]]; then
  # shellcheck disable=SC1091
  source /etc/yuno/secrets.env
fi

: "${AGENT_API_TOKEN:?Set AGENT_API_TOKEN or install secrets.env}"

echo "Testing ingest API with agent token..."

curl -fsS -X POST "${API_BASE}/ingest/universes" \
  -H "Authorization: Bearer ${AGENT_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uni-install-test",
    "name": "install-test",
    "cloud": "AWS",
    "environment": "DEV",
    "region": "us-east-1",
    "ybVersion": "2.25.1.0",
    "owner": "Install Validation",
    "status": "HEALTHY",
    "health": {},
    "issues": [],
    "nodes": ["node-01"]
  }'

echo
echo "Ingest write test passed."
