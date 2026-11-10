#!/usr/bin/env bash
# Build precompiled Yuno image for Docker Hub (ODP360-style).
# Requires Docker. Does not push unless --push is passed.
#
#   export DOCKERHUB_USER=sakthipsgit
#   ./scripts/build-docker-images.sh
#   ./scripts/build-docker-images.sh --push
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DOCKERHUB_USER="${DOCKERHUB_USER:-}"
IMAGE_TAG="${IMAGE_TAG:-1.0.0}"
PUSH=false

for arg in "$@"; do
  case "$arg" in
    --push) PUSH=true ;;
    --tag=*) IMAGE_TAG="${arg#--tag=}" ;;
    --user=*) DOCKERHUB_USER="${arg#--user=}" ;;
  esac
done

if [[ -z "$DOCKERHUB_USER" ]]; then
  echo "ERROR: Set DOCKERHUB_USER (your Docker Hub username), e.g.:"
  echo "  export DOCKERHUB_USER=sakthipsgit"
  echo "  ./scripts/build-docker-images.sh"
  exit 1
fi

if [[ ! -f frontend/dist/index.html ]]; then
  echo "Building frontend/dist (needed once on a machine with Node)..."
  if command -v npm >/dev/null 2>&1; then
    npm run build --prefix frontend
  else
    echo "ERROR: frontend/dist missing and npm not available."
    exit 1
  fi
fi

image="${DOCKERHUB_USER}/yuno-platform:${IMAGE_TAG}"
echo "=== Building ${image} ==="
docker build -t "$image" -t "${DOCKERHUB_USER}/yuno-platform:latest" .

echo ""
echo "Built:"
docker images --format 'table {{.Repository}}:{{.Tag}}\t{{.Size}}' | grep "${DOCKERHUB_USER}/yuno-platform" || true

if [[ "$PUSH" == "true" ]]; then
  echo ""
  echo "=== Pushing to Docker Hub ==="
  docker push "${DOCKERHUB_USER}/yuno-platform:${IMAGE_TAG}"
  docker push "${DOCKERHUB_USER}/yuno-platform:latest"
  echo "Push complete."
  echo "At workplace:"
  echo "  export DOCKERHUB_USER=${DOCKERHUB_USER}"
  echo "  export IMAGE_TAG=${IMAGE_TAG}"
  echo "  ./scripts/start-prebuilt.sh"
else
  echo ""
  echo "To push:"
  echo "  docker login"
  echo "  DOCKERHUB_USER=${DOCKERHUB_USER} ./scripts/build-docker-images.sh --push"
fi
