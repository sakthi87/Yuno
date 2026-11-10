#!/usr/bin/env bash
set -euo pipefail

: "${REPO_ROOT:?}"
: "${YUNO_INSTALL_ROOT:?}"
: "${YUNO_CONFIG_PATH:?}"
: "${INSTALL_ROOT:?}"

source "$INSTALL_ROOT/lib/offline.sh" 2>/dev/null || true

API_TARGET="${YUNO_INSTALL_ROOT}/api"
BUNDLE_BACKEND="$INSTALL_ROOT/bundle/backend"
mkdir -p "$API_TARGET" "${YUNO_INSTALL_ROOT}/logs"

echo "[deploy-api] Deploying Platform API to ${API_TARGET}"

if [[ -d "$BUNDLE_BACKEND/node_modules" ]]; then
  echo "[deploy-api] Using offline bundle backend"
  rsync -a --delete "$BUNDLE_BACKEND/" "$API_TARGET/"
else
  echo "[deploy-api] Online build — npm install"
  cd "$REPO_ROOT/backend"
  npm ci --omit=dev
  mkdir -p "$API_TARGET"
  cp -R package.json package-lock.json src "$API_TARGET/" 2>/dev/null || cp package.json src "$API_TARGET/"
  cp -R node_modules "$API_TARGET/"
fi

install_portable_node || true

cat > "$API_TARGET/start.sh" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd "\$(dirname "\$0")"
export YUNO_CONFIG_PATH="${YUNO_CONFIG_PATH}"
set -a
source "${YUNO_CONFIG_PATH}"
set +a
exec node src/index.js
EOF
chmod +x "$API_TARGET/start.sh"

if [[ -f "$INSTALL_ROOT/api/yuno-api.service" ]]; then
  sed "s|@YUNO_INSTALL_ROOT@|${YUNO_INSTALL_ROOT}|g; s|@YUNO_CONFIG_PATH@|${YUNO_CONFIG_PATH}|g" \
    "$INSTALL_ROOT/api/yuno-api.service" | sudo tee /etc/systemd/system/yuno-api.service >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable yuno-api
  sudo systemctl restart yuno-api
  echo "[deploy-api] systemd service yuno-api started (binds 127.0.0.1 — use nginx for TLS)"
else
  nohup env YUNO_CONFIG_PATH="$YUNO_CONFIG_PATH" "$API_TARGET/start.sh" \
    > "${YUNO_INSTALL_ROOT}/logs/yuno-api.log" 2>&1 &
  sleep 3
fi

echo "[deploy-api] API deployed"
