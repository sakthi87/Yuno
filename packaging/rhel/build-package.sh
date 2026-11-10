#!/usr/bin/env bash
# Build offline install tarball for RHEL 8.10 (air-gapped target)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INSTALL_DIR="$ROOT/yuno-install"
DIST_DIR="$ROOT/packaging/dist"
STAMP="$(date +%Y%m%d)"
TARBALL="yuno-platform-rhel810-${STAMP}.tar.gz"

export RHEL_MAJOR=8
export OFFLINE_INSTALL=true

cd "$ROOT"

echo "=============================================="
echo " Yugabyte Platform — RHEL 8.10 package build"
echo "=============================================="
echo "Target OS:  RHEL 8.10 (restricted / air-gapped)"
echo "Output:     packaging/dist/${TARBALL}"
echo

# 1. Application offline bundle (API + UI + node_modules)
bash "$INSTALL_DIR/scripts/build-offline-bundle.sh"

# 2. RHEL 8 RPMs (PostgreSQL + nginx) — needs Docker or RHEL host
echo
echo "==> Downloading RHEL 8 OS packages..."
if bash "$INSTALL_DIR/scripts/download-rhel-packages.sh"; then
  echo "RHEL 8 RPMs added to bundle/packages/"
else
  echo "WARN: RPM download skipped — add RPMs manually before transferring:"
  echo "      yuno-install/bundle/packages/"
  echo "      See packaging/rhel/RPM-LIST.md"
fi

# 3. Create transfer tarball (entire yuno-install tree)
mkdir -p "$DIST_DIR"
tar -czf "$DIST_DIR/$TARBALL" \
  --exclude='yuno-install/bundle/backend/node_modules/.cache' \
  -C "$ROOT" yuno-install

(
  cd "$DIST_DIR"
  shasum -a 256 "$TARBALL" > "${TARBALL}.sha256"
)

SIZE="$(du -h "$DIST_DIR/$TARBALL" | cut -f1)"

cat <<EOF

==============================================
 Package built successfully
==============================================
 File:     packaging/dist/${TARBALL}
 Size:     ${SIZE}
 Checksum: packaging/dist/${TARBALL}.sha256

 Transfer to RHEL 8.10 VM:
   scp packaging/dist/${TARBALL} user@vm:/tmp/

 On the VM:
   cd /tmp && tar -xzf ${TARBALL}
   cd yuno-install
   sudo OFFLINE_INSTALL=true ./install.sh

EOF
