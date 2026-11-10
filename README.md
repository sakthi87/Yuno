# Yuno — YugabyteDB Unified Operations

Customer-space ops console for YugabyteDB estates: inventory, intelligent health, security, FinOps, and self-service integrations.

## Workplace run (no npm, no Docker) — ODP360 pattern

Prebuilt files live in **`offline/`** and on the [v1.2.0 GitHub Release](https://github.com/sakthi87/Yuno/releases/tag/v1.2.0).  
If the other environment has **no internet**, copy the repo **with `offline/`** (or use `./scripts/build-offline-bundle.sh`) — do not rely on `curl` there.

```bash
chmod +x scripts/*.sh
YUNO_OFFLINE_ONLY=1 ./scripts/download-prebuilt.sh   # extracts from offline/ — no network
./scripts/start-prebuilt.sh
```

Open **http://localhost:3001** — login `admin` / `admin`  
Stop: `./scripts/stop-prebuilt.sh`

Details: [RUN_WITHOUT_DOCKER.md](./RUN_WITHOUT_DOCKER.md) · [offline/README.md](./offline/README.md)

| Script | Role |
|--------|------|
| `scripts/download-prebuilt.sh` | Fetch portable Node + `node_modules` from GitHub Release |
| `scripts/start-prebuilt.sh` | Start API+UI in background (`logs/*.pid`) |
| `scripts/stop-prebuilt.sh` | Stop those processes |

## Build machine only (optional)

Publish release artifacts (not needed at workplace):

```bash
./scripts/package-prebuilt.sh
gh release upload v1.2.0 dist-prebuilt/yuno-runtime-*.tar.gz dist-prebuilt/frontend-dist.zip --clobber
```

Docker image packaging remains optional under [DOCKER_HUB.md](./DOCKER_HUB.md).

## Layout

| Path | Role |
|------|------|
| `backend/` | Express API + SQLite store |
| `frontend/` | React console (`dist/` = production UI) |
| `runtime/` | Created by download-prebuilt (portable Node) — not in git |
| `scripts/*-prebuilt.sh` | ODP360-style download / start / stop |
| `docs/` | Product target and checklists |
