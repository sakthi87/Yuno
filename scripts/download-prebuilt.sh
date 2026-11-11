#!/usr/bin/env bash
# Extract prebuilt Node runtime + backend/node_modules (+ UI) from ./offline/
# for start-prebuilt.sh. No network. No GitHub. No npm.
#
# Expects (shipped under offline/ in the repo / tag):
#   offline/yuno-runtime-<os-arch>.tar.gz
#   offline/frontend-dist.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OFFLINE_DIR="${YUNO_OFFLINE_DIR:-$ROOT/offline}"

detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "$os" in
    darwin) os="darwin" ;;
    linux) os="linux" ;;
    *) echo "ERROR: Unsupported OS: $os"; exit 1 ;;
  esac
  case "$arch" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *) echo "ERROR: Unsupported arch: $arch"; exit 1 ;;
  esac
  echo "${os}-${arch}"
}

PLATFORM="${YUNO_PLATFORM:-$(detect_platform)}"
RUNTIME_ASSET="yuno-runtime-${PLATFORM}.tar.gz"
RUNTIME_PATH="${OFFLINE_DIR}/${RUNTIME_ASSET}"
FRONTEND_ZIP="${OFFLINE_DIR}/frontend-dist.zip"

echo "Platform: ${PLATFORM}"
echo "Offline dir: ${OFFLINE_DIR}"

if [[ ! -f "$RUNTIME_PATH" ]]; then
  echo "ERROR: Missing ${RUNTIME_PATH}"
  echo "Clone/copy the full repo so offline/ contains ${RUNTIME_ASSET}"
  ls -la "$OFFLINE_DIR" 2>/dev/null || echo "(offline/ directory missing)"
  exit 1
fi

echo "Extracting ${RUNTIME_ASSET} → runtime/ + backend/node_modules/ ..."
tar -xzf "$RUNTIME_PATH" -C "$ROOT"

if [[ "${SKIP_FRONTEND_ZIP:-0}" != "1" ]]; then
  if [[ ! -f frontend/dist/index.html ]] || [[ "${FORCE_FRONTEND_ZIP:-0}" == "1" ]]; then
    if [[ ! -f "$FRONTEND_ZIP" ]]; then
      echo "ERROR: Missing ${FRONTEND_ZIP}"
      exit 1
    fi
    echo "Extracting frontend-dist.zip → frontend/dist/ ..."
    rm -rf frontend/dist
    unzip -qo "$FRONTEND_ZIP" -d frontend
  else
    echo "Keeping existing frontend/dist"
  fi
fi

if [[ ! -x "$ROOT/runtime/bin/node" ]]; then
  echo "ERROR: runtime/bin/node missing after extract"
  exit 1
fi
if [[ ! -d "$ROOT/backend/node_modules" ]]; then
  echo "ERROR: backend/node_modules missing after extract"
  exit 1
fi
if [[ ! -f "$ROOT/frontend/dist/index.html" ]]; then
  echo "ERROR: frontend/dist/index.html missing after extract"
  exit 1
fi

echo ""
echo "Prebuilt runtime installed for ${PLATFORM}."
echo "  Node:    $("$ROOT/runtime/bin/node" -v)"
echo "  Modules: backend/node_modules/"
echo "  UI:      frontend/dist/"
echo "Start with:"
echo "  ./scripts/start-prebuilt.sh"
