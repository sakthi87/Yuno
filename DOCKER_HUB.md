# Yuno Docker Hub images

Precompiled image — **no npm / Node compile at workplace** (same pattern as ODP360).

## Image

| Image | Port | Role |
|-------|------|------|
| `{user}/yuno-platform` | 3001 | API + built UI (SQLite data volume) |

## Build (on a machine that can compile)

```bash
export DOCKERHUB_USER=sakthipsgit   # or your Hub user
export IMAGE_TAG=1.0.0

./scripts/build-docker-images.sh          # build only
docker login
./scripts/build-docker-images.sh --push   # build + push
```

## Run at workplace (pull only)

```bash
export DOCKERHUB_USER=sakthipsgit
export IMAGE_TAG=1.0.0

./scripts/download-prebuilt.sh
./scripts/start-prebuilt.sh
```

Or:

```bash
docker compose -f docker-compose.hub.yml pull
docker compose -f docker-compose.hub.yml up -d
```

Open: **http://localhost:3001**  
Login: `admin` / `admin`

Stop:

```bash
./scripts/stop-prebuilt.sh
```
