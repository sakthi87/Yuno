# Yuno — YugabyteDB Unified Operations

Customer-space ops console for YugabyteDB estates: inventory, intelligent health, security, FinOps, and self-service integrations.

## Workplace run (no npm, no Docker) — ODP360 pattern

Prebuilt files ship in **`offline/`** (tag [v1.3.0](https://github.com/sakthi87/Yuno/releases/tag/v1.3.0)).  
`download-prebuilt.sh` unpacks them locally — no network, no GitHub curl.

```bash
chmod +x scripts/*.sh
./scripts/download-prebuilt.sh   # extracts from offline/
./scripts/start-prebuilt.sh
```

Open **http://localhost:3001** — login `admin` / `admin`  
Stop: `./scripts/stop-prebuilt.sh`

Details: [RUN_WITHOUT_DOCKER.md](./RUN_WITHOUT_DOCKER.md) · [offline/README.md](./offline/README.md)

| Script | Role |
|--------|------|
| `scripts/download-prebuilt.sh` | Extract portable Node + `node_modules` + UI from `offline/` |
| `scripts/start-prebuilt.sh` | Start API+UI in background (`logs/*.pid`) |
| `scripts/stop-prebuilt.sh` | Stop those processes |

## Build machine only (optional)

Refresh `offline/` artifacts (not needed at workplace):

```bash
./scripts/package-prebuilt.sh
mkdir -p offline
cp dist-prebuilt/yuno-runtime-*.tar.gz dist-prebuilt/frontend-dist.zip offline/
gh release upload v1.3.0 dist-prebuilt/yuno-runtime-*.tar.gz dist-prebuilt/frontend-dist.zip --clobber
```

## Layout

| Path | Role |
|------|------|
| `backend/` | Express API + SQLite store |
| `frontend/` | React console (`dist/` = production UI) |
| `runtime/` | Created by download-prebuilt (portable Node) — not in git |
| `scripts/*-prebuilt.sh` | ODP360-style download / start / stop |
| `docs/` | Product target and checklists |
