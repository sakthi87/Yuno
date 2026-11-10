#!/usr/bin/env bash
set -euo pipefail

: "${YUNO_INSTALL_ROOT:?}"
: "${INSTALL_ROOT:?}"

UI_TARGET="${YUNO_INSTALL_ROOT}/ui"
BUNDLE_UI="$INSTALL_ROOT/bundle/ui/dist"
mkdir -p "$UI_TARGET"

if [[ -d "$BUNDLE_UI" ]]; then
  echo "[deploy-ui] Using offline pre-built UI from bundle"
  rsync -a --delete "$BUNDLE_UI/" "$UI_TARGET/"
else
  echo "[deploy-ui] Building frontend (requires npm/network)"
  cd "${REPO_ROOT:?}/frontend"
  npm ci
  npm run build
  rsync -a --delete dist/ "$UI_TARGET/"
fi

echo "[deploy-ui] UI deployed to ${UI_TARGET}"
