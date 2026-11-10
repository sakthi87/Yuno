#!/usr/bin/env bash
# Build self-contained offline install bundle (run on internet-connected build machine)

set -euo pipefail

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(cd "$INSTALL_DIR/.." && pwd)"
BUNDLE="$INSTALL_DIR/bundle"
STAMP="$(date +%Y%m%d)"

echo "Building offline bundle into $BUNDLE"

rm -rf "$BUNDLE"
mkdir -p "$BUNDLE"/{backend,ui,packages,node,tls,docs}

echo "==> Backend runtime + node_modules"
cd "$ROOT/backend"
npm ci --omit=dev
mkdir -p "$BUNDLE/backend"
cp -R package.json package-lock.json src "$BUNDLE/backend/"
cp -R node_modules "$BUNDLE/backend/"

echo "==> Frontend production build"
cd "$ROOT/frontend"
npm ci
npm run build
cp -R dist "$BUNDLE/ui/"

echo "==> Install bundle metadata"
cat > "$BUNDLE/MANIFEST.json" <<EOF
{
  "product": "Yugabyte Platform",
  "bundleVersion": "1.0.0",
  "builtAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "builtFrom": "$ROOT",
  "contents": {
    "backend": "Node.js API + vendored node_modules",
    "ui": "Pre-built React static assets",
    "packages": "Place OS PostgreSQL + Node RPMs/DEBs here before air-gap transfer",
    "node": "Optional portable Node.js tarball for air-gapped hosts",
    "tls": "nginx TLS templates",
    "docs": "Installation and API reference copies"
  }
}
EOF

cp "$ROOT/yuno-install/docs/"*.md "$BUNDLE/docs/" 2>/dev/null || true
cp "$ROOT/docs/"*.md "$BUNDLE/docs/" 2>/dev/null || true

if [[ -f "$ROOT/yuno-install/docs/INSTALLATION_AND_SETUP.md" ]]; then
  cp "$ROOT/yuno-install/docs/INSTALLATION_AND_SETUP.md" "$BUNDLE/docs/"
fi
if [[ -f "$ROOT/yuno-install/docs/API_REFERENCE.md" ]]; then
  cp "$ROOT/yuno-install/docs/API_REFERENCE.md" "$BUNDLE/docs/"
fi

(
  cd "$BUNDLE"
  find . -type f ! -path './MANIFEST.json' -exec shasum -a 256 {} \; > CHECKSUMS.sha256
)

cat > "$BUNDLE/packages/README.md" <<'EOF'
# Offline OS packages

Copy platform-specific packages here **before** transferring the bundle to an air-gapped VM:

## Required (pick your OS)

### RHEL / Rocky / AlmaLinux 8+
- postgresql15-server
- postgresql15
- nodejs (if not using bundle/node portable tarball)

### Ubuntu 22.04 / 24.04
- postgresql
- postgresql-contrib
- nodejs (optional if using bundle/node)

## Optional
- nginx (recommended for TLS termination)

Install during setup:
```bash
sudo dnf install -y ./packages/*.rpm
# or
sudo dpkg -i ./packages/*.deb
```
EOF

cat > "$BUNDLE/node/README.md" <<'EOF'
# Portable Node.js (optional)

If the target VM has no Node.js, copy the official Linux x64 tarball here, e.g.:

- node-v20.18.0-linux-x64.tar.xz

The installer detects `bundle/node/node-v*-linux-x64` and links it to /opt/yuno/node.
EOF

echo "==> RHEL ${RHEL_MAJOR:-8} OS packages"
if [[ -f "$INSTALL_DIR/scripts/download-rhel-packages.sh" ]]; then
  export RHEL_MAJOR="${RHEL_MAJOR:-8}"
  bash "$INSTALL_DIR/scripts/download-rhel-packages.sh" || echo "WARN: Could not download RHEL RPMs — see packaging/rhel/RPM-LIST.md"
fi

echo "Offline bundle ready: $BUNDLE"
echo "Next: copy packages/*.rpm or *.deb, then tar -czf yuno-platform-offline-${STAMP}.tar.gz yuno-install/"
