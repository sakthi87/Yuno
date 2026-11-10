#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:${PORT:-8080}/api/v1}"

echo "Validating empty production datasets via API..."

curl -fsS "${API_BASE}/universes" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
items = data.get('items', data if isinstance(data, list) else [])
print('universes:', len(items))
assert isinstance(items, list)
PY

curl -fsS "${API_BASE}/overview/kpis" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print('kpis:', data)
assert data.get('totalUniverses', 0) == 0
PY

curl -fsS "${API_BASE}/vulnerabilities" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
items = data.get('items', [])
print('vulnerabilities:', len(items))
assert len(items) == 0
PY

curl -fsS "${API_BASE}/settings" | python3 - <<'PY'
import json, sys
data = json.load(sys.stdin)
print('settings keys:', list(data.keys()))
assert 'auth' in data
PY

echo "Empty API validation passed."
