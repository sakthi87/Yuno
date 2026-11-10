#!/usr/bin/env bash
# Install prebuilt Node runtime + backend/node_modules (+ UI) for start-prebuilt.sh.
#
# Offline-first (air-gapped workplace):
#   Looks in ./offline/ then ./dist-prebuilt/ — NO internet required if the
#   yuno-runtime-<platform>.tar.gz file is already present there.
#
# Online (optional):
#   If local file is missing, downloads from GitHub Release.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO="${YUNO_REPO:-sakthi87/Yuno}"
TAG="${YUNO_RELEASE_TAG:-v1.2.0}"
BASE="https://github.com/${REPO}/releases/download/${TAG}"
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

find_local_asset() {
  local name="$1"
  local candidate
  for candidate in \
    "$OFFLINE_DIR/$name" \
    "$ROOT/dist-prebuilt/$name" \
    "$ROOT/$name"
  do
    if [[ -f "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

ensure_asset() {
  local name="$1"
  local dest="$2"
  local local_path=""

  if local_path="$(find_local_asset "$name")"; then
    echo "Using local (offline) asset: $local_path"
    cp -f "$local_path" "$dest"
    return 0
  fi

  if [[ "${YUNO_OFFLINE_ONLY:-0}" == "1" ]]; then
    echo "ERROR: Offline-only mode and missing $name"
    echo "Place it in: $OFFLINE_DIR/$name"
    echo "On a connected machine, copy from GitHub Release $TAG or run:"
    echo "  ./scripts/package-prebuilt.sh && mkdir -p offline && cp dist-prebuilt/$name offline/"
    exit 1
  fi

  echo "Local $name not found — downloading from GitHub Release ..."
  echo "  $BASE/$name"
  if ! curl -fL --retry 3 --retry-delay 2 -o "$dest" "$BASE/$name"; then
    echo "ERROR: Could not download $name"
    echo "For air-gapped hosts, copy $name into $OFFLINE_DIR/ first."
    echo "Release page: https://github.com/${REPO}/releases/tag/${TAG}"
    exit 1
  fi
  echo "  -> $dest ($(du -h "$dest" | awk '{print $1}'))"
}

TMPDIR_DL="$(mktemp -d "${TMPDIR:-/tmp}/yuno-dl.XXXXXX")"
cleanup() { rm -rf "$TMPDIR_DL"; }
trap cleanup EXIT

echo "Platform: ${PLATFORM}"
echo "Looking for: ${RUNTIME_ASSET}"

ensure_asset "$RUNTIME_ASSET" "${TMPDIR_DL}/${RUNTIME_ASSET}"
echo "Extracting runtime + node_modules into repo root ..."
tar -xzf "${TMPDIR_DL}/${RUNTIME_ASSET}" -C "$ROOT"

if [[ "${SKIP_FRONTEND_ZIP:-0}" != "1" ]]; then
  if [[ ! -f frontend/dist/index.html ]] || [[ "${FORCE_FRONTEND_ZIP:-0}" == "1" ]]; then
    ensure_asset "frontend-dist.zip" "${TMPDIR_DL}/frontend-dist.zip"
    rm -rf frontend/dist
    unzip -qo "${TMPDIR_DL}/frontend-dist.zip" -d frontend
    echo "Extracted frontend/dist"
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

echo ""
echo "Prebuilt runtime installed for ${PLATFORM}."
echo "  Node:    $("$ROOT/runtime/bin/node" -v)"
echo "  Modules: backend/node_modules/"
echo "Start with:"
echo "  ./scripts/start-prebuilt.sh"
