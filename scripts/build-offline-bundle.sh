#!/usr/bin/env bash
# Build a USB / air-gap transfer bundle: source + prebuilt runtime tarballs.
# Run on a connected machine, then copy the output folder to the locked host.
#
#   ./scripts/build-offline-bundle.sh
#   # copy dist-offline/yuno-offline-<platform>/ to the other environment
#   # on that host: ./scripts/download-prebuilt.sh && ./scripts/start-prebuilt.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PLATFORM_FILTER="${1:-}"
OUT_ROOT="$ROOT/dist-offline"
mkdir -p "$ROOT/offline" "$OUT_ROOT"

if [[ ! -f dist-prebuilt/yuno-runtime-darwin-arm64.tar.gz ]] && [[ ! -f offline/yuno-runtime-darwin-arm64.tar.gz ]]; then
  echo "Packaging current platform runtime ..."
  ./scripts/package-prebuilt.sh
fi

# Refresh offline/ cache from dist-prebuilt
shopt -s nullglob
for f in dist-prebuilt/yuno-runtime-*.tar.gz dist-prebuilt/frontend-dist.zip; do
  [[ -f "$f" ]] || continue
  cp -f "$f" "$ROOT/offline/"
  echo "Cached $(basename "$f") -> offline/"
done

bundle_one() {
  local plat="$1"
  local asset="yuno-runtime-${plat}.tar.gz"
  local src=""
  if [[ -f "offline/$asset" ]]; then
    src="offline/$asset"
  elif [[ -f "dist-prebuilt/$asset" ]]; then
    src="dist-prebuilt/$asset"
  else
    echo "SKIP $plat — missing $asset (run package-prebuilt for that platform)"
    return 0
  fi

  local dest="$OUT_ROOT/yuno-offline-${plat}"
  echo "Building $dest ..."
  rm -rf "$dest"
  mkdir -p "$dest"

  # Copy repo without heavy/local junk
  rsync -a \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'backend/node_modules' \
    --exclude 'frontend/node_modules' \
    --exclude 'runtime' \
    --exclude 'backend/data' \
    --exclude 'logs' \
    --exclude 'dist-offline' \
    --exclude 'dist-prebuilt' \
    "$ROOT/" "$dest/"

  mkdir -p "$dest/offline"
  cp -f "$src" "$dest/offline/"
  if [[ -f offline/frontend-dist.zip ]]; then
    cp -f offline/frontend-dist.zip "$dest/offline/"
  elif [[ -f dist-prebuilt/frontend-dist.zip ]]; then
    cp -f dist-prebuilt/frontend-dist.zip "$dest/offline/"
  fi

  # Pre-extract so the air-gapped host can skip download-prebuilt if preferred
  tar -xzf "$src" -C "$dest"
  if [[ -f "$dest/offline/frontend-dist.zip" ]] && [[ ! -f "$dest/frontend/dist/index.html" ]]; then
    unzip -qo "$dest/offline/frontend-dist.zip" -d "$dest/frontend"
  fi

  chmod +x "$dest/scripts/"*.sh 2>/dev/null || true

  (cd "$OUT_ROOT" && tar -czf "yuno-offline-${plat}.tar.gz" "yuno-offline-${plat}")
  echo "  -> $OUT_ROOT/yuno-offline-${plat}.tar.gz ($(du -h "$OUT_ROOT/yuno-offline-${plat}.tar.gz" | awk '{print $1}'))"
}

if [[ -n "$PLATFORM_FILTER" ]]; then
  bundle_one "$PLATFORM_FILTER"
else
  for asset in offline/yuno-runtime-*.tar.gz dist-prebuilt/yuno-runtime-*.tar.gz; do
    [[ -f "$asset" ]] || continue
    base="$(basename "$asset")"
    plat="${base#yuno-runtime-}"
    plat="${plat%.tar.gz}"
    bundle_one "$plat"
  done
fi

echo ""
echo "Air-gap transfer:"
echo "  1) Copy dist-offline/yuno-offline-<platform>.tar.gz to the locked machine"
echo "  2) tar -xzf yuno-offline-<platform>.tar.gz && cd yuno-offline-<platform>"
echo "  3) ./scripts/start-prebuilt.sh"
echo "     (runtime already extracted; download-prebuilt.sh is optional)"
