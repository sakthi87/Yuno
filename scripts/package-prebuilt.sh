#!/usr/bin/env bash
# Build machine only: create yuno-runtime-<platform>.tar.gz for GitHub Releases.
# Workplace machines only download + start-prebuilt (no npm).
#
#   ./scripts/package-prebuilt.sh                  # current OS/arch
#   ./scripts/package-prebuilt.sh --platform=linux-x64   # via Docker (build machine)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

NODE_VERSION="${YUNO_NODE_VERSION:-20.18.1}"
OUT_DIR="${ROOT}/dist-prebuilt"
PLATFORM=""
USE_DOCKER=false

for arg in "$@"; do
  case "$arg" in
    --platform=*) PLATFORM="${arg#--platform=}" ;;
    --docker) USE_DOCKER=true ;;
  esac
done

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

PLATFORM="${PLATFORM:-$(detect_platform)}"
ASSET="yuno-runtime-${PLATFORM}.tar.gz"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/yuno-pkg.XXXXXX")"
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

echo "Packaging ${ASSET} (Node ${NODE_VERSION})"

# Map to Node.js official tarball names
case "$PLATFORM" in
  darwin-arm64) NODE_DIST="node-v${NODE_VERSION}-darwin-arm64" ;;
  darwin-x64)   NODE_DIST="node-v${NODE_VERSION}-darwin-x64" ;;
  linux-x64)    NODE_DIST="node-v${NODE_VERSION}-linux-x64" ;;
  linux-arm64)  NODE_DIST="node-v${NODE_VERSION}-linux-arm64" ;;
  *) echo "ERROR: Unsupported platform $PLATFORM"; exit 1 ;;
esac

NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_DIST}.tar.gz"
mkdir -p "$STAGE/runtime" "$STAGE/backend" "$OUT_DIR"

echo "Downloading portable Node ${NODE_VERSION} (${PLATFORM}) ..."
curl -fL --retry 3 -o "$STAGE/node.tar.gz" "$NODE_URL"
tar -xzf "$STAGE/node.tar.gz" -C "$STAGE"
# Flatten to runtime/bin/node
mkdir -p "$STAGE/runtime/bin"
cp "$STAGE/${NODE_DIST}/bin/node" "$STAGE/runtime/bin/node"
chmod +x "$STAGE/runtime/bin/node"
# Workplace only needs the node binary (no npm).

cp "$ROOT/backend/package.json" "$STAGE/backend/"
cp "$ROOT/backend/package-lock.json" "$STAGE/backend/"

install_modules() {
  local work="$1"
  local host_npm
  echo "Installing backend production dependencies with bundled Node on PATH ..."
  host_npm="$(command -v npm || true)"
  if [[ -z "$host_npm" ]]; then
    echo "ERROR: npm is required on the build machine to create the prebuilt tarball."
    exit 1
  fi
  (
    cd "$work/backend"
    # Host npm + portable node on PATH so native addons match runtime/bin/node.
    PATH="$work/runtime/bin:$(dirname "$host_npm"):/usr/bin:/bin" "$host_npm" ci --omit=dev
  )
}

HOST_PLAT="$(detect_platform)"
if [[ "$PLATFORM" == "$HOST_PLAT" ]]; then
  install_modules "$STAGE"
elif [[ "$USE_DOCKER" == "true" ]] || command -v docker >/dev/null 2>&1; then
  echo "Cross-packaging ${PLATFORM} via Docker node:${NODE_VERSION} ..."
  # Use official node image matching arch when possible
  DOCKER_PLATFORM=""
  case "$PLATFORM" in
    linux-x64) DOCKER_PLATFORM="linux/amd64" ;;
    linux-arm64) DOCKER_PLATFORM="linux/arm64" ;;
    *)
      echo "ERROR: Cross-package for $PLATFORM needs to run on that OS (or extend script)."
      exit 1
      ;;
  esac
  docker run --rm --platform "$DOCKER_PLATFORM" \
    -v "$STAGE/backend:/app" \
    -w /app \
    "node:${NODE_VERSION}-bookworm" \
    bash -lc 'npm ci --omit=dev'
else
  echo "ERROR: Cannot build $PLATFORM on host $HOST_PLAT without Docker."
  echo "Re-run on the target OS, or: ./scripts/package-prebuilt.sh --platform=linux-x64 --docker"
  exit 1
fi

# Ensure frontend dist exists for the companion zip
if [[ ! -f frontend/dist/index.html ]]; then
  if command -v npm >/dev/null 2>&1; then
    npm run build --prefix frontend
  else
    echo "WARNING: frontend/dist missing — create frontend-dist.zip on a machine with Node."
  fi
fi

mkdir -p "$OUT_DIR"
tar -czf "$OUT_DIR/$ASSET" -C "$STAGE" runtime backend/node_modules backend/package.json backend/package-lock.json
if [[ -f frontend/dist/index.html ]]; then
  (cd frontend && zip -qr "$OUT_DIR/frontend-dist.zip" dist)
fi

echo ""
echo "Created:"
ls -lh "$OUT_DIR/$ASSET"
[[ -f "$OUT_DIR/frontend-dist.zip" ]] && ls -lh "$OUT_DIR/frontend-dist.zip"
echo ""
echo "Upload to GitHub Release ${YUNO_RELEASE_TAG:-v1.3.0}:"
echo "  gh release upload ${YUNO_RELEASE_TAG:-v1.3.0} dist-prebuilt/${ASSET} dist-prebuilt/frontend-dist.zip --clobber"
