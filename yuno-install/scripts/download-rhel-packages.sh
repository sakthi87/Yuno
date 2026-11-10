#!/usr/bin/env bash
# Download RHEL 8 / 8.10 compatible RPMs into offline bundle
set -euo pipefail

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$INSTALL_DIR/bundle/packages"
RHEL_MAJOR="${RHEL_MAJOR:-8}"
mkdir -p "$OUT_DIR"

echo "Downloading RHEL ${RHEL_MAJOR} packages to $OUT_DIR"

download_in_container() {
  local image="$1"
  docker run --rm -v "$OUT_DIR:/out:rw" "$image" bash -lc '
    set -euo pipefail
    dnf install -y dnf-plugins-core
    dnf config-manager --set-enabled powertools 2>/dev/null || dnf config-manager --set-enabled crb 2>/dev/null || true
    dnf module enable -y postgresql:15 2>/dev/null || dnf module enable -y postgresql:13 2>/dev/null || true
    cd /out
    rm -f *.rpm
    dnf download --resolve postgresql-server postgresql nginx openssl
    echo "Downloaded RPM count: $(ls -1 *.rpm 2>/dev/null | wc -l)"
  '
}

if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    if [[ "$RHEL_MAJOR" == "8" ]]; then
      download_in_container "rockylinux:8"
    else
      download_in_container "rockylinux:9"
    fi
    echo "RHEL ${RHEL_MAJOR} packages downloaded via Rocky Linux container"
    exit 0
  fi
  echo "Docker installed but daemon not running — skip container download"
fi

if command -v dnf >/dev/null 2>&1 && [[ -f /etc/redhat-release ]]; then
  cd "$OUT_DIR"
  dnf module enable -y postgresql:15 2>/dev/null || dnf module enable -y postgresql:13 2>/dev/null || true
  dnf download --resolve postgresql-server postgresql nginx openssl
  echo "RHEL packages downloaded on local host"
  exit 0
fi

cat <<EOF
Cannot auto-download RHEL ${RHEL_MAJOR} RPMs on this host.

Options:
  1. Start Docker and re-run (uses rockylinux:${RHEL_MAJOR})
  2. Run on a connected RHEL ${RHEL_MAJOR}.10 machine with internet
  3. Manually copy RPMs to: $OUT_DIR
     See packaging/rhel/RPM-LIST.md

Required: postgresql-server, postgresql, nginx, openssl
EOF
exit 1
