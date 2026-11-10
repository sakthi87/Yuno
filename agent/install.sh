#!/usr/bin/env bash
# Yuno platform agent — enroll + heartbeat loop (demo / Wave 1)
set -euo pipefail

URL=""
TOKEN=""
NODE_ID=""
UNIVERSE_ID=""
HOSTNAME_OVERRIDE=""
INTERVAL=30
ONCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) URL="$2"; shift 2 ;;
    --token) TOKEN="$2"; shift 2 ;;
    --node-id) NODE_ID="$2"; shift 2 ;;
    --universe-id) UNIVERSE_ID="$2"; shift 2 ;;
    --hostname) HOSTNAME_OVERRIDE="$2"; shift 2 ;;
    --interval) INTERVAL="$2"; shift 2 ;;
    --once) ONCE=1; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$URL" || -z "$TOKEN" ]]; then
  echo "Usage: install.sh --url <platform-url> --token <enroll-or-agent-token> [--node-id id] [--universe-id id] [--hostname name] [--once]" >&2
  exit 1
fi

URL="${URL%/}"
HOST_NAME="${HOSTNAME_OVERRIDE:-$(hostname -s 2>/dev/null || hostname || echo agent-host)}"
NODE_ID="${NODE_ID:-node-${HOST_NAME}}"
UNIVERSE_ID="${UNIVERSE_ID:-uni-unknown}"
AGENT_ID="agent-${NODE_ID}"

send_heartbeat() {
  local cpu mem disk
  cpu=$(awk '{u=$2+$4; t=$2+$4+$5; if (NR==1){u1=u; t1=t;} else printf "%.0f", (u-u1)*100/(t-t1+1);}' /proc/stat 2>/dev/null || echo 35)
  mem=$(awk '/MemTotal/{t=$2} /MemAvailable/{a=$2} END{ if(t) printf "%.0f", (t-a)*100/t; else print 55}' /proc/meminfo 2>/dev/null || echo 55)
  disk=$(df -P / 2>/dev/null | awk 'NR==2{gsub(/%/,"",$5); print $5}' || echo 42)

  curl -fsS -X POST "${URL}/api/v1/ingest/heartbeat" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(cat <<EOF
{
  "universeId": "${UNIVERSE_ID}",
  "node": {
    "id": "${NODE_ID}",
    "name": "${HOST_NAME}",
    "status": "HEALTHY",
    "role": "TSERVER",
    "hostMetrics": { "cpuPct": ${cpu}, "memoryPct": ${mem}, "diskPct": ${disk} }
  },
  "agent": {
    "id": "${AGENT_ID}",
    "hostname": "${HOST_NAME}",
    "version": "1.0.0",
    "hostMetrics": { "cpuPct": ${cpu}, "memoryPct": ${mem}, "diskPct": ${disk} }
  }
}
EOF
)"
  echo ""
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) heartbeat ok node=${NODE_ID} universe=${UNIVERSE_ID}"
}

echo "Yuno agent starting → ${URL} (node=${NODE_ID})"
if [[ "$ONCE" -eq 1 ]]; then
  send_heartbeat
  exit 0
fi

while true; do
  send_heartbeat || echo "heartbeat failed; retrying..."
  sleep "${INTERVAL}"
done
